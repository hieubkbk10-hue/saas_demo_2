import type { FeatureItem, FeaturesConfig } from '../_types';

export const FEATURE_ICON_OPTIONS = [
  'Zap',
  'Shield',
  'Target',
  'Layers',
  'Cpu',
  'Globe',
  'Rocket',
  'Settings',
  'Check',
  'Star',
] as const;

export const createFeatureItem = (overrides?: Partial<FeatureItem>): FeatureItem => ({
  id: Date.now() + Math.floor(Math.random() * 10000),
  icon: 'Star',
  title: '',
  description: '',
  ...overrides,
});

export const normalizeFeatureItems = (items: unknown): FeatureItem[] => {
  if (!Array.isArray(items)) {
    return [createFeatureItem()];
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') {return null;}
      const source = item as Record<string, unknown>;
      const fallbackId = Date.now() + index;
      return createFeatureItem({
        id: typeof source.id === 'number' ? source.id : fallbackId,
        icon: typeof source.icon === 'string' && source.icon.trim().length > 0 ? source.icon : 'Star',
        title: typeof source.title === 'string' ? source.title : '',
        description: typeof source.description === 'string' ? source.description : '',
      });
    })
    .filter((item): item is FeatureItem => item !== null);

  return normalized.length > 0 ? normalized : [createFeatureItem()];
};

export const DEFAULT_FEATURES_CONFIG: FeaturesConfig = {
  items: [createFeatureItem()],
  style: 'iconGrid',
};
