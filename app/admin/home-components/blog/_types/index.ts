export type BlogStyle = 'grid' | 'list' | 'featured' | 'magazine' | 'carousel' | 'minimal';

export type BlogSelectionMode = 'auto' | 'manual';
export type BlogBrandMode = 'single' | 'dual';

export interface BlogConfig {
  itemCount: number;
  sortBy: 'newest' | 'popular' | 'random';
  style: BlogStyle;
  selectionMode: BlogSelectionMode;
  selectedPostIds: string[];
}

export interface BlogPreviewItem {
  id: string | number;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  date?: string;
  category?: string;
  readTime?: string;
  views?: number;
}
