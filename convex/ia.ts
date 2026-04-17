import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { listSlugConflicts, resolveSlugConflicts } from "./lib/iaSlugs";

export const resolveUnifiedCategory = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = args.slug.trim().toLowerCase();
    if (!slug) {return null;}

    const [postCategory, productCategory, serviceCategory] = await Promise.all([
      ctx.db.query("postCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
      ctx.db.query("productCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
      ctx.db.query("serviceCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
    ]);

    const matches = [
      postCategory && { moduleKey: "posts" as const, category: postCategory },
      productCategory && { moduleKey: "products" as const, category: productCategory },
      serviceCategory && { moduleKey: "services" as const, category: serviceCategory },
    ].filter(Boolean);

    if (matches.length !== 1) {
      return null;
    }

    const match = matches[0]!;
    return {
      moduleKey: match.moduleKey,
      categoryId: match.category._id,
      categorySlug: match.category.slug,
      categoryName: match.category.name,
      categoryDescription: match.category.description ?? "",
    };
  },
  returns: v.union(v.object({
    moduleKey: v.union(v.literal("posts"), v.literal("products"), v.literal("services")),
    categoryId: v.union(v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories")),
    categorySlug: v.string(),
    categoryName: v.string(),
    categoryDescription: v.string(),
  }), v.null()),
});

export const resolveUnifiedDetail = query({
  args: { categorySlug: v.string(), recordSlug: v.string() },
  handler: async (ctx, args) => {
    const categorySlug = args.categorySlug.trim().toLowerCase();
    const recordSlug = args.recordSlug.trim().toLowerCase();
    if (!categorySlug || !recordSlug) {return null;}

    const [postCategory, productCategory, serviceCategory] = await Promise.all([
      ctx.db.query("postCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
      ctx.db.query("productCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
      ctx.db.query("serviceCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
    ]);

    if (postCategory) {
      const post = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
      if (!post) {return null;}
      return {
        moduleKey: "posts" as const,
        categoryId: postCategory._id,
        recordId: post._id,
      };
    }
    if (productCategory) {
      const product = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
      if (!product) {return null;}
      return {
        moduleKey: "products" as const,
        categoryId: productCategory._id,
        recordId: product._id,
      };
    }
    if (serviceCategory) {
      const service = await ctx.db.query("services").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
      if (!service) {return null;}
      return {
        moduleKey: "services" as const,
        categoryId: serviceCategory._id,
        recordId: service._id,
      };
    }
    return null;
  },
  returns: v.union(v.object({
    moduleKey: v.union(v.literal("posts"), v.literal("products"), v.literal("services")),
    categoryId: v.union(v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories")),
    recordId: v.union(v.id("posts"), v.id("products"), v.id("services")),
  }), v.null()),
});

export const listConflicts = query({
  args: { scope: v.optional(v.union(v.literal("record"), v.literal("category"), v.literal("all"))) },
  handler: async (ctx, args) => listSlugConflicts(ctx, args.scope ?? "all"),
  returns: v.array(v.object({
    scope: v.union(v.literal("record"), v.literal("category")),
    slug: v.string(),
    reserved: v.boolean(),
    items: v.array(v.object({
      id: v.union(v.id("posts"), v.id("products"), v.id("services"), v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories")),
      label: v.string(),
      table: v.union(
        v.literal("posts"),
        v.literal("products"),
        v.literal("services"),
        v.literal("postCategories"),
        v.literal("productCategories"),
        v.literal("serviceCategories")
      ),
    })),
  })),
});

export const resolveConflicts = mutation({
  args: { scope: v.optional(v.union(v.literal("record"), v.literal("category"), v.literal("all"))) },
  handler: async (ctx, args) => resolveSlugConflicts(ctx, args.scope ?? "all"),
  returns: v.number(),
});
