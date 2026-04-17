import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ============ CONSTANTS ============
const CART_DEFAULTS = {
  CLEANUP_BATCH_SIZE: 100,
  EXPIRY_DAYS: 7,
  ITEMS_PER_PAGE: 20,
  MAX_ITEMS_PER_CART: 50,
  MAX_ITEMS_PER_PAGE: 100,
} as const;

const cartStatus = v.union(
  v.literal("Active"),
  v.literal("Converted"),
  v.literal("Abandoned")
);

const cartDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("carts"),
  customerId: v.optional(v.id("customers")),
  expiresAt: v.optional(v.number()),
  itemsCount: v.number(),
  note: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  status: cartStatus,
  totalAmount: v.number(),
});

const cartItemDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("cartItems"),
  cartId: v.id("carts"),
  price: v.number(),
  productId: v.id("products"),
  productImage: v.optional(v.string()),
  productName: v.string(),
  quantity: v.number(),
  subtotal: v.number(),
  variantId: v.optional(v.id("productVariants")),
});

async function getVariantPricingSetting(ctx: MutationCtx): Promise<"product" | "variant"> {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", "variantPricing"))
    .unique();
  return (setting?.value as "product" | "variant") ?? "variant";
}

async function getVariantStockSetting(ctx: MutationCtx): Promise<"product" | "variant"> {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", "variantStock"))
    .unique();
  return (setting?.value as "product" | "variant") ?? "variant";
}

async function isStockCheckEnabled(ctx: MutationCtx): Promise<boolean> {
  const feature = await ctx.db
    .query("moduleFeatures")
    .withIndex("by_module_feature", (q) => q.eq("moduleKey", "products").eq("featureKey", "enableStock"))
    .unique();
  return feature?.enabled ?? false;
}

// ============ CART QUERIES ============

// FIX Issue #1: Added limit parameter with default
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db
      .query("carts")
      .order("desc")
      .take(limit);
  },
});

// FIX Issue #1: Added paginated query for server-side pagination (Issue #7)
export const listPaginated = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    status: v.optional(cartStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    
    const results = args.status
      ? await ctx.db.query("carts")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .paginate({ cursor: args.cursor ?? null, numItems: limit })
      : await ctx.db.query("carts")
          .order("desc")
          .paginate({ cursor: args.cursor ?? null, numItems: limit });
    
    return {
      isDone: results.isDone,
      items: results.page,
      nextCursor: results.continueCursor,
    };
  },
});

export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);
  },
});

export const listAbandoned = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Abandoned"))
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(cartDoc, v.null()),
});

export const getByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => ctx.db
      .query("carts")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .filter((q) => q.eq(q.field("status"), "Active"))
      .first(),
  returns: v.union(cartDoc, v.null()),
});

export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("status"), "Active"))
      .first(),
  returns: v.union(cartDoc, v.null()),
});

// FIX Issue #3 & #10: Added limit to prevent fetching ALL
export const countByStatus = query({
  args: { status: cartStatus },
  handler: async (ctx, args) => {
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .take(10_000);
    return carts.length;
  },
  returns: v.number(),
});

// FIX Issue #10: Added limit to prevent fetching ALL
export const getTotalValue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .take(limit);
    return carts.reduce((sum, cart) => sum + cart.totalAmount, 0);
  },
  returns: v.number(),
});

// FIX Issue #3: Added limit to prevent fetching ALL
export const count = query({
  args: { status: v.optional(cartStatus) },
  handler: async (ctx, args) => {
    if (args.status) {
      const carts = await ctx.db
        .query("carts")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(10_000);
      return carts.length;
    }
    const carts = await ctx.db.query("carts").take(10_000);
    return carts.length;
  },
  returns: v.number(),
});

// Get statistics efficiently - all counts in one query
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [active, abandoned, converted] = await Promise.all([
      ctx.db.query("carts").withIndex("by_status", (q) => q.eq("status", "Active")).take(10_000),
      ctx.db.query("carts").withIndex("by_status", (q) => q.eq("status", "Abandoned")).take(10_000),
      ctx.db.query("carts").withIndex("by_status", (q) => q.eq("status", "Converted")).take(10_000),
    ]);
    
    const totalValue = active.reduce((sum, cart) => sum + cart.totalAmount, 0);
    
    return {
      abandoned: abandoned.length,
      active: active.length,
      converted: converted.length,
      total: active.length + abandoned.length + converted.length,
      totalValue,
    };
  },
});

