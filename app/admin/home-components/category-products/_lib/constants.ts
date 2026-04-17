import type { CategoryProductsConfig } from '../_types';

export const CATEGORY_PRODUCTS_STYLES = [
  { id: 'grid', label: 'Grid' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'cards', label: 'Cards' },
  { id: 'bento', label: 'Bento' },
  { id: 'magazine', label: 'Magazine' },
  { id: 'showcase', label: 'Showcase' },
];

export const DEFAULT_CATEGORY_PRODUCTS_CONFIG: CategoryProductsConfig = {
  columnsDesktop: 4,
  columnsMobile: 2,
  sections: [],
  showViewAll: true,
  style: 'grid',
};
