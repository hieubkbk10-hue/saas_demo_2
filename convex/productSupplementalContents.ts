import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';

type SupplementalTemplateDoc = Doc<'productSupplementalContents'>;

type SanitizedPayload = {
  assignmentMode: 'products' | 'categories';
  categoryIds?: Id<'productCategories'>[];
  faqItems: Array<{ id: string; question: string; answer: string; order: number }>;
  name: string;
  postContent?: string;
  preContent?: string;
  productIds?: Id<'products'>[];
  status: 'active' | 'inactive';
};

const faqItemValidator = v.object({
  id: v.string(),
  question: v.string(),
  answer: v.string(),
  order: v.number(),
});

const supplementalDoc = v.object({
  _creationTime: v.number(),
  _id: v.id('productSupplementalContents'),
  name: v.string(),
  status: v.union(v.literal('active'), v.literal('inactive')),
  assignmentMode: v.union(v.literal('products'), v.literal('categories')),
  productIds: v.optional(v.array(v.id('products'))),
  categoryIds: v.optional(v.array(v.id('productCategories'))),
  preContent: v.optional(v.string()),
  postContent: v.optional(v.string()),
  faqItems: v.array(faqItemValidator),
  createdBy: v.optional(v.union(v.id('users'), v.null())),
  updatedBy: v.optional(v.union(v.id('users'), v.null())),
});

const normalizeOptionalHtml = (value?: string | null) => {
  const raw = (value ?? '').trim();
  return raw.length > 0 ? raw : undefined;
};

const uniqueIds = <T extends string>(values?: T[]) => {
  if (!values || values.length === 0) {
    return [] as T[];
  }
  return Array.from(new Set(values));
};

const sanitizeFaqItems = (items?: Array<{ id: string; question: string; answer: string; order: number }>) => {
  if (!items || items.length === 0) {
    return [] as Array<{ id: string; question: string; answer: string; order: number }>;
  }
  return items
    .map((item, index) => ({
      id: item.id.trim() || `${Date.now()}-${index}`,
      question: item.question.trim(),
      answer: item.answer.trim(),
      order: Number.isFinite(item.order) ? item.order : index,
    }))
    .filter((item) => item.question.length > 0 || item.answer.length > 0)
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }));
};

const sanitizePayload = (input: {
  assignmentMode: 'products' | 'categories';
  categoryIds?: Id<'productCategories'>[];
  faqItems: Array<{ id: string; question: string; answer: string; order: number }>;
  name: string;
  postContent?: string;
  preContent?: string;
  productIds?: Id<'products'>[];
  status: 'active' | 'inactive';
}): SanitizedPayload => {
  const name = input.name.trim();
  if (!name) {
    throw new ConvexError({ message: 'Tên template không được để trống' });
  }

  const productIds = uniqueIds(input.productIds);
  const categoryIds = uniqueIds(input.categoryIds);

  if (input.assignmentMode === 'products' && productIds.length === 0) {
    throw new ConvexError({ message: 'Vui lòng chọn ít nhất 1 sản phẩm để áp dụng' });
  }

  if (input.assignmentMode === 'categories' && categoryIds.length === 0) {
    throw new ConvexError({ message: 'Vui lòng chọn ít nhất 1 danh mục để áp dụng' });
  }

  return {
    assignmentMode: input.assignmentMode,
    categoryIds: input.assignmentMode === 'categories' ? categoryIds : undefined,
    faqItems: sanitizeFaqItems(input.faqItems),
    name,
    postContent: normalizeOptionalHtml(input.postContent),
    preContent: normalizeOptionalHtml(input.preContent),
    productIds: input.assignmentMode === 'products' ? productIds : undefined,
    status: input.status,
  };
};

const buildTemplateProductSet = async (
  ctx: MutationCtx | QueryCtx,
  template: Pick<SupplementalTemplateDoc, 'assignmentMode' | 'productIds' | 'categoryIds'>
): Promise<Set<Id<'products'>>> => {
  if (template.assignmentMode === 'products') {
    return new Set(template.productIds ?? []);
  }

  const categoryIds = template.categoryIds ?? [];
  if (categoryIds.length === 0) {
    return new Set();
  }

  const productsByCategories = await Promise.all(
    categoryIds.map((categoryId) =>
      ctx.db
        .query('products')
        .withIndex('by_category_status', (q) => q.eq('categoryId', categoryId))
        .collect()
    )
  );

  return new Set(productsByCategories.flat().map((product: Doc<'products'>) => product._id));
};

const formatConflictMessage = (conflictName: string, productName?: string) => {
  if (productName) {
    return `Template "${conflictName}" đang áp dụng cho sản phẩm "${productName}"`;
  }
  return `Template "${conflictName}" đang xung đột với phạm vi áp dụng đã chọn`;
};