// ============ CART ITEM QUERIES ============

export const listCartItems = query({
  args: { cartId: v.id("carts") },
  handler: async (ctx, args) => ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect(),
  returns: v.array(cartItemDoc),
});

// FIX Issue #2: Added limit to prevent fetching ALL items
export const listAllItems = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db.query("cartItems").order("desc").take(limit);
  },
});

// Count all items efficiently
export const countAllItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("cartItems").take(10_000);
    return items.length;
  },
  returns: v.number(),
});

// ============ CART MUTATIONS ============

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    expiresAt: v.optional(v.number()),
    note: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let {expiresAt} = args;
    if (!expiresAt) {
      const expirySetting = await ctx.db
        .query("moduleSettings")
        .withIndex("by_module", (q) => q.eq("moduleKey", "cart"))
        .filter((q) => q.eq(q.field("settingKey"), "expiryDays"))
        .first();
      const expiryDays = (expirySetting?.value as number) ?? CART_DEFAULTS.EXPIRY_DAYS;
      expiresAt = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
    }

    return  ctx.db.insert("carts", {
      customerId: args.customerId,
      expiresAt,
      itemsCount: 0,
      note: args.note,
      sessionId: args.sessionId,
      status: "Active",
      totalAmount: 0,
    });
  },
  returns: v.id("carts"),
});

export const updateStatus = mutation({
  args: { id: v.id("carts"), status: cartStatus },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
  returns: v.null(),
});

export const updateNote = mutation({
  args: { id: v.id("carts"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { note: args.note });
    return null;
  },
  returns: v.null(),
});

export const markAsAbandoned = mutation({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { status: "Abandoned" });
    return null;
  },
  returns: v.null(),
});

export const markAsConverted = mutation({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { status: "Converted" });
    return null;
  },
  returns: v.null(),
});

// FIX Issue #4: Use Promise.all instead of sequential loop
export const remove = mutation({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.id))
      .collect();
    
    // FIX: Parallel delete instead of sequential
    await Promise.all(items.map( async item => ctx.db.delete(item._id)));
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

// ============ CART ITEM MUTATIONS ============

// FIX Issue #11: Added quantity validation
export const addItem = mutation({
  args: {
    cartId: v.id("carts"),
    productId: v.id("products"),
    quantity: v.number(),
    variantId: v.optional(v.id("productVariants")),
  },
  handler: async (ctx, args) => {
    // FIX Issue #11: Validate quantity > 0
    if (args.quantity <= 0) {
      return { ok: false, error: "Quantity must be greater than 0" };
    }

    const cart = await ctx.db.get(args.cartId);
    if (!cart) {
      return { ok: false, error: "Cart not found" };
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      return { ok: false, error: "Product not found" };
    }

    let variant = null;
    if (product.hasVariants) {
      if (!args.variantId) {
        return { ok: false, error: "Vui lòng chọn phiên bản sản phẩm" };
      }
      variant = await ctx.db.get(args.variantId);
      if (!variant || variant.productId !== args.productId) {
        return { ok: false, error: "Phiên bản không hợp lệ" };
      }
    } else if (args.variantId) {
      return { ok: false, error: "Sản phẩm không hỗ trợ phiên bản" };
    }

    const [variantStock, stockCheckEnabled] = await Promise.all([
      getVariantStockSetting(ctx),
      isStockCheckEnabled(ctx),
    ]);

    const maxItemsSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module", (q) => q.eq("moduleKey", "cart"))
      .filter((q) => q.eq(q.field("settingKey"), "maxItemsPerCart"))
      .first();
    const maxItems = (maxItemsSetting?.value as number) ?? CART_DEFAULTS.MAX_ITEMS_PER_CART;

    const existingItem = await ctx.db
      .query("cartItems")
      .withIndex("by_cart_product_variant", (q) =>
        q.eq("cartId", args.cartId).eq("productId", args.productId).eq("variantId", args.variantId)
      )
      .first();

    const targetQuantity = (existingItem?.quantity ?? 0) + args.quantity;
    if (stockCheckEnabled) {
      const stockValue = variantStock === "variant" && variant?.stock !== undefined
        ? variant.stock
        : product.stock;
      if (stockValue !== undefined && targetQuantity > stockValue) {
        return { ok: false, error: `Không đủ hàng trong kho cho ${product.name}. Còn lại: ${stockValue}` };
      }
    }

    if (existingItem) {
      const newSubtotal = existingItem.price * targetQuantity;
      await ctx.db.patch(existingItem._id, {
        quantity: targetQuantity,
        subtotal: newSubtotal,
      });
      await recalculateCart(ctx, args.cartId);
      return { ok: true, itemId: existingItem._id };
    }

    const currentItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect();
    if (currentItems.length >= maxItems) {
      return { ok: false, error: `Giỏ hàng đã đạt giới hạn ${maxItems} sản phẩm` };
    }

    const variantPricing = product.hasVariants ? await getVariantPricingSetting(ctx) : "product";
    const basePrice = variantPricing === "variant" && variant
      ? (variant.salePrice ?? variant.price ?? product.salePrice ?? product.price)
      : (product.salePrice ?? product.price);
    const price = basePrice ?? product.price;
    const itemId = await ctx.db.insert("cartItems", {
      cartId: args.cartId,
      price,
      productId: args.productId,
      productImage: product.image,
      productName: product.name,
      quantity: args.quantity,
      subtotal: price * args.quantity,
      variantId: args.variantId,
    });

    await recalculateCart(ctx, args.cartId);
    return { ok: true, itemId };
  },
  returns: v.object({
    ok: v.boolean(),
    itemId: v.optional(v.id("cartItems")),
    error: v.optional(v.string()),
  }),
});

