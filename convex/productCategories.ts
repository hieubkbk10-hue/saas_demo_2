import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resolveUniqueSlug } from "./lib/iaSlugs";
import type { Doc, Id } from "./_generated/dataModel";

const categoryDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("productCategories"),
  active: v.boolean(),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  name: v.string(),
  order: v.number(),
  parentId: v.optional(v.id("productCategories")),
  slug: v.string(),
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = args.limit ?? 100;
    return  ctx.db.query("productCategories").take(maxLimit);
  },
  returns: v.array(categoryDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    let categories = await ctx.db.query("productCategories").order("desc").take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      categories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchLower) ||
        category.slug.toLowerCase().includes(searchLower)
      );
    }

    return categories.slice(offset, offset + limit);
  },
  returns: v.array(categoryDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let categories: Doc<"productCategories">[] = await ctx.db.query("productCategories").take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      categories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchLower) ||
        category.slug.toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(categories.length, limit), hasMore: categories.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    let categories: Doc<"productCategories">[] = await ctx.db.query("productCategories").take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      categories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchLower) ||
        category.slug.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = categories.length > limit;
    return { ids: categories.slice(0, limit).map((category) => category._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("productCategories")), hasMore: v.boolean() }),
});

export const listActive = query({
  args: {},
  handler: async (ctx) => ctx.db
      .query("productCategories")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect(),
  returns: v.array(categoryDoc),
});

export const listActiveWithStats = query({
  args: { productLimit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const MAX_SAMPLE_IMAGES = 6;
    const categories = await ctx.db
      .query("productCategories")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    if (categories.length === 0) {
      return { categories: [], stats: [] };
    }

    const limit = Math.min(args.productLimit ?? 5000, 10000);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .take(limit);

    const statsMap = new Map<Id<"productCategories">, { productCount: number; totalSales: number; latestProductTime: number; representativeImage?: string; sampleImages?: string[] }>();

    products.forEach((product) => {
      const current = statsMap.get(product.categoryId) ?? { productCount: 0, totalSales: 0, latestProductTime: 0, sampleImages: [] as string[] };
      const sampleImages = current.sampleImages ? [...current.sampleImages] : [];
      if (product.image && !sampleImages.includes(product.image) && sampleImages.length < MAX_SAMPLE_IMAGES) {
        sampleImages.push(product.image);
      }
      statsMap.set(product.categoryId, {
        productCount: current.productCount + 1,
        totalSales: current.totalSales + (product.sales ?? 0),
        latestProductTime: Math.max(current.latestProductTime, product._creationTime ?? 0),
        representativeImage: current.representativeImage ?? product.image,
        sampleImages,
      });
    });

    const stats = Array.from(statsMap.entries()).map(([categoryId, value]) => ({
      categoryId,
      productCount: value.productCount,
      totalSales: value.totalSales,
      latestProductTime: value.latestProductTime,
      representativeImage: value.representativeImage,
      sampleImages: value.sampleImages,
    }));

    return { categories, stats };
  },
  returns: v.object({
    categories: v.array(categoryDoc),
    stats: v.array(v.object({
      categoryId: v.id("productCategories"),
      productCount: v.number(),
      totalSales: v.number(),
      latestProductTime: v.number(),
      representativeImage: v.optional(v.string()),
      sampleImages: v.optional(v.array(v.string())),
    })),
  }),
});

