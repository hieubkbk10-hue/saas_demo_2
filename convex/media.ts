import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getExtensionFromMime } from "../lib/image/uploadNaming";

// ============ VALIDATORS ============
const mediaDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("images"),
  alt: v.optional(v.string()),
  extension: v.optional(v.string()),
  filename: v.string(),
  folder: v.optional(v.string()),
  height: v.optional(v.number()),
  mimeType: v.string(),
  size: v.number(),
  storageId: v.id("_storage"),
  uploadedBy: v.optional(v.id("users")),
  width: v.optional(v.number()),
});

const mediaWithUrl = v.object({
  _creationTime: v.number(),
  _id: v.id("images"),
  alt: v.optional(v.string()),
  extension: v.optional(v.string()),
  filename: v.string(),
  folder: v.optional(v.string()),
  height: v.optional(v.number()),
  mimeType: v.string(),
  size: v.number(),
  storageId: v.id("_storage"),
  uploadedBy: v.optional(v.id("users")),
  url: v.union(v.string(), v.null()),
  width: v.optional(v.number()),
});

// ============ HELPER FUNCTIONS ============

// Get media type key from mimeType
function getMediaTypeKey(mimeType: string): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) {return "image";}
  if (mimeType.startsWith("video/")) {return "video";}
  if (mimeType === "application/pdf" || mimeType.includes("document") || mimeType.includes("spreadsheet")) {
    return "document";
  }
  return "other";
}

function getExtensionFromFilename(filename: string): string | undefined {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1];
}

function resolveExtension(filename: string, mimeType: string): string {
  const byName = getExtensionFromFilename(filename);
  if (byName) {
    return byName;
  }
  const ext = getExtensionFromMime(mimeType);
  if (ext !== "bin") {
    return ext;
  }
  const fallback = mimeType.split("/")[1];
  if (!fallback) {
    return "bin";
  }
  return fallback.replace("+xml", "").replace("jpeg", "jpg");
}

// Update mediaStats counter (increment or decrement)
async function updateMediaStats(
  ctx: MutationCtx,
  typeKey: "total" | "image" | "video" | "document" | "other",
  countDelta: number,
  sizeDelta: number
) {
  const existing = await ctx.db
    .query("mediaStats")
    .withIndex("by_key", (q) => q.eq("key", typeKey))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      count: Math.max(0, existing.count + countDelta),
      totalSize: Math.max(0, existing.totalSize + sizeDelta),
    });
  } else if (countDelta > 0) {
    await ctx.db.insert("mediaStats", {
      count: countDelta,
      key: typeKey,
      totalSize: sizeDelta,
    });
  }
}

// Update mediaFolders counter
async function updateMediaFolder(
  ctx: MutationCtx,
  folderName: string | undefined,
  countDelta: number
) {
  if (!folderName) {return;}

  const existing = await ctx.db
    .query("mediaFolders")
    .withIndex("by_name", (q) => q.eq("name", folderName))
    .first();

  if (existing) {
    const newCount = existing.count + countDelta;
    if (newCount <= 0) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, { count: newCount });
    }
  } else if (countDelta > 0) {
    await ctx.db.insert("mediaFolders", { count: countDelta, name: folderName });
  }
}

// ============ QUERIES ============

// List with pagination
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("images").order("desc").paginate(args.paginationOpts),
  returns: v.any(),
});

export const listForBackfill = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("images").order("desc").paginate(args.paginationOpts),
  returns: v.any(),
});

// List all (for System Config preview - limited)
export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("images").order("desc").take(100),
  returns: v.array(mediaDoc),
});

// List with URLs (for Admin grid view)
export const listWithUrls = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const images = await ctx.db.query("images").order("desc").take(limit);
    
    return  Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );
  },
  returns: v.array(mediaWithUrl),
});

// Get by ID
export const getById = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(mediaDoc, v.null()),
});

// Get by ID with URL
export const getByIdWithUrl = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.id);
    if (!image) {return null;}
    const url = await ctx.storage.getUrl(image.storageId);
    return { ...image, url };
  },
  returns: v.union(mediaWithUrl, v.null()),
});

// List by folder with pagination
export const listByFolder = query({
  args: { folder: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("images")
      .withIndex("by_folder", (q) => q.eq("folder", args.folder))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(mediaDoc),
  }),
});

// List by mimeType with pagination
export const listByMimeType = query({
  args: { mimeType: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("images")
      .withIndex("by_mimeType", (q) => q.eq("mimeType", args.mimeType))
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(mediaDoc),
  }),
});

// List by uploader
export const listByUploader = query({
  args: { paginationOpts: paginationOptsValidator, uploadedBy: v.id("users") },
  handler: async (ctx, args) => ctx.db
      .query("images")
      .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", args.uploadedBy))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(mediaDoc),
  }),
});

// Get URL from storageId
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => ctx.storage.getUrl(args.storageId),
  returns: v.union(v.string(), v.null()),
});

// Get all folders (optimized - reads from mediaFolders table)
export const getFolders = query({
  args: {},
  handler: async (ctx) => {
    const folders = await ctx.db.query("mediaFolders").collect();
    return folders.map(f => f.name).sort();
  },
  returns: v.array(v.string()),
});

