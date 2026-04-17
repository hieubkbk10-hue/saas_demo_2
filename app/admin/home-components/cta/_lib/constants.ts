import type { CTAConfig, CTAStyle } from '../_types';

export const CTA_STYLES: CTAStyle[] = ['banner', 'centered', 'split', 'floating', 'gradient', 'minimal'];

export const normalizeCTAStyle = (value: unknown): CTAStyle => (
  typeof value === 'string' && CTA_STYLES.includes(value as CTAStyle)
    ? (value as CTAStyle)
    : 'banner'
);

export const DEFAULT_CTA_CONFIG: CTAConfig = {
  badge: '',
  buttonLink: '',
  buttonText: '',
  description: '',
  secondaryButtonLink: '',
  secondaryButtonText: '',
  title: '',
};
