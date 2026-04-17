import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import * as PostsModel from "./model/posts";
import type { Doc } from "./_generated/dataModel";
import { generateArticlePayload } from "../lib/posts/generator/assembler";
import { getMacroTemplate } from "../lib/posts/generator/macro-templates";
import type { GeneratorProduct, GeneratorSettings, GeneratorRequest } from "../lib/posts/generator/types";

const postDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("posts"),
  authorId: v.optional(v.id("users")),
  authorName: v.optional(v.string()),
  categoryId: v.id("postCategories"),
  content: v.string(),
  renderType: v.optional(v.union(
    v.literal("content"),
    v.literal("markdown"),
    v.literal("html")
  )),
  markdownRender: v.optional(v.string()),
  htmlRender: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  order: v.number(),
  publishedAt: v.optional(v.number()),
  slug: v.string(),
  status: contentStatus,
  thumbnail: v.optional(v.string()),
  thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  title: v.string(),
  views: v.number(),
});

// Pagination result validator - includes new Convex pagination fields
const paginatedPosts = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(postDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("posts").paginate(args.paginationOpts),
  returns: paginatedPosts,
});

// Limited list for admin (max 100 items - use pagination for more)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => PostsModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(postDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 20, 500);
    let posts: Doc<"posts">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      posts = await searchQuery.take(fetchLimit);
    } else if (args.status) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && posts.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      posts = posts.filter((post) => post.title.toLowerCase().includes(searchLower));
    }

    return posts.slice(offset, offset + limit);
  },
  returns: v.array(postDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let posts: Doc<"posts">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      posts = await searchQuery.take(limit + 1);
    } else if (args.status) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      posts = await ctx.db
        .query("posts")
        .take(limit + 1);
    }

    return { count: Math.min(posts.length, limit), hasMore: posts.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let posts: Doc<"posts">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      posts = await searchQuery.take(limit + 1);
    } else if (args.status) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      posts = await ctx.db
        .query("posts")
        .take(limit + 1);
    }

    const hasMore = posts.length > limit;
    return { ids: posts.slice(0, limit).map((post) => post._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("posts")), hasMore: v.boolean() }),
});

// Efficient count using take() instead of collect()
export const count = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => PostsModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

// Legacy count for backward compatibility (returns number)
export const countSimple = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => {
    const result = await PostsModel.countWithLimit(ctx, { status: args.status });
    return result.count;
  },
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(postDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique(),
  returns: v.union(postDoc, v.null()),
});

export const listByCategory = query({
  args: {
    categoryId: v.id("postCategories"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const result = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
      if (args.status !== "Published") {
        return result;
      }
      const now = Date.now();
      return {
        ...result,
        page: result.page.filter((post) => !post.publishedAt || post.publishedAt <= now),
      };
    }
    return  ctx.db
      .query("posts")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
  returns: paginatedPosts,
});

export const listByAuthor = query({
  args: {
    authorName: v.string(),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const result = await ctx.db
        .query("posts")
        .withIndex("by_author_name_status", (q) =>
          q.eq("authorName", args.authorName).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
      if (args.status !== "Published") {
        return result;
      }
      const now = Date.now();
      return {
        ...result,
        page: result.page.filter((post) => !post.publishedAt || post.publishedAt <= now),
      };
    }
    return  ctx.db
      .query("posts")
      .withIndex("by_author_name_status", (q) => q.eq("authorName", args.authorName))
      .paginate(args.paginationOpts);
  },
  returns: paginatedPosts,
});

export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts);
    const now = Date.now();
    return {
      ...result,
      page: result.page.filter((post) => !post.publishedAt || post.publishedAt <= now),
    };
  },
  returns: paginatedPosts,
});

export const listMostViewed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("posts")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts);
    const now = Date.now();
    return {
      ...result,
      page: result.page.filter((post) => !post.publishedAt || post.publishedAt <= now),
    };
  },
  returns: paginatedPosts,
});