export const updateItemQuantity = mutation({
  args: {
    itemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      return { ok: false, error: "Cart item not found" };
    }

    if (args.quantity > 0) {
      const [product, variantStock, stockCheckEnabled] = await Promise.all([
        ctx.db.get(item.productId),
        getVariantStockSetting(ctx),
        isStockCheckEnabled(ctx),
      ]);

      if (!product) {
        return { ok: false, error: "Product not found" };
      }

      if (stockCheckEnabled) {
        let stockValue = product.stock;
        if (variantStock === "variant" && item.variantId) {
          const variant = await ctx.db.get(item.variantId);
          if (variant?.stock !== undefined) {
            stockValue = variant.stock;
          }
        }

        if (stockValue !== undefined && args.quantity > stockValue) {
          return { ok: false, error: `Không đủ hàng trong kho cho ${product.name}. Còn lại: ${stockValue}` };
        }
      }
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(args.itemId);
    } else {
      await ctx.db.patch(args.itemId, {
        quantity: args.quantity,
        subtotal: item.price * args.quantity,
      });
    }

    await recalculateCart(ctx, item.cartId);
    return { ok: true };
  },
  returns: v.object({
    ok: v.boolean(),
    error: v.optional(v.string()),
  }),
});

export const removeItem = mutation({
  args: { itemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {throw new Error("Cart item not found");}

    await ctx.db.delete(args.itemId);
    await recalculateCart(ctx, item.cartId);
    return null;
  },
  returns: v.null(),
});

// FIX Issue #5: Use Promise.all instead of sequential loop
export const clearCart = mutation({
  args: { cartId: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.cartId);
    if (!cart) {throw new Error("Cart not found");}

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect();
    
    // FIX: Parallel delete instead of sequential
    await Promise.all(items.map( async item => ctx.db.delete(item._id)));
    await ctx.db.patch(args.cartId, { itemsCount: 0, totalAmount: 0 });
    return null;
  },
  returns: v.null(),
});

async function recalculateCart(ctx: MutationCtx, cartId: Id<"carts">) {
  const items = await ctx.db
    .query("cartItems")
    .withIndex("by_cart", (q) => q.eq("cartId", cartId))
    .collect();

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  await ctx.db.patch(cartId, { itemsCount, totalAmount });
}

// ============ CLEANUP MUTATIONS ============

// FIX Issue #6: Use Promise.all with batch size limit
export const cleanupExpiredCarts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredCarts = await ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .filter((q) => 
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .take(CART_DEFAULTS.CLEANUP_BATCH_SIZE);

    // FIX: Parallel patch instead of sequential
    await Promise.all(
      expiredCarts.map( async cart => ctx.db.patch(cart._id, { status: "Abandoned" }))
    );

    return expiredCarts.length;
  },
  returns: v.number(),
});
