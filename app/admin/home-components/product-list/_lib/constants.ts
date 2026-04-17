import type { ProductListConfig, ProductListStyle, ProductListTextConfig } from '../_types';

export const PRODUCT_LIST_STYLES: { id: ProductListStyle; label: string }[] = [
  { id: 'commerce', label: 'Commerce' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'bento', label: 'Bento' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'compact', label: 'Compact' },
  { id: 'showcase', label: 'Showcase' },
];

export const DEFAULT_PRODUCT_LIST_CONFIG: ProductListConfig = {
  itemCount: 8,
  sortBy: 'newest',
};

export const DEFAULT_PRODUCT_LIST_TEXT: ProductListTextConfig = {
  subTitle: 'Bộ sưu tập',
  sectionTitle: 'Sản phẩm nổi bật',
};
