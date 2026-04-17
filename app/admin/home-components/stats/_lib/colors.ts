'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type { StatsBrandMode } from '../_types';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

const isNonEmptyColor = (value: string) => value.trim().length > 0;

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch('#3b82f6')
);

const resolveStatsSecondary = (
  primary: string,
  secondary: string,
  mode: StatsBrandMode,
) => {
  if (mode === 'single') {
    return primary;
  }

  return isNonEmptyColor(secondary) ? secondary : primary;
};

const getTint = (hex: string, lightness: number, fallback: string) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, l: clampLightness(color.l + lightness) }));
};

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

export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

const getTextOnGradient = (primary: string, secondary: string, fontSize = 16, fontWeight = 500) => {
  const whitePrimary = getAPCALc('#ffffff', primary);
  const whiteSecondary = getAPCALc('#ffffff', secondary);
  const blackPrimary = getAPCALc('#000000', primary);
  const blackSecondary = getAPCALc('#000000', secondary);
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  const whiteMin = Math.min(whitePrimary, whiteSecondary);
  const blackMin = Math.min(blackPrimary, blackSecondary);

  if (whiteMin >= threshold || blackMin >= threshold) {
    return whiteMin >= blackMin ? '#ffffff' : '#0f172a';
  }

  return whiteMin > blackMin ? '#ffffff' : '#0f172a';
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

export const getHorizontalColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);

  return {
    border: getTint(secondaryResolved, 0.35, primary),
  };
};

export const getCardsColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);

  return {
    border: getTint(secondaryResolved, 0.35, primary),
    accent: secondaryResolved,
  };
};

export const getIconsColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);
  const secondaryStrong = getTint(secondaryResolved, -0.18, primary);

  return {
    circleBg: primary,
    textOnCircle: getAPCATextColor(primary, 20, 700),
    ring: getTint(secondaryResolved, -0.12, primary),
    label: ensureAPCATextColor(secondaryStrong, '#ffffff', 14, 600),
  };
};

export const getGradientColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);

  return {
    background: `linear-gradient(135deg, ${primary} 0%, ${secondaryResolved} 100%)`,
    border: getTint(secondaryResolved, 0.35, primary),
    text: getTextOnGradient(primary, secondaryResolved, 20, 700),
    label: getTextOnGradient(primary, secondaryResolved, 14, 500),
  };
};

export const getMinimalColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);
  const secondaryStrong = getTint(secondaryResolved, -0.18, primary);

  return {
    accent: secondaryStrong,
    value: ensureAPCATextColor(primary, '#ffffff', 32, 700),
  };
};

export const getCounterColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);

  return {
    border: getTint(secondaryResolved, 0.35, primary),
    progress: secondaryResolved,
    value: ensureAPCATextColor(primary, '#ffffff', 32, 700),
  };
};