// Search and filter published posts
export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("postCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const sortBy = args.sortBy ?? "newest";
    
    let posts: Doc<"posts">[] = [];
    
    // Filter by category if provided
    if (args.categoryId) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(limit * 2); // Get more for client-side filtering
    } else {
      // Get all published posts
      if (sortBy === "popular") {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_status_views", (q) => q.eq("status", "Published"))
          .order("desc")
          .take(limit * 2);
      } else {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
          .order(sortBy === "oldest" ? "asc" : "desc")
          .take(limit * 2);
      }
    }
    
    const now = Date.now();
    posts = posts.filter((post) => !post.publishedAt || post.publishedAt <= now);

    // Client-side text search (Convex doesn't have full-text search built-in)
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        (post.excerpt?.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort if needed (after category filter)
    if (args.categoryId) {
      switch (sortBy) {
        case "oldest": {
          posts.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        }
        case "popular": {
          posts.sort((a, b) => b.views - a.views);
          break;
        }
        case "title": {
          posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
          break;
        }
        default: { // Newest
          posts.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
        }
      }
    } else if (sortBy === "title") {
      posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }
    
    return posts.slice(0, limit);
  },
  returns: v.array(postDoc),
});

// Get featured posts (most viewed)
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit * 2);
    const now = Date.now();
    return posts.filter((post) => !post.publishedAt || post.publishedAt <= now).slice(0, limit);
  },
  returns: v.array(postDoc),
});

// Count published posts (for result display)
export const countPublished = query({
  args: { categoryId: v.optional(v.id("postCategories")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.categoryId) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(1000);
      return posts.filter((post) => !post.publishedAt || post.publishedAt <= now).length;
    }
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .take(1000);
    return posts.filter((post) => !post.publishedAt || post.publishedAt <= now).length;
  },
  returns: v.number(),
});

// Paginated published posts for usePaginatedQuery hook (infinite scroll)
export const listPublishedPaginated = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("postCategories")),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
    )),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "newest";
    
    if (args.categoryId) {
      const result = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .order("desc")
        .paginate(args.paginationOpts);
      const now = Date.now();
      return {
        ...result,
        page: result.page.filter((post) => !post.publishedAt || post.publishedAt <= now),
      };
    }
    
    if (sortBy === "popular") {
      const result = await ctx.db
        .query("posts")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(args.paginationOpts);
      const now = Date.now();
      return {
        ...result,
        page: result.page.filter((post) => !post.publishedAt || post.publishedAt <= now),
      };
    }
    
    const result = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order(sortBy === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
    const now = Date.now();
    return {
      ...result,
      page: result.page.filter((post) => !post.publishedAt || post.publishedAt <= now),
    };
  },
  returns: paginatedPosts,
});

// Offset-based pagination for URL-based pagination mode
export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("postCategories")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";
    
    let posts: Doc<"posts">[] = [];
    
    // Fetch more than needed to handle offset (Convex doesn't have native offset)
    const fetchLimit = offset + limit + 10;
    
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      posts = await searchQuery.take(fetchLimit);
    } else if (args.categoryId) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(fetchLimit);
    } else if (sortBy === "popular") {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
    } else {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
    }
    
    const now = Date.now();
    posts = posts.filter((post) => !post.publishedAt || post.publishedAt <= now);

    if (args.search?.trim() && posts.length > 0) {
      const ranked = rankByFuzzyMatches(
        posts,
        args.search,
        (post) => [post.title ?? "", post.excerpt ?? ""],
        42,
      );
      posts = ranked.map((entry) => entry.item);
    } else if (sortBy === "title") {
      posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    } else if (args.categoryId) {
      // Re-sort if filtered by category
      switch (sortBy) {
        case "oldest":
          posts.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          posts.sort((a, b) => b.views - a.views);
          break;
        default:
          posts.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }
    
    // Apply offset and limit
    return posts.slice(offset, offset + limit);
  },
  returns: v.array(postDoc),
});

