import type { VoucherPromotionsStyle } from '@/lib/home-components/voucher-promotions';

export type { VoucherPromotionsStyle };

export type VoucherPromotionsBrandMode = 'single' | 'dual';
export type VoucherPromotionsHarmony = 'analogous' | 'complementary' | 'triadic';


export interface VoucherPromotionsTexts {
  heading: string;
  description: string;
  ctaLabel: string;
}

export interface VoucherPromotionItem {
  _id?: string;
  code: string;
  createdAt?: number;
  description?: string;
  discountType: 'percent' | 'fixed' | 'buy_x_get_y' | 'buy_a_get_b' | 'tiered' | 'free_shipping' | 'gift';
  discountValue?: number;
  endDate?: number;
  isActive?: boolean;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  name: string;
  thumbnail?: string;
}

export interface VoucherPromotionsTexts {
  heading: string;
  description: string;
  ctaLabel: string;
}

export interface VoucherPromotionsConfig {
  texts?: VoucherPromotionsTexts;
  ctaUrl?: string;
  harmony?: VoucherPromotionsHarmony;
}

export interface VoucherPromotionsConfigState extends VoucherPromotionsConfig {
  style: VoucherPromotionsStyle;
  limit: number;
  texts: VoucherPromotionsTexts;
}
