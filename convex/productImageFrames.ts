import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const frameStatus = v.union(v.literal("active"), v.literal("inactive"));
const frameSourceType = v.union(
  v.literal("system_preset"),
  v.literal("uploaded_overlay"),
  v.literal("line_generator"),
  v.literal("logo_generator")
);
const cornerStyle = v.union(
  v.literal("sharp"),
  v.literal("rounded"),
  v.literal("ornamental-light")
);
const legacyLogoPlacement = v.union(v.literal("center"), v.literal("corners"));

const lineConfig = v.object({
  strokeWidth: v.number(),
  inset: v.number(),
  radius: v.number(),
  color: v.string(),
  shadow: v.optional(v.string()),
  cornerStyle,
});

const legacyLogoConfig = v.object({
  logoUrl: v.string(),
  placement: legacyLogoPlacement,
  scale: v.number(),
  opacity: v.number(),
  inset: v.number(),
});

const logoConfig = v.union(
  v.object({
    logoUrl: v.string(),
    scale: v.number(),
    opacity: v.number(),
    x: v.number(),
    y: v.number(),
  }),
  legacyLogoConfig
);

const frameDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("productImageFrames"),
  name: v.string(),
  status: frameStatus,
  aspectRatio: v.string(),
  sourceType: frameSourceType,
  overlayImageUrl: v.optional(v.string()),
  overlayStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  lineConfig: v.optional(lineConfig),
  logoConfig: v.optional(logoConfig),
  seasonKey: v.optional(v.string()),
  isSystemPreset: v.boolean(),
  createdBy: v.optional(v.union(v.id("users"), v.null())),
  updatedBy: v.optional(v.union(v.id("users"), v.null())),
  metadata: v.optional(v.union(v.record(v.string(), v.any()), v.null())),
});

export const listByAspectRatio = query({
  args: { aspectRatio: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("productImageFrames")
      .withIndex("by_aspect_ratio", (q) => q.eq("aspectRatio", args.aspectRatio))
      .collect(),
  returns: v.array(frameDoc),
});

export const getById = query({
  args: { id: v.id("productImageFrames") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(frameDoc, v.null()),
});

export const createFrame = mutation({
  args: {
    name: v.string(),
    status: frameStatus,
    aspectRatio: v.string(),
    sourceType: frameSourceType,
    overlayImageUrl: v.optional(v.string()),
    overlayStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    lineConfig: v.optional(lineConfig),
    logoConfig: v.optional(logoConfig),
    seasonKey: v.optional(v.string()),
    isSystemPreset: v.boolean(),
    createdBy: v.optional(v.union(v.id("users"), v.null())),
    metadata: v.optional(v.union(v.record(v.string(), v.any()), v.null())),
  },
  handler: async (ctx, args) => ctx.db.insert("productImageFrames", {
      ...args,
      updatedBy: args.createdBy ?? null,
    }),
  returns: v.id("productImageFrames"),
});

export const updateFrame = mutation({
  args: {
    id: v.id("productImageFrames"),
    name: v.optional(v.string()),
    status: v.optional(frameStatus),
    overlayImageUrl: v.optional(v.union(v.string(), v.null())),
    overlayStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    lineConfig: v.optional(v.union(lineConfig, v.null())),
    logoConfig: v.optional(v.union(logoConfig, v.null())),
    seasonKey: v.optional(v.union(v.string(), v.null())),
    updatedBy: v.optional(v.union(v.id("users"), v.null())),
    metadata: v.optional(v.union(v.record(v.string(), v.any()), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const sanitizedPatch = {
      ...patch,
      overlayImageUrl: patch.overlayImageUrl ?? undefined,
      lineConfig: patch.lineConfig ?? undefined,
      logoConfig: patch.logoConfig ?? undefined,
      seasonKey: patch.seasonKey ?? undefined,
    };
    await ctx.db.patch(id, sanitizedPatch);
    return null;
  },
  returns: v.null(),
});

export const removeFrame = mutation({
  args: { id: v.id("productImageFrames") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const cloneFrame = mutation({
  args: { id: v.id("productImageFrames"), createdBy: v.optional(v.union(v.id("users"), v.null())) },
  handler: async (ctx, args) => {
    const frame = await ctx.db.get(args.id);
    if (!frame) {
      throw new Error("Frame not found");
    }
    const newId = await ctx.db.insert("productImageFrames", {
      name: `${frame.name} (Copy)`,
      status: frame.status,
      aspectRatio: frame.aspectRatio,
      sourceType: frame.sourceType,
      overlayImageUrl: frame.overlayImageUrl,
      overlayStorageId: frame.overlayStorageId ?? null,
      lineConfig: frame.lineConfig,
      logoConfig: frame.logoConfig,
      seasonKey: frame.seasonKey,
      isSystemPreset: false,
      createdBy: args.createdBy ?? null,
      updatedBy: args.createdBy ?? null,
      metadata: frame.metadata ?? null,
    });
    return newId;
  },
  returns: v.id("productImageFrames"),
});

export async function cleanupProductFramesByAspectRatio(
  ctx: MutationCtx,
  aspectRatio: string
): Promise<{ deletedIds: Id<"productImageFrames">[] }> {
  const frames = await ctx.db
    .query("productImageFrames")
    .collect();
  const toDelete = frames.filter((frame) => frame.aspectRatio !== aspectRatio);
  await Promise.all(toDelete.map((frame) => ctx.db.delete(frame._id)));
  return { deletedIds: toDelete.map((frame) => frame._id) };
}