// Search published posts with cursor-based pagination
export const searchPublishedPaginated = query({
  args: {
    categoryId: v.optional(v.id("postCategories")),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const sortBy = args.sortBy ?? "newest";
    
    // Build pagination options
    const paginationOpts = {
      numItems: limit,
      cursor: args.cursor ?? null,
    };
    
    let result;
    
    // Use appropriate index based on filters
    if (args.categoryId) {
      result = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .paginate(paginationOpts);
    } else if (sortBy === "popular") {
      result = await ctx.db
        .query("posts")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(paginationOpts);
    } else {
      result = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(paginationOpts);
    }
    
    const now = Date.now();
    let posts = result.page.filter((post) => !post.publishedAt || post.publishedAt <= now);
    
    // Client-side text search filter
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        (post.excerpt?.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by title if needed (other sorts handled by index)
    if (sortBy === "title") {
      posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }
    
    return {
      posts,
      nextCursor: result.isDone ? null : result.continueCursor,
      isDone: result.isDone,
    };
  },
  returns: v.object({
    posts: v.array(postDoc),
    nextCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
});

export const create = mutation({
  args: {
    authorName: v.optional(v.string()),
    categoryId: v.id("postCategories"),
    content: v.string(),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    publishImmediately: v.optional(v.boolean()),
    publishedAt: v.optional(v.number()),
    slug: v.string(),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await PostsModel.create(ctx, args);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "post" });
    return id;
  },
  returns: v.id("posts"),
});

export const update = mutation({
  args: {
    authorName: v.optional(v.string()),
    categoryId: v.optional(v.id("postCategories")),
    content: v.optional(v.string()),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    id: v.id("posts"),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    publishImmediately: v.optional(v.boolean()),
    publishedAt: v.optional(v.number()),
    slug: v.optional(v.string()),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const previous = await ctx.db.get(args.id);
    await PostsModel.update(ctx, args);
    const shouldCheckStorage = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId");
    if (shouldCheckStorage && previous?.thumbnailStorageId) {
      const nextThumbnailStorageId = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
        ? args.thumbnailStorageId ?? null
        : previous.thumbnailStorageId ?? null;
      if (!nextThumbnailStorageId || nextThumbnailStorageId !== previous.thumbnailStorageId) {
        await ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, {
          storageId: previous.thumbnailStorageId,
        });
      }
    }
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "post" });
    return null;
  },
  returns: v.null(),
});

export const incrementViews = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await PostsModel.incrementViews(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("posts") },
  handler: async (ctx, args) => {
    await PostsModel.remove(ctx, args);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "post" });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => PostsModel.getDeleteInfo(ctx, args),
  returns: v.object({
    canDelete: v.boolean(),
    dependencies: v.array(v.object({
      count: v.number(),
      hasMore: v.boolean(),
      label: v.string(),
      preview: v.array(v.object({ id: v.string(), name: v.string() })),
    })),
  }),
});

// ============================================================
// AUTO GENERATOR (PREVIEW/REGENERATE)
// ============================================================

const generatorRequestValidator = v.object({
  templateKey: v.string(),
  seed: v.string(),
  productLimit: v.optional(v.number()),
  budgetMin: v.optional(v.number()),
  budgetMax: v.optional(v.number()),
  keyword: v.optional(v.string()),
  compareSlugs: v.optional(v.array(v.string())),
  selectedProductSlugs: v.optional(v.array(v.string())),
  categoryId: v.optional(v.string()),
  useCase: v.optional(v.string()),
  tone: v.optional(v.string()),
});

const getModuleSettingValue = async (
  ctx: QueryCtx | MutationCtx,
  moduleKey: string,
  settingKey: string,
) => {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", moduleKey).eq("settingKey", settingKey))
    .unique();
  return setting?.value;
};

const getGeneratorSettings = async (_ctx: QueryCtx | MutationCtx) => ({
  minSlots: 7,
  maxSlots: 10,
  diversityLevel: "high",
  regenerateStrength: "strong",
  defaultTone: "helpful",
  internalLinkDensity: "medium",
} satisfies GeneratorSettings);

const resolveSaleMode = async (ctx: QueryCtx | MutationCtx) => {
  const value = await getModuleSettingValue(ctx, "products", "saleMode");
  if (value === "contact" || value === "affiliate") {
    return value as "contact" | "affiliate";
  }
  return "cart";
};

const normalizeProductImage = (product: Doc<"products">) => product.image ?? product.images?.[0];

