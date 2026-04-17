import type { CountdownConfigState, CountdownStyle } from '../_types';

export const COUNTDOWN_STYLES: Array<{ id: CountdownStyle; label: string }> = [
  { id: 'banner', label: 'Banner' },
  { id: 'floating', label: 'Floating' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'split', label: 'Split' },
  { id: 'sticky', label: 'Sticky' },
  { id: 'popup', label: 'Popup' },
];

export const DEFAULT_COUNTDOWN_END_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

export const DEFAULT_COUNTDOWN_CONFIG: CountdownConfigState = {
  heading: 'Flash Sale - Giảm giá sốc!',
  subHeading: 'Ưu đãi có hạn',
  description: 'Nhanh tay đặt hàng trước khi hết thời gian khuyến mãi',
  endDate: DEFAULT_COUNTDOWN_END_DATE,
  buttonText: 'Mua ngay',
  buttonLink: '/products',
  backgroundImage: '',
  discountText: '-50%',
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  style: 'banner',
};
