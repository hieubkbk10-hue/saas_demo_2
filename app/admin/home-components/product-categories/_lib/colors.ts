'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type { ProductCategoriesBrandMode } from '../_types';

export interface BrandPalette {
  solid: string;
  surface: string;
  hover: string;
  active: string;
  border: string;
  disabled: string;
  textOnSolid: string;
  textInteractive: string;
}

export interface ProductCategoriesColors {
  primary: BrandPalette;
  secondary: BrandPalette;
  neutral: {
    background: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
  };
  cardShadow: string;
  cardShadowHover: string;
  cardBorder: string;
  cardBorderHover: string;
  sectionBg: string;
  sectionAccent: string;
  linkText: string;
  productCountText: string;
  iconContainerBg: string;
  overlayText: string;
  categoryNameText: string;
  cardAccentBar: string;
  pillBg: string;
  pillBorder: string;
  ctaMoreBg: string;
  ctaMoreBorder: string;
  ctaMoreText: string;
  circularBg: string;
  circularBorder: string;
  paginationDotActive: string;
  paginationDotInactive: string;
  arrowIcon: string;
  emptyState: {
    background: string;
    iconBg: string;
    icon: string;
    text: string;
  };
}

const DEFAULT_BRAND_COLOR = '#3b82f6';

const isNonEmptyColor = (value: string) => value.trim().length > 0;

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const toRgbTuple = (value: string, fallback: string): [number, number, number] | null => {
  const parsed = safeParseOklch(value, fallback);
  const normalized = formatHex(parsed).replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return [r, g, b];
};

const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const backgroundRgb = toRgbTuple(background, '#0f172a');

  if (!textRgb || !backgroundRgb) {
    return 0;
  }

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

const toOklchString = (hex: string, alpha = 1, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const l = Math.max(0, Math.min(color.l ?? 0, 1));
  const c = Math.max(0, Math.min(color.c ?? 0, 0.4));
  const h = Number.isFinite(color.h) ? color.h : 0;
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)} / ${alpha})`;
};

const generatePalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): BrandPalette => {
  const solid = isNonEmptyColor(hex) ? hex : fallback;
  const color = safeParseOklch(solid, fallback);

  return {
    solid,
    surface: formatHex(oklch({ ...color, l: Math.min((color.l ?? 0) + 0.4, 0.98) })),
    hover: formatHex(oklch({ ...color, l: Math.max((color.l ?? 0) - 0.1, 0.1) })),
    active: formatHex(oklch({ ...color, l: Math.max((color.l ?? 0) - 0.15, 0.08) })),
    border: formatHex(oklch({ ...color, l: Math.min((color.l ?? 0) + 0.3, 0.92) })),
    disabled: formatHex(oklch({ ...color, l: Math.min((color.l ?? 0) + 0.25, 0.9), c: (color.c ?? 0) * 0.5 })),
    textOnSolid: getAPCATextColor(solid, 16, 500),
    textInteractive: formatHex(oklch({ ...color, l: Math.max((color.l ?? 0) - 0.25, 0.2) })),
  };
};

const ensureAPCATextColor = (
  preferred: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  const preferredLc = getAPCALc(preferred, background);

  if (preferredLc >= threshold) {
    return preferred;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

const resolveSecondaryForMode = (primary: string, secondary: string, mode: ProductCategoriesBrandMode) => {
  if (mode === 'single') {return primary;}
  return isNonEmptyColor(secondary) ? secondary : primary;
};

export const getProductCategoriesColors = (
  primary: string,
  secondary: string,
  mode: ProductCategoriesBrandMode
): ProductCategoriesColors => {
  const primaryPalette = generatePalette(primary);
  const secondaryResolved = resolveSecondaryForMode(primaryPalette.solid, secondary, mode);
  const secondaryPalette = generatePalette(secondaryResolved, primaryPalette.solid);
  const neutral = {
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#64748b',
  };

  return {
    primary: primaryPalette,
    secondary: secondaryPalette,
    neutral,
    cardShadow: `0 2px 8px ${toOklchString(secondaryPalette.solid, 0.15)}`,
    cardShadowHover: `0 8px 24px ${toOklchString(secondaryPalette.solid, 0.25)}`,
    cardBorder: secondaryPalette.border,
    cardBorderHover: primaryPalette.solid,
    sectionBg: neutral.background,
    sectionAccent: primaryPalette.solid,
    linkText: secondaryPalette.textInteractive,
    productCountText: secondaryPalette.textInteractive,
    iconContainerBg: toOklchString(primaryPalette.solid, 0.15),
    overlayText: getAPCATextColor('#0f172a', 16, 600),
    categoryNameText: primaryPalette.textInteractive,
    cardAccentBar: primaryPalette.solid,
    pillBg: toOklchString(primaryPalette.solid, 0.08),
    pillBorder: toOklchString(primaryPalette.solid, 0.2),
    ctaMoreBg: primaryPalette.surface,
    ctaMoreBorder: primaryPalette.border,
    ctaMoreText: ensureAPCATextColor(primaryPalette.solid, primaryPalette.surface, 14, 600),
    circularBg: toOklchString(primaryPalette.solid, 0.06),
    circularBorder: toOklchString(primaryPalette.solid, 0.2),
    paginationDotActive: secondaryPalette.solid,
    paginationDotInactive: toOklchString(secondaryPalette.solid, 0.4),
    arrowIcon: ensureAPCATextColor(primaryPalette.solid, neutral.surface, 14, 500),
    emptyState: {
      background: neutral.background,
      iconBg: neutral.surface,
      icon: primaryPalette.solid,
      text: neutral.muted,
    },
  };
};