const buildRelatedProductsByCategory = async (
  ctx: QueryCtx | MutationCtx,
  docs: Doc<"products">[],
) => {
  const categoryIds = Array.from(new Set(docs.map((product) => product.categoryId)));
  const excludeIds = new Set(docs.map((product) => product._id));
  const relatedLimit = 6;
  const results = await Promise.all(categoryIds.map((categoryId) =>
    ctx.db
      .query("products")
      .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId).eq("status", "Active"))
      .take(20)
  ));

  const relatedMap = new Map<Doc<"productCategories">["_id"], Doc<"products">[]>();
  categoryIds.forEach((categoryId, index) => {
    const list = results[index] ?? [];
    const filtered = list.filter((product) => !excludeIds.has(product._id));
    filtered.sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0));
    relatedMap.set(categoryId, filtered.slice(0, relatedLimit));
  });

  return relatedMap;
};

const buildGeneratorProducts = async (
  ctx: QueryCtx | MutationCtx,
  docs: Doc<"products">[],
  relatedByCategory: Map<Doc<"productCategories">["_id"], Doc<"products">[]>,
): Promise<GeneratorProduct[]> => {
  const categoryIds = Array.from(new Set(docs.map((product) => product.categoryId)));
  const categories = await Promise.all(categoryIds.map((id) => ctx.db.get(id)));
  const categoryNameMap = new Map(
    categories.filter(Boolean).map((category) => [category!._id, category!.name]),
  );
  const categoryImageMap = new Map(
    categories.filter(Boolean).map((category) => [category!._id, category!.image]),
  );

  return docs.map((product) => {
    const related = relatedByCategory.get(product.categoryId) ?? [];
    const relatedItems = related.map((item) => ({
      id: item._id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      salePrice: item.salePrice,
      sales: item.sales,
      image: normalizeProductImage(item),
      affiliateLink: item.affiliateLink,
    }));
    const categoryImage = categoryImageMap.get(product.categoryId) ?? relatedItems[0]?.image;
    return {
      id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      sales: product.sales,
      image: normalizeProductImage(product),
      images: product.images,
      affiliateLink: product.affiliateLink,
      categoryId: product.categoryId,
      categoryName: categoryNameMap.get(product.categoryId),
      categoryImage,
      description: product.description,
      relatedProducts: relatedItems,
    };
  });
};

const fetchProductsForRequest = async (
  ctx: QueryCtx,
  request: GeneratorRequest,
): Promise<Doc<"products">[]> => {
  const template = getMacroTemplate(request.templateKey as GeneratorRequest["templateKey"]);
  const limit = Math.min(request.productLimit ?? 6, 12);

  if (template.productStrategy === "best_sellers" || template.productStrategy === "value_popular") {
    if (request.selectedProductSlugs?.length) {
      const expectedCount = request.productLimit ?? request.selectedProductSlugs.length;
      if (request.selectedProductSlugs.length !== expectedCount) {
        throw new Error("Cần chọn đủ số lượng sản phẩm đã cấu hình");
      }
      const uniqueSlugs = Array.from(new Set(request.selectedProductSlugs));
      if (uniqueSlugs.length !== request.selectedProductSlugs.length) {
        throw new Error("Danh sách sản phẩm không được trùng nhau");
      }
      const selectedDocs = await Promise.all(
        request.selectedProductSlugs.map((slug) =>
          ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()
        )
      );
      if (selectedDocs.some((doc) => !doc)) {
        throw new Error("Không tìm thấy đủ sản phẩm đã chọn");
      }
      return (selectedDocs.filter(Boolean) as Doc<"products">[]).slice(0, limit);
    }
  }

  if (template.productStrategy === "compare") {
    const slugs = request.compareSlugs?.filter(Boolean) ?? [];
    const uniqueSlugs = Array.from(new Set(slugs));
    if (uniqueSlugs.length < 2) {
      throw new Error("Cần chọn 2 sản phẩm khác nhau để so sánh");
    }
    const compareDocs = await Promise.all(slugs.map((slug) =>
      ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()
    ));
    const results = compareDocs.filter(Boolean) as Doc<"products">[];
    if (results.length >= 2) {
      return results.slice(0, limit);
    }
    throw new Error("Không tìm thấy đủ 2 sản phẩm để so sánh");
  }

  if (template.productStrategy === "budget_under") {
    if (!request.budgetMax) {
      throw new Error("Cần nhập ngân sách tối đa");
    }
    return ctx.db
      .query("products")
      .withIndex("by_status_price", (q) => q.eq("status", "Active").lt("price", request.budgetMax!))
      .take(limit);
  }

  if (template.productStrategy === "budget_between") {
    if (!request.budgetMin || !request.budgetMax) {
      throw new Error("Cần nhập khoảng ngân sách");
    }
    if (request.budgetMin >= request.budgetMax) {
      throw new Error("Ngân sách tối thiểu phải nhỏ hơn ngân sách tối đa");
    }
    return ctx.db
      .query("products")
      .withIndex("by_status_price", (q) =>
        q.eq("status", "Active").gt("price", request.budgetMin!).lt("price", request.budgetMax!)
      )
      .take(limit);
  }

  if (template.productStrategy === "category") {
    if (!request.categoryId) {
      throw new Error("Cần chọn danh mục sản phẩm");
    }
    return ctx.db
      .query("products")
      .withIndex("by_category_status", (q) =>
        q.eq("categoryId", request.categoryId as Doc<"productCategories">["_id"]).eq("status", "Active")
      )
      .take(limit);
  }

  if (template.productStrategy === "use_case" || template.productStrategy === "value_popular") {
    const keyword = request.useCase ?? request.keyword;
    if (template.productStrategy === "use_case" && !keyword?.trim()) {
      throw new Error("Cần nhập nhu cầu/keyword");
    }
    if (keyword?.trim()) {
      return ctx.db
        .query("products")
        .withSearchIndex("search_name", (q) => q.search("name", keyword.toLowerCase()).eq("status", "Active"))
        .take(limit);
    }
  }

  return ctx.db
    .query("products")
    .withIndex("by_status_sales", (q) => q.eq("status", "Active"))
    .order("desc")
    .take(limit);
};

