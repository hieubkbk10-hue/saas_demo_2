'use client';

import type {
  HomepageCategoryHeroAutoGenerateConfig,
  HomepageCategoryHeroCategoryItem,
  HomepageCategoryHeroConfig,
  HomepageCategoryHeroStyle,
} from '../_types';

export const HOMEPAGE_CATEGORY_HERO_STYLES: Array<{ id: HomepageCategoryHeroStyle; label: string }> = [
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'classic', label: 'Classic' },
  { id: 'flush', label: 'Flush' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'soft', label: 'Soft' },
  { id: 'top-nav', label: 'Top Nav' },
];

const HOMEPAGE_CATEGORY_HERO_STYLE_SET = new Set<HomepageCategoryHeroStyle>(
  HOMEPAGE_CATEGORY_HERO_STYLES.map((item) => item.id)
);

export const normalizeHomepageCategoryHeroStyle = (value?: unknown): HomepageCategoryHeroStyle => {
  if (typeof value === 'string' && HOMEPAGE_CATEGORY_HERO_STYLE_SET.has(value as HomepageCategoryHeroStyle)) {
    return value as HomepageCategoryHeroStyle;
  }

  return 'sidebar';
};

const normalizeCategoryItem = (item: HomepageCategoryHeroCategoryItem, index: number): HomepageCategoryHeroCategoryItem => ({
  id: item.id ?? index,
  categoryId: item.categoryId ?? '',
  imageOverride: item.imageOverride,
  iconName: item.iconName,
  ctaLabel: item.ctaLabel?.trim() || undefined,
  groups: (item.groups ?? []).map((group, groupIndex) => ({
    id: group.id ?? groupIndex,
    title: group.title ?? '',
    items: (group.items ?? []).map((link, linkIndex) => ({
      id: link.id ?? linkIndex,
      targetType: link.targetType ?? (link.productId ? 'product' : 'category'),
      categoryId: link.categoryId ?? '',
      productId: link.productId,
      label: link.label?.trim() || undefined,
      image: link.image,
      slug: link.slug?.trim() || undefined,
    })),
  })),
});

export const normalizeHomepageCategoryHeroCategories = (
  categories?: HomepageCategoryHeroCategoryItem[]
): HomepageCategoryHeroCategoryItem[] => (categories ?? []).map(normalizeCategoryItem);

export const DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG: HomepageCategoryHeroConfig = {
  style: 'sidebar',
  heading: 'Khám phá danh mục sản phẩm',
  subheading: 'Chọn danh mục bạn quan tâm để xem nhanh sản phẩm nổi bật',
  ctaText: 'Xem tất cả sản phẩm',
  ctaUrl: '/products',
  heroSlides: [],
  selectionMode: 'manual',
  categories: [],
  autoGenerateConfig: {
    mode: 'smart',
    strategy: 'balanced',
    maxRootCategories: 8,
    maxGroupsPerCategory: 6,
    maxItemsPerGroup: 6,
    productScanLimit: 5000,
  } satisfies HomepageCategoryHeroAutoGenerateConfig,
  autoGenerateMeta: undefined,
  hideEmptyCategories: true,
  showCategoryImage: true,
  categoryVisualMode: 'image',
  categoryImageSize: 'sm',
  categoryImageShape: 'circle',
  maxCategoriesDesktop: 10,
  maxCategoriesTablet: 8,
  maxCategoriesMobile: 6,
  attachToHeader: true,
  tabletBehavior: 'drawer',
};
