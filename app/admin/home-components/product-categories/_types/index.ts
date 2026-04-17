'use client';

export type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'marquee' | 'circular';
export type ProductCategoriesBrandMode = 'single' | 'dual';

export interface CategoryConfigItem {
  id: number;
  categoryId: string;
  customImage?: string;
  imageMode?: 'product-image' | 'default' | 'icon' | 'upload' | 'url';
}

export interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export interface ProductCategoriesConfig {
  categories: CategoryConfigItem[];
  style: ProductCategoriesStyle;
  showProductCount: boolean;
  columnsDesktop: number;
  columnsMobile: number;
}
