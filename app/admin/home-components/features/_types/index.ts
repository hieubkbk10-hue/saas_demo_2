export interface FeatureItem {
  id: number;
  icon: string;
  title: string;
  description: string;
}

export type FeaturesStyle = 'iconGrid' | 'alternating' | 'compact' | 'cards' | 'carousel' | 'timeline';
export type FeaturesBrandMode = 'single' | 'dual';
export type FeaturesHarmony = 'analogous' | 'complementary' | 'triadic';


export interface FeaturesConfig {
  items: FeatureItem[];
  style: FeaturesStyle;
  harmony?: FeaturesHarmony;
}
