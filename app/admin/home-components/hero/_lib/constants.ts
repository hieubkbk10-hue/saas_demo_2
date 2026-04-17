'use client';

import type { HeroContent } from '../_types';

export const HERO_STYLES = [
  { id: 'slider' as const, label: 'Slider' },
  { id: 'fade' as const, label: 'Fade' },
  { id: 'bento' as const, label: 'Bento' },
  { id: 'fullscreen' as const, label: 'Fullscreen' },
  { id: 'split' as const, label: 'Split' },
  { id: 'parallax' as const, label: 'Parallax' },
];

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badge: 'Nổi bật',
  countdownText: 'Còn 3 ngày',
  description: 'Sản phẩm chất lượng cao với giá thành hợp lý',
  heading: 'Khám phá bộ sưu tập mới nhất',
  primaryButtonText: 'Khám phá ngay',
  primaryButtonLink: '',
  secondaryButtonText: 'Tìm hiểu thêm',
  secondaryButtonLink: '',
  showFullscreenContent: true,
};
