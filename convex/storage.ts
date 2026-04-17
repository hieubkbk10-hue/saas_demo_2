import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getExtensionFromMime } from "../lib/image/uploadNaming";

const getExtensionFromFilename = (filename: string) => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1];
};

const resolveExtension = (filename: string, mimeType: string) => {
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
};

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return  ctx.storage.generateUploadUrl();
  },
  returns: v.string(),
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return  ctx.storage.getUrl(args.storageId);
  },
  returns: v.union(v.string(), v.null()),
});

export const saveImage = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    alt: v.optional(v.string()),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const extension = resolveExtension(args.filename, args.mimeType);
    const id = await ctx.db.insert("images", {
      storageId: args.storageId,
      filename: args.filename,
      extension,
      mimeType: args.mimeType,
      size: args.size,
      width: args.width,
      height: args.height,
      alt: args.alt,
      folder: args.folder,
    });
    const url = await ctx.storage.getUrl(args.storageId);
    return { id, url };
  },
  returns: v.object({
    id: v.id("images"),
    url: v.union(v.string(), v.null()),
  }),
});

export const deleteImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // Delete from storage
    await ctx.storage.delete(args.storageId);
    
    // Delete from images table if exists
    const image = await ctx.db
      .query("images")
      .filter(q => q.eq(q.field("storageId"), args.storageId))
      .first();
    if (image) {
      await ctx.db.delete(image._id);
    }
    
    return null;
  },
  returns: v.null(),
});

export const cleanupStorageIfUnreferenced = mutation({
  args: { storageId: v.id("_storage"), maxScan: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxScan = args.maxScan ?? 1000;
    const products = await ctx.db.query("products").take(maxScan);
    const posts = await ctx.db.query("posts").take(maxScan);
    const services = await ctx.db.query("services").take(maxScan);

    const hitScanLimit = products.length === maxScan || posts.length === maxScan || services.length === maxScan;
    if (hitScanLimit) {
      return { deleted: false, reason: "scan_limit" as const };
    }

    const isUsedInProducts = products.some((product) =>
      product.imageStorageId === args.storageId
      || (product.imageStorageIds ?? []).some((storageId) => storageId === args.storageId)
    );
    const isUsedInPosts = posts.some((post) => post.thumbnailStorageId === args.storageId);
    const isUsedInServices = services.some((service) => service.thumbnailStorageId === args.storageId);

    if (isUsedInProducts || isUsedInPosts || isUsedInServices) {
      return { deleted: false, reason: "referenced" as const };
    }

    await ctx.storage.delete(args.storageId);
    const image = await ctx.db
      .query("images")
      .filter(q => q.eq(q.field("storageId"), args.storageId))
      .first();
    if (image) {
      await ctx.db.delete(image._id);
    }

    return { deleted: true, reason: "deleted" as const };
  },
  returns: v.object({
    deleted: v.boolean(),
    reason: v.union(v.literal("deleted"), v.literal("referenced"), v.literal("scan_limit")),
  }),
});

