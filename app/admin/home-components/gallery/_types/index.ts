'use client';

import type { ImageItem } from '../../../components/MultiImageUploader';

export type GalleryStyle = 'spotlight' | 'explore' | 'stories' | 'grid' | 'marquee' | 'masonry';
export type TrustBadgesStyle = 'grid' | 'cards' | 'marquee' | 'wall' | 'carousel' | 'featured';

export interface GalleryItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}
