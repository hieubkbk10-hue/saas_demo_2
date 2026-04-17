import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import * as ServicesModel from "./model/services";
import type { Doc } from "./_generated/dataModel";

const serviceDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("services"),
  categoryId: v.id("serviceCategories"),
  content: v.string(),
  renderType: v.optional(v.union(
    v.literal("content"),
    v.literal("markdown"),
    v.literal("html")
  )),
  markdownRender: v.optional(v.string()),
  htmlRender: v.optional(v.string()),
  duration: v.optional(v.string()),
  bookingEnabled: v.optional(v.boolean()),
  bookingDurationMin: v.optional(v.number()),
  bookingSlotIntervalMin: v.optional(v.number()),
  bookingCapacityPerSlot: v.optional(v.number()),
  bookingSlotTemplateDefault: v.optional(v.array(v.string())),
  bookingSlotTemplateByWeekday: v.optional(v.record(v.string(), v.array(v.string()))),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  order: v.number(),
  price: v.optional(v.number()),
  publishedAt: v.optional(v.number()),
  slug: v.string(),
  status: contentStatus,
  thumbnail: v.optional(v.string()),
  thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  title: v.string(),
  views: v.number(),
});

const paginatedServices = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(serviceDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("services").paginate(args.paginationOpts),
  returns: paginatedServices,
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => ServicesModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(serviceDoc),
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
    let services: Doc<"services">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      services = await searchQuery.take(fetchLimit);
    } else if (args.status) {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      services = await ctx.db
        .query("services")
        .order("desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && services.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      services = services.filter((service) => service.title.toLowerCase().includes(searchLower));
    }

    return services.slice(offset, offset + limit);
  },
  returns: v.array(serviceDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let services: Doc<"services">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      services = await searchQuery.take(limit + 1);
    } else if (args.status) {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      services = await ctx.db
        .query("services")
        .take(limit + 1);
    }

    return { count: Math.min(services.length, limit), hasMore: services.length > limit };
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
    let services: Doc<"services">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      services = await searchQuery.take(limit + 1);
    } else if (args.status) {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      services = await ctx.db
        .query("services")
        .take(limit + 1);
    }

    const hasMore = services.length > limit;
    return { ids: services.slice(0, limit).map((service) => service._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("services")), hasMore: v.boolean() }),
});

export const count = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => ServicesModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

// SVC-001: Legacy count for backward compatibility (returns number)
export const countSimple = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => {
    const result = await ServicesModel.countWithLimit(ctx, { status: args.status });
    return result.count;
  },
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("services") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(serviceDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique(),
  returns: v.union(serviceDoc, v.null()),
});

export const listByCategory = query({
  args: {
    categoryId: v.id("serviceCategories"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return  ctx.db
        .query("services")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return  ctx.db
      .query("services")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
  returns: paginatedServices,
});

export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: paginatedServices,
});

// SVC-012: Use by_status_featured index for efficient featured query
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 6, 20);
    return  ctx.db
      .query("services")
      .withIndex("by_status_featured", (q) => q.eq("status", "Published").eq("featured", true))
      .order("desc")
      .take(limit);
  },
  returns: v.array(serviceDoc),
});

// SVC-003: List most viewed services (like posts.listMostViewed)
export const listMostViewed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("services")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: paginatedServices,
});

// SVC-002: List recent services (non-paginated, for sidebar/widgets)
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return  ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
  },
  returns: v.array(serviceDoc),
});

// SVC-002: List popular services (non-paginated, for sidebar/widgets)
export const listPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return  ctx.db
      .query("services")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
  },
  returns: v.array(serviceDoc),
});

// Paginated published services for usePaginatedQuery hook (infinite scroll)
export const listPublishedPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("serviceCategories")),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
    )),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "newest";

    if (args.categoryId) {
      return ctx.db
        .query("services")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
    }

    if (sortBy === "popular") {
      return ctx.db
        .query("services")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order(sortBy === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedServices,
});

