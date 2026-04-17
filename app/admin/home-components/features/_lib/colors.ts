import { formatHex, oklch } from 'culori';
import type { FeaturesBrandMode } from '../_types';

const DEFAULT_PRIMARY = '#3b82f6';

const safeParseOklch = (value: string) => {
  const parsed = oklch(value);
  if (parsed) {return parsed;}
  return oklch(DEFAULT_PRIMARY);
};

const isValidHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

const normalizeHexColor = (value: string, fallback = DEFAULT_PRIMARY) => {
  if (typeof value !== 'string') {return fallback;}
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  if (isValidHexColor(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback;
};

const withAlpha = (hex: string, alpha: number) => {
  const normalized = normalizeHexColor(hex, DEFAULT_PRIMARY);
  const clamped = Math.max(0, Math.min(1, alpha));
  const channel = Math.round(clamped * 255).toString(16).padStart(2, '0');
  return `${normalized}${channel}`;
};

const getAutoSecondary = (primary: string) => {
  const parsed = safeParseOklch(primary);
  if (!parsed) {return DEFAULT_PRIMARY;}

  const hue = parsed.h ?? 0;
  const shiftedHue = (hue + 30) % 360;

  return formatHex(oklch({
    ...parsed,
    h: shiftedHue,
  }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: FeaturesBrandMode,
): string => {
  const normalizedPrimary = normalizeHexColor(primary, DEFAULT_PRIMARY);
  if (mode === 'single') {
    return getAutoSecondary(normalizedPrimary);
  }

  const normalizedSecondary = normalizeHexColor(secondary, '');
  if (normalizedSecondary) {return normalizedSecondary;}
  return getAutoSecondary(normalizedPrimary);
};

export interface FeaturesColorTokens {
  primary: string;
  secondary: string;
  sectionBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;
  heading: string;
  body: string;
  muted: string;
  badgeBackground: string;
  badgeText: string;
  iconChipBackground: string;
  iconChipText: string;
  timelineLine: string;
  timelineDot: string;
  sectionRule: string;
  actionText: string;
  neutralBorder: string;
}

export const getFeaturesColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: FeaturesBrandMode;
}): FeaturesColorTokens => {
  const normalizedPrimary = normalizeHexColor(primary, DEFAULT_PRIMARY);
  const secondaryResolved = resolveSecondaryForMode(normalizedPrimary, secondary, mode);

  return {
    primary: normalizedPrimary,
    secondary: secondaryResolved,
    sectionBackground: '#ffffff',
    cardBackground: '#ffffff',
    cardBorder: withAlpha(normalizedPrimary, 0.18),
    cardBorderHover: withAlpha(normalizedPrimary, 0.34),
    heading: normalizedPrimary,
    body: '#0f172a',
    muted: '#64748b',
    badgeBackground: withAlpha(secondaryResolved, 0.14),
    badgeText: secondaryResolved,
    iconChipBackground: withAlpha(normalizedPrimary, 0.14),
    iconChipText: normalizedPrimary,
    timelineLine: withAlpha(secondaryResolved, 0.26),
    timelineDot: secondaryResolved,
    sectionRule: withAlpha(normalizedPrimary, 0.2),
    actionText: normalizedPrimary,
    neutralBorder: '#e2e8f0',
  };
};

