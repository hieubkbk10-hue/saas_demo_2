export type ProductListStyle = 'minimal' | 'commerce' | 'bento' | 'carousel' | 'compact' | 'showcase';

export type ProductListBrandMode = 'single' | 'dual';
export type ProductListHarmony = 'analogous' | 'complementary' | 'triadic';


export interface ProductListPreviewItem {
  id: string | number;
  name: string;
  image?: string;
  price?: string;
  originalPrice?: string;
  description?: string;
  category?: string;
  tag?: 'new' | 'hot' | 'sale';
}

export type ProductSelectionMode = 'auto' | 'manual';

export interface ProductListConfig {
  itemCount: number;
  sortBy: string;
  harmony?: ProductListHarmony;
}

export interface ProductListTextConfig {
  subTitle: string;
  sectionTitle: string;
}