// QA-HIGH-006 FIX: Add limit to prevent fetching ALL images
export const listByFolder = query({
  args: { folder: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = args.limit ?? 100; // Default max 100
    const images = args.folder
      ? await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", args.folder)).take(maxLimit)
      : await ctx.db.query("images").take(maxLimit);
    
    const result = await Promise.all(
      images.map(async (img) => ({
        _id: img._id,
        storageId: img.storageId,
        filename: img.filename,
        mimeType: img.mimeType,
        size: img.size,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );
    
    return result;
  },
  returns: v.array(v.object({
    _id: v.id("images"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    url: v.union(v.string(), v.null()),
  })),
});

// QA-HIGH-006 FIX: Cleanup orphaned images with batch processing and limits
export const cleanupOrphanedImages = mutation({
  args: { folder: v.string(), batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxBatch = args.batchSize ?? 50; // Process in batches to avoid timeout
    const images = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", args.folder))
      .take(maxBatch);
    
    if (images.length === 0) {
      return { deleted: 0, hasMore: false };
    }
    
    // Pre-fetch all URLs in parallel
    const imageUrls = await Promise.all(
      images.map(async (img) => ({
        image: img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );
    
    // Pre-fetch posts/products once (not per image!)
    let posts: { thumbnail?: string; content: string }[] = [];
    let products: { image?: string; images?: string[]; description?: string }[] = [];
    
    if (args.folder === "posts" || args.folder === "posts-content") {
      posts = await ctx.db.query("posts").take(500);
    }
    if (args.folder === "products" || args.folder === "products-content") {
      products = await ctx.db.query("products").take(500);
    }
    
    // Find orphaned images
    const toDelete: typeof images = [];
    for (const { image, url } of imageUrls) {
      if (!url) continue;
      
      let isUsed = false;
      
      if (args.folder === "posts" || args.folder === "posts-content") {
        isUsed = posts.some(post => 
          post.thumbnail === url || (post.content && post.content.includes(url))
        );
      }
      
      if (args.folder === "products" || args.folder === "products-content") {
        isUsed = isUsed || products.some(product => 
          product.image === url || 
          (product.images && product.images.includes(url)) ||
          (product.description && product.description.includes(url))
        );
      }
      
      if (!isUsed) {
        toDelete.push(image);
      }
    }
    
    // Batch delete
    await Promise.all(toDelete.map(async (image) => {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }));
    
    // Check if there are more images to process
    const remaining = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", args.folder))
      .first();
    
    return { deleted: toDelete.length, hasMore: remaining !== null };
  },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
});

// Cleanup settings images - compare with used URLs from settings
export const cleanupSettingsImages = mutation({
  args: { usedUrls: v.array(v.string()) },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", "settings"))
      .take(100);

    if (images.length === 0) {
      return { deleted: 0 };
    }

    // Get URLs for all images
    const imageUrls = await Promise.all(
      images.map(async (img) => ({
        image: img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );

    // Find orphaned images (not in usedUrls)
    const usedUrlSet = new Set(args.usedUrls);
    const toDelete = imageUrls.filter(({ url }) => url && !usedUrlSet.has(url));

    // Delete orphaned images
    await Promise.all(toDelete.map(async ({ image }) => {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }));

    return { deleted: toDelete.length };
  },
  returns: v.object({ deleted: v.number() }),
});

// Cleanup home-components images - compare with used URLs from homeComponents table
export const cleanupHomeComponentImages = mutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxBatch = args.batchSize ?? 50;
    
    // Get images in home-components folder
    const images = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", "home-components"))
      .take(maxBatch);

    if (images.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    // Get URLs for all images
    const imageUrls = await Promise.all(
      images.map(async (img) => ({
        image: img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );

    // Get all home components configs to find used images
    const homeComponents = await ctx.db.query("homeComponents").take(500);
    
    // Extract all used image URLs from configs
    const usedUrls = new Set<string>();
    for (const component of homeComponents) {
      const config = component.config as Record<string, unknown>;
      if (!config) continue;
      
      // Check common image fields
      if (typeof config.image === 'string' && config.image) usedUrls.add(config.image);
      if (typeof config.backgroundImage === 'string' && config.backgroundImage) usedUrls.add(config.backgroundImage);
      if (typeof config.logo === 'string' && config.logo) usedUrls.add(config.logo);
      
      // Check images array
      if (Array.isArray(config.images)) {
        for (const img of config.images) {
          if (typeof img === 'string' && img) usedUrls.add(img);
          if (typeof img === 'object' && img && typeof (img as { url?: string }).url === 'string') {
            usedUrls.add((img as { url: string }).url);
          }
        }
      }
      
      // Check slides array (for Hero)
      if (Array.isArray(config.slides)) {
        for (const slide of config.slides) {
          if (typeof slide === 'object' && slide) {
            const s = slide as { image?: string; backgroundImage?: string };
            if (typeof s.image === 'string' && s.image) usedUrls.add(s.image);
            if (typeof s.backgroundImage === 'string' && s.backgroundImage) usedUrls.add(s.backgroundImage);
          }
        }
      }
    }

    // Find orphaned images
    const toDelete = imageUrls.filter(({ url }) => url && !usedUrls.has(url));

    // Delete orphaned images
    await Promise.all(toDelete.map(async ({ image }) => {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }));

    // Check if there are more images to process
    const remaining = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", "home-components"))
      .first();

    return { deleted: toDelete.length, hasMore: remaining !== null };
  },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
});
