export type CountdownStyle = 'banner' | 'floating' | 'minimal' | 'split' | 'sticky' | 'popup';

export type CountdownBrandMode = 'single' | 'dual';
export type CountdownHarmony = 'analogous' | 'complementary' | 'triadic';


export interface CountdownConfig {
  heading: string;
  subHeading: string;
  description: string;
  endDate: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  discountText: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  style?: CountdownStyle;
  harmony?: CountdownHarmony;
}

export interface CountdownConfigState extends CountdownConfig {
  style: CountdownStyle;
}
