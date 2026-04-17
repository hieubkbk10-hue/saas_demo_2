export type ServiceListStyle = 'grid' | 'bento' | 'list' | 'carousel' | 'minimal' | 'showcase';

export type ServiceSelectionMode = 'auto' | 'manual';

export type ServiceListSortBy = 'newest' | 'popular' | 'random';

export type ServiceListBrandMode = 'single' | 'dual';
export type ServiceListHarmony = 'analogous' | 'complementary' | 'triadic';

export interface ServiceListPreviewItem {
  id: string | number;
  name: string;
  image?: string;
  price?: string | number;
  description?: string;
  tag?: 'new' | 'hot';
}

export interface ServiceListConfig {
  itemCount: number;
  sortBy: ServiceListSortBy;
  selectionMode: ServiceSelectionMode;
  selectedServiceIds?: string[];
  style?: ServiceListStyle;
  harmony?: ServiceListHarmony;
}
