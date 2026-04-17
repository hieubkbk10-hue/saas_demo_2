export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface ServiceEditorItem extends ServiceItem {
  id: number;
}

export type ServicesStyle = 'elegantGrid' | 'modernList' | 'bigNumber' | 'cards' | 'carousel' | 'timeline';
export type ServicesBrandMode = 'single' | 'dual';
export type ServicesHarmony = 'analogous' | 'complementary' | 'triadic';

export interface ServicesConfig {
  items: ServiceItem[];
  style: ServicesStyle;
  harmony?: ServicesHarmony;
}

export interface ServicesColorTokens {
  primary: string;
  secondary: string;
  heading: string;
  sectionAccent: string;
  iconColor: string;
  bodyText: string;
  mutedText: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  secondaryTint: string;
  primaryTint: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;
  numberText: string;
  timelineLine: string;
  timelineDotBorder: string;
  buttonText: string;
  buttonBackground: string;
  buttonBorder: string;
  placeholderBackground: string;
  placeholderIconBackground: string;
  placeholderIcon: string;
  placeholderText: string;
  plusTileBorder: string;
  plusTileText: string;
}

export interface ServicesHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface ServicesAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface ServicesAccessibilityScore {
  minLc: number;
  failing: Array<ServicesAccessibilityPair & { lc: number; threshold: number }>;
}
