'use client';

import type { ImageItem } from '../../../components/MultiImageUploader';

export type PartnersStyle = 'grid' | 'marquee' | 'mono' | 'badge' | 'carousel' | 'featured';

export interface PartnerItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}