const ensureNoEffectiveOverlap = async (
  ctx: MutationCtx,
  payload: SanitizedPayload,
  excludeId?: Id<'productSupplementalContents'>
) => {
  if (payload.status !== 'active') {
    return;
  }

  const activeTemplates = await ctx.db
    .query('productSupplementalContents')
    .withIndex('by_status', (q) => q.eq('status', 'active'))
    .collect();

  const normalizedProductIds = new Set(payload.productIds ?? []);
  const normalizedCategoryIds = new Set(payload.categoryIds ?? []);

  for (const template of activeTemplates) {
    if (excludeId && template._id === excludeId) {
      continue;
    }

    if (payload.assignmentMode === 'products' && template.assignmentMode === 'products') {
      const overlapProductId = (template.productIds ?? []).find((productId) => normalizedProductIds.has(productId));
      if (overlapProductId) {
        const overlapProduct = await ctx.db.get(overlapProductId);
        throw new ConvexError({ message: formatConflictMessage(template.name, overlapProduct?.name) });
      }
    }

    if (payload.assignmentMode === 'categories' && template.assignmentMode === 'categories') {
      const overlapCategoryId = (template.categoryIds ?? []).find((categoryId) => normalizedCategoryIds.has(categoryId));
      if (overlapCategoryId) {
        throw new ConvexError({ message: `Template "${template.name}" đang dùng cùng danh mục áp dụng` });
      }
    }
  }

  const targetSet = await buildTemplateProductSet(ctx, payload);
  if (targetSet.size === 0) {
    return;
  }

  for (const template of activeTemplates) {
    if (excludeId && template._id === excludeId) {
      continue;
    }

    const templateSet = await buildTemplateProductSet(ctx, template);
    const overlapProductId = [...targetSet].find((productId) => templateSet.has(productId));
    if (!overlapProductId) {
      continue;
    }

    const overlapProduct = await ctx.db.get(overlapProductId);
    throw new ConvexError({ message: formatConflictMessage(template.name, overlapProduct?.name) });
  }
};

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query('productSupplementalContents').order('desc').collect();
    return items;
  },
  returns: v.array(supplementalDoc),
});

export const getById = query({
  args: { id: v.id('productSupplementalContents') },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(supplementalDoc, v.null()),
});

export const createTemplate = mutation({
  args: {
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive')),
    assignmentMode: v.union(v.literal('products'), v.literal('categories')),
    productIds: v.optional(v.array(v.id('products'))),
    categoryIds: v.optional(v.array(v.id('productCategories'))),
    preContent: v.optional(v.string()),
    postContent: v.optional(v.string()),
    faqItems: v.array(faqItemValidator),
    createdBy: v.optional(v.union(v.id('users'), v.null())),
  },
  handler: async (ctx, args) => {
    const payload = sanitizePayload(args);
    await ensureNoEffectiveOverlap(ctx, payload);

    const id = await ctx.db.insert('productSupplementalContents', {
      ...payload,
      createdBy: args.createdBy ?? null,
      updatedBy: args.createdBy ?? null,
    });

    return id;
  },
  returns: v.id('productSupplementalContents'),
});

export const updateTemplate = mutation({
  args: {
    id: v.id('productSupplementalContents'),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive')),
    assignmentMode: v.union(v.literal('products'), v.literal('categories')),
    productIds: v.optional(v.array(v.id('products'))),
    categoryIds: v.optional(v.array(v.id('productCategories'))),
    preContent: v.optional(v.string()),
    postContent: v.optional(v.string()),
    faqItems: v.array(faqItemValidator),
    updatedBy: v.optional(v.union(v.id('users'), v.null())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError({ message: 'Không tìm thấy template nội dung bổ sung' });
    }

    const payload = sanitizePayload(args);
    await ensureNoEffectiveOverlap(ctx, payload, args.id);

    await ctx.db.patch(args.id, {
      ...payload,
      updatedBy: args.updatedBy ?? null,
    });

    return null;
  },
  returns: v.null(),
});

export const removeTemplate = mutation({
  args: { id: v.id('productSupplementalContents') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const getEffectiveByProduct = query({
  args: { productId: v.id('products') },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return null;
    }

    const activeTemplates = await ctx.db
      .query('productSupplementalContents')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    const byProduct = activeTemplates.find((item) => item.assignmentMode === 'products' && (item.productIds ?? []).includes(product._id));
    if (byProduct) {
      return byProduct;
    }

    const byCategory = activeTemplates.find((item) => item.assignmentMode === 'categories' && (item.categoryIds ?? []).includes(product.categoryId));
    if (byCategory) {
      return byCategory;
    }

    return null;
  },
  returns: v.union(supplementalDoc, v.null()),
});
