'use client';

import type { StatsItem } from '../_types';

export const STATS_STYLES = [
  { id: 'horizontal' as const, label: 'Thanh ngang' },
  { id: 'cards' as const, label: 'Cards' },
  { id: 'icons' as const, label: 'Circle' },
  { id: 'gradient' as const, label: 'Gradient' },
  { id: 'minimal' as const, label: 'Minimal' },
  { id: 'counter' as const, label: 'Counter' },
];

export const DEFAULT_STATS_ITEMS: StatsItem[] = [
  { label: 'Khách hàng', value: '1000+' },
  { label: 'Đối tác', value: '50+' },
  { label: 'Hài lòng', value: '99%' },
  { label: 'Hỗ trợ', value: '24/7' },
];
