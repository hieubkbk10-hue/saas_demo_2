export interface CTAConfig {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  badge?: string;
  backgroundImage?: string;
  harmony?: CTAHarmony;
}

export type CTAStyle = 'banner' | 'centered' | 'split' | 'floating' | 'gradient' | 'minimal';
export type CTAHarmony = 'analogous' | 'complementary' | 'triadic';