export const generateFromProductsPreview = query({
  args: { request: generatorRequestValidator },
  handler: async (ctx, args) => {
    const enabled = await getModuleSettingValue(ctx, "posts", "enableAutoPostGenerator");
    if (!enabled) {
      throw new Error("Auto generator đang tắt");
    }

    const request = args.request as GeneratorRequest;
    const settings = await getGeneratorSettings(ctx);
    const products = await fetchProductsForRequest(ctx, request);
    const saleMode = await resolveSaleMode(ctx);
    const relatedByCategory = await buildRelatedProductsByCategory(ctx, products);
    const normalized = await buildGeneratorProducts(ctx, products, relatedByCategory);

    return generateArticlePayload({
      request,
      products: normalized,
      settings,
      saleMode,
    });
  },
});

export const regenerateFromDraftSeed = query({
  args: { request: generatorRequestValidator },
  handler: async (ctx, args) => {
    const enabled = await getModuleSettingValue(ctx, "posts", "enableAutoPostGenerator");
    if (!enabled) {
      throw new Error("Auto generator đang tắt");
    }
    const request = args.request as GeneratorRequest;
    const settings = await getGeneratorSettings(ctx);
    const products = await fetchProductsForRequest(ctx, request);
    const saleMode = await resolveSaleMode(ctx);
    const relatedByCategory = await buildRelatedProductsByCategory(ctx, products);
    const normalized = await buildGeneratorProducts(ctx, products, relatedByCategory);
    return generateArticlePayload({
      request,
      products: normalized,
      settings,
      saleMode,
    });
  },
});

export const createFromGeneratedPayload = mutation({
  args: {
    categoryId: v.id("postCategories"),
    status: v.optional(contentStatus),
    payload: v.object({
      title: v.string(),
      slug: v.string(),
      contentHtml: v.string(),
      excerpt: v.string(),
      metaTitle: v.string(),
      metaDescription: v.string(),
      thumbnail: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const enabled = await getModuleSettingValue(ctx, "posts", "enableAutoPostGenerator");
    if (!enabled) {
      throw new Error("Auto generator đang tắt");
    }
    const id = await PostsModel.create(ctx, {
      title: args.payload.title,
      slug: args.payload.slug,
      content: "",
      renderType: "html",
      htmlRender: args.payload.contentHtml,
      excerpt: args.payload.excerpt,
      metaTitle: args.payload.metaTitle,
      metaDescription: args.payload.metaDescription,
      thumbnail: args.payload.thumbnail,
      categoryId: args.categoryId,
      status: args.status ?? "Draft",
    });
    return id;
  },
  returns: v.id("posts"),
});