// Offset-based pagination for URL-based pagination mode
export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("serviceCategories")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("price_asc"),
      v.literal("price_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";

    let services: Doc<"services">[] = [];
    const fetchLimit = offset + limit + 10;

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      services = await searchQuery.take(fetchLimit);
    } else if (args.categoryId) {
      services = await ctx.db
        .query("services")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(fetchLimit);
    } else if (sortBy === "popular") {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
    } else {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && services.length > 0) {
      const ranked = rankByFuzzyMatches(
        services,
        args.search,
        (s) => [s.title ?? "", s.excerpt ?? ""],
        42,
      );
      services = ranked.map((entry) => entry.item);
    }

    if (!args.search?.trim()) {
      switch (sortBy) {
        case "oldest":
          services.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          services.sort((a, b) => b.views - a.views);
          break;
        case "title":
          services.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
          break;
        case "price_asc":
          services.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          break;
        case "price_desc":
          services.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          break;
        default:
          services.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return services.slice(offset, offset + limit);
  },
  returns: v.array(serviceDoc),
});

export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("serviceCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("price_asc"),
      v.literal("price_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const sortBy = args.sortBy ?? "newest";
    
    let services: Doc<"services">[] = [];
    
    if (args.categoryId) {
      services = await ctx.db
        .query("services")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(limit * 2);
    } else {
      if (sortBy === "popular") {
        services = await ctx.db
          .query("services")
          .withIndex("by_status_views", (q) => q.eq("status", "Published"))
          .order("desc")
          .take(limit * 2);
      } else {
        services = await ctx.db
          .query("services")
          .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
          .order(sortBy === "oldest" ? "asc" : "desc")
          .take(limit * 2);
      }
    }
    
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      services = services.filter(s => 
        s.title.toLowerCase().includes(searchLower) ||
        (s.excerpt?.toLowerCase().includes(searchLower))
      );
    }
    
    if (args.categoryId || !["newest", "oldest", "popular"].includes(sortBy)) {
      switch (sortBy) {
        case "oldest": {
          services.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        }
        case "popular": {
          services.sort((a, b) => b.views - a.views);
          break;
        }
        case "title": {
          services.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
          break;
        }
        case "price_asc": {
          services.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          break;
        }
        case "price_desc": {
          services.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          break;
        }
        default: {
          services.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
        }
      }
    }
    
    return services.slice(0, limit);
  },
  returns: v.array(serviceDoc),
});

export const countPublished = query({
  args: { categoryId: v.optional(v.id("serviceCategories")) },
  handler: async (ctx, args) => {
    if (args.categoryId) {
      const services = await ctx.db
        .query("services")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(1000);
      return services.length;
    }
    const services = await ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .take(1000);
    return services.length;
  },
  returns: v.number(),
});

export const create = mutation({
  args: {
    categoryId: v.id("serviceCategories"),
    content: v.string(),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    duration: v.optional(v.string()),
    bookingEnabled: v.optional(v.boolean()),
    bookingDurationMin: v.optional(v.number()),
    bookingSlotIntervalMin: v.optional(v.number()),
    bookingCapacityPerSlot: v.optional(v.number()),
    bookingSlotTemplateDefault: v.optional(v.array(v.string())),
    bookingSlotTemplateByWeekday: v.optional(v.record(v.string(), v.array(v.string()))),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    price: v.optional(v.number()),
    slug: v.string(),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ServicesModel.create(ctx, args);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "service" });
    return id;
  },
  returns: v.id("services"),
});

export const update = mutation({
  args: {
    categoryId: v.optional(v.id("serviceCategories")),
    content: v.optional(v.string()),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    duration: v.optional(v.string()),
    bookingEnabled: v.optional(v.boolean()),
    bookingDurationMin: v.optional(v.number()),
    bookingSlotIntervalMin: v.optional(v.number()),
    bookingCapacityPerSlot: v.optional(v.number()),
    bookingSlotTemplateDefault: v.optional(v.array(v.string())),
    bookingSlotTemplateByWeekday: v.optional(v.record(v.string(), v.array(v.string()))),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    id: v.id("services"),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    price: v.optional(v.number()),
    slug: v.optional(v.string()),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const previous = await ctx.db.get(args.id);
    await ServicesModel.update(ctx, args);
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
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "service" });
    return null;
  },
  returns: v.null(),
});

export const incrementViews = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    await ServicesModel.incrementViews(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("services") },
  handler: async (ctx, args) => {
    await ServicesModel.remove(ctx, args);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "service" });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("services") },
  handler: async (ctx, args) => ServicesModel.getDeleteInfo(ctx, args),
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