export const listActiveWithStatsForHero = query({
  args: {
    productLimit: v.optional(v.number()),
    productPerCategoryLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const MAX_SAMPLE_IMAGES = 6;
    const categories = await ctx.db
      .query("productCategories")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    if (categories.length === 0) {
      return { categories: [], stats: [], productsByCategory: [] };
    }

    const limit = Math.min(args.productLimit ?? 5000, 10000);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .take(limit);

    const statsMap = new Map<Id<"productCategories">, { productCount: number; totalSales: number; latestProductTime: number; representativeImage?: string; sampleImages?: string[] }>();
    const productsMap = new Map<Id<"productCategories">, Array<{ _id: Id<"products">; name: string; slug: string; image?: string; categoryId: Id<"productCategories">; sales: number; _creationTime: number }>>();

    products.forEach((product) => {
      const current = statsMap.get(product.categoryId) ?? { productCount: 0, totalSales: 0, latestProductTime: 0, sampleImages: [] as string[] };
      const sampleImages = current.sampleImages ? [...current.sampleImages] : [];
      if (product.image && !sampleImages.includes(product.image) && sampleImages.length < MAX_SAMPLE_IMAGES) {
        sampleImages.push(product.image);
      }
      statsMap.set(product.categoryId, {
        productCount: current.productCount + 1,
        totalSales: current.totalSales + (product.sales ?? 0),
        latestProductTime: Math.max(current.latestProductTime, product._creationTime ?? 0),
        representativeImage: current.representativeImage ?? product.image,
        sampleImages,
      });

      const list = productsMap.get(product.categoryId) ?? [];
      list.push({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        categoryId: product.categoryId,
        sales: product.sales ?? 0,
        _creationTime: product._creationTime,
      });
      productsMap.set(product.categoryId, list);
    });

    const stats = Array.from(statsMap.entries()).map(([categoryId, value]) => ({
      categoryId,
      productCount: value.productCount,
      totalSales: value.totalSales,
      latestProductTime: value.latestProductTime,
      representativeImage: value.representativeImage,
      sampleImages: value.sampleImages,
    }));

    const perCategoryLimit = Math.min(Math.max(args.productPerCategoryLimit ?? 6, 1), 20);
    const productsByCategory = Array.from(productsMap.entries()).map(([categoryId, list]) => ({
      categoryId,
      products: list
        .sort((a, b) => (b.sales !== a.sales ? b.sales - a.sales : b._creationTime - a._creationTime))
        .slice(0, perCategoryLimit),
    }));

    return { categories, stats, productsByCategory };
  },
  returns: v.object({
    categories: v.array(categoryDoc),
    stats: v.array(v.object({
      categoryId: v.id("productCategories"),
      productCount: v.number(),
      totalSales: v.number(),
      latestProductTime: v.number(),
      representativeImage: v.optional(v.string()),
      sampleImages: v.optional(v.array(v.string())),
    })),
    productsByCategory: v.array(v.object({
      categoryId: v.id("productCategories"),
      products: v.array(v.object({
        _id: v.id("products"),
        name: v.string(),
        slug: v.string(),
        image: v.optional(v.string()),
        categoryId: v.id("productCategories"),
        sales: v.number(),
        _creationTime: v.number(),
      })),
    })),
  }),
});

export const listNonEmptyCategoryIds = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("productCategories")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    if (categories.length === 0) {
      return [];
    }

    const results = await Promise.all(
      categories.map(async (category) => {
        const preview = await ctx.db
          .query("products")
          .withIndex("by_category_status", (q) => q.eq("categoryId", category._id).eq("status", "Active"))
          .take(1);
        return preview.length > 0 ? category._id : null;
      })
    );

    return results.filter((id): id is Id<"productCategories"> => id !== null);
  },
  returns: v.array(v.id("productCategories")),
});

