'use client';

export type ProductGridStyle = 'minimal' | 'commerce' | 'bento' | 'carousel' | 'compact' | 'showcase';

export type ProductGridSortBy = 'newest' | 'bestseller' | 'random';

export interface ProductGridConfig {
  itemCount: number;
  sortBy: ProductGridSortBy;
  selectionMode: 'auto' | 'manual';
  selectedProductIds: string[];
  subTitle: string;
  sectionTitle: string;
  style: ProductGridStyle;
}
