export type CategoryProductsStyle = 'grid' | 'carousel' | 'cards' | 'bento' | 'magazine' | 'showcase';
export type CategoryProductsBrandMode = 'single' | 'dual';
export type CategoryProductsHarmony = 'analogous' | 'complementary' | 'triadic';

export interface CategoryProductsSection {
  id: number;
  categoryId: string;
  itemCount: number;
}

export interface CategoryProductsConfig {
  sections: CategoryProductsSection[];
  style: CategoryProductsStyle;
  showViewAll: boolean;
  columnsDesktop: number;
  columnsMobile: number;
  harmony?: CategoryProductsHarmony;
}

export interface CategoryProductsProduct {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  salePrice?: number;
  categoryId?: string;
  hasVariants?: boolean;
}