// Get statistics (optimized - reads from mediaStats counter table)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("mediaStats").collect();
    const statsMap = new Map(stats.map(s => [s.key, s]));

    const total = statsMap.get("total");
    const image = statsMap.get("image");
    const video = statsMap.get("video");
    const document = statsMap.get("document");
    const other = statsMap.get("other");

    return {
      documentCount: document?.count ?? 0,
      imageCount: image?.count ?? 0,
      otherCount: other?.count ?? 0,
      totalCount: total?.count ?? 0,
      totalSize: total?.totalSize ?? 0,
      videoCount: video?.count ?? 0,
    };
  },
  returns: v.object({
    documentCount: v.number(),
    imageCount: v.number(),
    otherCount: v.number(),
    totalCount: v.number(),
    totalSize: v.number(),
    videoCount: v.number(),
  }),
});

// Count media (optimized - reads from counter tables)
export const count = query({
  args: { folder: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.folder) {
      const folderName = args.folder;
      const folderRecord = await ctx.db
        .query("mediaFolders")
        .withIndex("by_name", (q) => q.eq("name", folderName))
        .first();
      return folderRecord?.count ?? 0;
    }
    const totalStat = await ctx.db
      .query("mediaStats")
      .withIndex("by_key", (q) => q.eq("key", "total"))
      .first();
    return totalStat?.count ?? 0;
  },
  returns: v.number(),
});

// ============ MUTATIONS ============

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
  returns: v.string(),
});

// Create media record
export const create = mutation({
  args: {
    alt: v.optional(v.string()),
    filename: v.string(),
    folder: v.optional(v.string()),
    height: v.optional(v.number()),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    uploadedBy: v.optional(v.id("users")),
    width: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const extension = resolveExtension(args.filename, args.mimeType);
    const id = await ctx.db.insert("images", { ...args, extension });
    const url = await ctx.storage.getUrl(args.storageId);

    // Update counters
    const typeKey = getMediaTypeKey(args.mimeType);
    await updateMediaStats(ctx, "total", 1, args.size);
    await updateMediaStats(ctx, typeKey, 1, args.size);
    await updateMediaFolder(ctx, args.folder, 1);

    return { id, url };
  },
  returns: v.object({
    id: v.id("images"),
    url: v.union(v.string(), v.null()),
  }),
});

export const patchExtension = mutation({
  args: {
    id: v.id("images"),
    extension: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { extension: args.extension });
    return null;
  },
  returns: v.null(),
});

// Update media metadata
export const update = mutation({
  args: {
    alt: v.optional(v.string()),
    filename: v.optional(v.string()),
    folder: v.optional(v.string()),
    id: v.id("images"),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const media = await ctx.db.get(id);
    if (!media) {throw new Error("Media not found");}
    
    // Filter out undefined values
    const filteredUpdates: Record<string, string> = {};
    if (updates.filename !== undefined) {filteredUpdates.filename = updates.filename;}
    if (updates.alt !== undefined) {filteredUpdates.alt = updates.alt;}
    if (updates.folder !== undefined) {filteredUpdates.folder = updates.folder;}
    
    // Update folder counter if folder changed
    if (updates.folder !== undefined && updates.folder !== media.folder) {
      await updateMediaFolder(ctx, media.folder, -1); // Decrement old folder
      await updateMediaFolder(ctx, updates.folder, 1);  // Increment new folder
    }
    
    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
  returns: v.null(),
});

// Remove single media
export const remove = mutation({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    if (!media) {throw new Error("Media not found");}
    
    try {
      await ctx.storage.delete(media.storageId);
    } catch {
      // Storage file might already be deleted
    }
    await ctx.db.delete(args.id);

    // Update counters
    const typeKey = getMediaTypeKey(media.mimeType);
    await updateMediaStats(ctx, "total", -1, -media.size);
    await updateMediaStats(ctx, typeKey, -1, -media.size);
    await updateMediaFolder(ctx, media.folder, -1);

    return null;
  },
  returns: v.null(),
});

// Bulk remove (optimized - batch load to avoid N+1)
export const bulkRemove = mutation({
  args: { ids: v.array(v.id("images")) },
  handler: async (ctx, args) => {
    // Batch load all media items (avoid N+1)
    const mediaItems = await Promise.all(args.ids.map( async id => ctx.db.get(id)));
    const validItems = mediaItems.filter((m): m is NonNullable<typeof m> => m !== null);

    // Aggregate counter updates
    type MediaStatsKey = "total" | "image" | "video" | "document" | "other";
    const statsUpdates: Record<MediaStatsKey, { count: number; size: number }> = {
      document: { count: 0, size: 0 },
      image: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
      total: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
    };
    const folderUpdates: Record<string, number> = {};

    // Delete items and aggregate stats
    for (const media of validItems) {
      try {
        await ctx.storage.delete(media.storageId);
      } catch {
        // Storage file might already be deleted
      }
      await ctx.db.delete(media._id);

      // Aggregate counter changes
      const typeKey = getMediaTypeKey(media.mimeType);
      statsUpdates.total.count++;
      statsUpdates.total.size += media.size;
      statsUpdates[typeKey].count++;
      statsUpdates[typeKey].size += media.size;
      if (media.folder) {
        folderUpdates[media.folder] = (folderUpdates[media.folder] || 0) + 1;
      }
    }

    // Batch update mediaStats
    for (const key of Object.keys(statsUpdates) as MediaStatsKey[]) {
      const { count, size } = statsUpdates[key];
      if (count > 0) {
        await updateMediaStats(ctx, key, -count, -size);
      }
    }

    // Batch update mediaFolders
    for (const [folder, count] of Object.entries(folderUpdates)) {
      await updateMediaFolder(ctx, folder, -count);
    }

    return validItems.length;
  },
  returns: v.number(),
});
