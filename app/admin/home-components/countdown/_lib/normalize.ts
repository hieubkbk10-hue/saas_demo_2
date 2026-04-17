import { DEFAULT_COUNTDOWN_CONFIG } from './constants';
import type {
  CountdownConfig,
  CountdownConfigState,
  CountdownStyle,
} from '../_types';

const COUNTDOWN_STYLE_SET = new Set<CountdownStyle>(['banner', 'floating', 'minimal', 'split', 'sticky', 'popup']);

const normalizeText = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {return fallback;}
  return value.trim();
};

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') {return value;}
  return fallback;
};

export const normalizeCountdownStyle = (value: unknown): CountdownStyle => {
  if (typeof value === 'string' && COUNTDOWN_STYLE_SET.has(value as CountdownStyle)) {
    return value as CountdownStyle;
  }
  return DEFAULT_COUNTDOWN_CONFIG.style;
};

export const normalizeCountdownEndDate = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return DEFAULT_COUNTDOWN_CONFIG.endDate;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return DEFAULT_COUNTDOWN_CONFIG.endDate;
  }

  const iso = parsed.toISOString();
  return iso.slice(0, 16);
};

export const normalizeCountdownConfig = (raw: unknown): CountdownConfigState => {
  const source = (raw && typeof raw === 'object') ? (raw as Partial<CountdownConfig>) : {};

  return {
    heading: normalizeText(source.heading, DEFAULT_COUNTDOWN_CONFIG.heading),
    subHeading: normalizeText(source.subHeading, DEFAULT_COUNTDOWN_CONFIG.subHeading),
    description: normalizeText(source.description, DEFAULT_COUNTDOWN_CONFIG.description),
    endDate: normalizeCountdownEndDate(source.endDate),
    buttonText: normalizeText(source.buttonText, DEFAULT_COUNTDOWN_CONFIG.buttonText),
    buttonLink: normalizeText(source.buttonLink, DEFAULT_COUNTDOWN_CONFIG.buttonLink),
    backgroundImage: normalizeText(source.backgroundImage, DEFAULT_COUNTDOWN_CONFIG.backgroundImage),
    discountText: normalizeText(source.discountText, DEFAULT_COUNTDOWN_CONFIG.discountText),
    showDays: normalizeBoolean(source.showDays, DEFAULT_COUNTDOWN_CONFIG.showDays),
    showHours: normalizeBoolean(source.showHours, DEFAULT_COUNTDOWN_CONFIG.showHours),
    showMinutes: normalizeBoolean(source.showMinutes, DEFAULT_COUNTDOWN_CONFIG.showMinutes),
    showSeconds: normalizeBoolean(source.showSeconds, DEFAULT_COUNTDOWN_CONFIG.showSeconds),
    style: normalizeCountdownStyle(source.style),
  };
};

export const toCountdownPersistConfig = (config: CountdownConfigState): CountdownConfig => ({
  heading: config.heading,
  subHeading: config.subHeading,
  description: config.description,
  endDate: config.endDate,
  buttonText: config.buttonText,
  buttonLink: config.buttonLink,
  backgroundImage: config.backgroundImage,
  discountText: config.discountText,
  showDays: config.showDays,
  showHours: config.showHours,
  showMinutes: config.showMinutes,
  showSeconds: config.showSeconds,
  style: config.style,
});