export const listByParent = query({
  args: { parentId: v.optional(v.id("productCategories")) },
  handler: async (ctx, args) => {
    if (args.parentId === undefined) {
      return  ctx.db
        .query("productCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", undefined))
        .collect();
    }
    return  ctx.db
      .query("productCategories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
  returns: v.array(categoryDoc),
});

export const listByParentOrdered = query({
  args: { parentId: v.optional(v.id("productCategories")) },
  handler: async (ctx, args) => ctx.db
      .query("productCategories")
      .withIndex("by_parent_order", (q) => q.eq("parentId", args.parentId))
      .collect(),
  returns: v.array(categoryDoc),
});

export const getById = query({
  args: { id: v.id("productCategories") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(categoryDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("productCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique(),
  returns: v.union(categoryDoc, v.null()),
});

export const create = mutation({
  args: {
    active: v.optional(v.boolean()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    name: v.string(),
    order: v.optional(v.number()),
    parentId: v.optional(v.id("productCategories")),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const hierarchyFeature = await ctx.db
      .query("moduleFeatures")
      .withIndex("by_module_feature", (q) =>
        q.eq("moduleKey", "products").eq("featureKey", "enableCategoryHierarchy")
      )
      .unique();
    const hierarchyEnabled = hierarchyFeature?.enabled === true;

    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "category",
      slug: args.slug,
    });
    
    // FIX: Get last order instead of fetching ALL
    let nextOrder = args.order;
    if (nextOrder === undefined) {
      const lastCategory = await ctx.db
        .query("productCategories")
        .order("desc")
        .first();
      nextOrder = lastCategory ? lastCategory.order + 1 : 0;
    }
    
    return  ctx.db.insert("productCategories", {
      ...args,
      slug: resolvedSlug.slug,
      order: nextOrder,
      active: args.active ?? true,
      parentId: hierarchyEnabled ? args.parentId : undefined,
    });
  },
  returns: v.id("productCategories"),
});

export const update = mutation({
  args: {
    active: v.optional(v.boolean()),
    description: v.optional(v.string()),
    id: v.id("productCategories"),
    image: v.optional(v.string()),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    parentId: v.optional(v.id("productCategories")),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const hierarchyFeature = await ctx.db
      .query("moduleFeatures")
      .withIndex("by_module_feature", (q) =>
        q.eq("moduleKey", "products").eq("featureKey", "enableCategoryHierarchy")
      )
      .unique();
    const hierarchyEnabled = hierarchyFeature?.enabled === true;

    const { id, ...updates } = args;
    const category = await ctx.db.get(id);
    if (!category) {throw new Error("Category not found");}
    if (!hierarchyEnabled) {
      delete updates.parentId;
    }
    if (args.slug && args.slug !== category.slug) {
      const resolvedSlug = await resolveUniqueSlug(ctx, {
        scope: "category",
        slug: args.slug,
        exclude: { id: args.id, table: "productCategories" },
      });
      if (resolvedSlug.slug !== args.slug) {
        updates.slug = resolvedSlug.slug;
      }
    }
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

// FIX HIGH-004: Add count info for better error messages
export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("productCategories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) {throw new Error("Category not found");}

    const childPreview = await ctx.db
      .query("productCategories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .take(1);
    if (childPreview.length > 0 && !args.cascade) {
      throw new Error("Danh mục có danh mục con. Vui lòng xác nhận xóa tất cả.");
    }

    const productPreview = await ctx.db
      .query("products")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.id))
      .take(1);
    if (productPreview.length > 0 && !args.cascade) {
      throw new Error("Danh mục có sản phẩm liên quan. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade) {
      const queue: Doc<"productCategories">[] = [category];
      const categoryIds: Id<"productCategories">[] = [];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {continue;}
        categoryIds.push(current._id);
        const children = await ctx.db
          .query("productCategories")
          .withIndex("by_parent", (q) => q.eq("parentId", current._id))
          .collect();
        queue.push(...children);
      }

      const productsByCategory = await Promise.all(
        categoryIds.map((categoryId) => ctx.db
            .query("products")
            .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
            .collect())
      );

      const productIds = productsByCategory.flat().map((product) => product._id);
      await Promise.all(productIds.map((id) => ctx.db.delete(id)));
      await Promise.all(categoryIds.map((id) => ctx.db.delete(id)));
      return null;
    }

    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

// FIX HIGH-004: Query to check related data before delete
export const getDeleteInfo = query({
  args: { id: v.id("productCategories") },
  handler: async (ctx, args) => {
    const childrenPreview = await ctx.db
      .query("productCategories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .take(10);
    const childrenCount = await ctx.db
      .query("productCategories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .take(1001);

    const productsPreview = await ctx.db
      .query("products")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.id))
      .take(10);
    const productsCount = await ctx.db
      .query("products")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.id))
      .take(1001);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(childrenCount.length, 1000),
          hasMore: childrenCount.length > 1000,
          label: "Danh mục con",
          preview: childrenPreview.map((child) => ({ id: child._id, name: child.name })),
        },
        {
          count: Math.min(productsCount.length, 1000),
          hasMore: productsCount.length > 1000,
          label: "Sản phẩm",
          preview: productsPreview.map((product) => ({ id: product._id, name: product.name })),
        },
      ],
    };
  },
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

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("productCategories"), order: v.number() })) },
  handler: async (ctx, args) => {
    // FIX: Use Promise.all for batch operations
    await Promise.all(
      args.items.map( async (item) => ctx.db.patch(item.id, { order: item.order }))
    );
    return null;
  },
  returns: v.null(),
});
