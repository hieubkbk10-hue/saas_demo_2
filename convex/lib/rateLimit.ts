import type { MutationCtx, QueryCtx } from "../_generated/server";

// Rate limit configs - thoải mái nhưng vẫn bảo vệ
export const RATE_LIMITS = {
  // Dangerous mutations - stricter
  dangerous: { refillInterval: 60_000, refillRate: 1, tokens: 10 }, // 10 per minute, refill 1/min
  
  // Normal mutations - relaxed
  mutation: { refillInterval: 60_000, refillRate: 10, tokens: 100 }, // 100 per minute, refill 10/min
  
  // Queries - very relaxed
  query: { refillInterval: 60_000, refillRate: 50, tokens: 500 }, // 500 per minute
  
  // Auth attempts - moderate
  auth: { refillInterval: 60_000, refillRate: 1, tokens: 5 }, // 5 per minute
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

// Dangerous mutations list
const DANGEROUS_MUTATIONS = [
  "seedAll", "clearAll", "bulkRemove", "remove",
  "clearPostsData", "clearProductsData", "clearPromotionsData",
  "seedPostsModule", "seedProductsModule", "seedPromotionsModule",
];

export function getRateLimitType(mutationName: string): RateLimitType {
  if (DANGEROUS_MUTATIONS.some(d => mutationName.includes(d))) {
    return "dangerous";
  }
  if (mutationName.includes("Login") || mutationName.includes("verify")) {
    return "auth";
  }
  return "mutation";
}

export async function checkRateLimit(
  ctx: MutationCtx | QueryCtx,
  identifier: string,
  type: RateLimitType = "mutation"
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  const bucket = await ctx.db
    .query("rateLimitBuckets")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  
  if (!bucket) {
    // New bucket - allow and create
    return { allowed: true, remaining: config.tokens - 1, resetIn: config.refillInterval };
  }
  
  // Calculate refilled tokens
  const timePassed = now - bucket.lastRefill;
  const refillCount = Math.floor(timePassed / config.refillInterval);
  const refilledTokens = Math.min(
    config.tokens,
    bucket.tokens + refillCount * config.refillRate
  );
  
  if (refilledTokens <= 0) {
    const resetIn = config.refillInterval - (timePassed % config.refillInterval);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  return { 
    allowed: true, 
    remaining: refilledTokens - 1, 
    resetIn: config.refillInterval 
  };
}

export async function consumeRateLimit(
  ctx: MutationCtx,
  identifier: string,
  type: RateLimitType = "mutation"
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  const bucket = await ctx.db
    .query("rateLimitBuckets")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  
  if (!bucket) {
    // Create new bucket
    await ctx.db.insert("rateLimitBuckets", {
      key,
      lastRefill: now,
      tokens: config.tokens - 1,
    });
    return { allowed: true, remaining: config.tokens - 1, resetIn: config.refillInterval };
  }
  
  // Calculate refilled tokens
  const timePassed = now - bucket.lastRefill;
  const refillCount = Math.floor(timePassed / config.refillInterval);
  let currentTokens = Math.min(
    config.tokens,
    bucket.tokens + refillCount * config.refillRate
  );
  
  if (currentTokens <= 0) {
    const resetIn = config.refillInterval - (timePassed % config.refillInterval);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  // Consume token
  currentTokens -= 1;
  await ctx.db.patch(bucket._id, {
    lastRefill: refillCount > 0 ? now : bucket.lastRefill,
    tokens: currentTokens,
  });
  
  return { 
    allowed: true, 
    remaining: currentTokens, 
    resetIn: config.refillInterval 
  };
}

// Helper to get client identifier (for future use with actual client IP)
export function getClientIdentifier(): string {
  // In real implementation, this would get client IP or user ID
  // For now, use a global identifier
  return "global";
}
