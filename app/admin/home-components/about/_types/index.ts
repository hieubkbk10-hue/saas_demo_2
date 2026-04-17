export interface AboutPersistStat {
  value: string;
  label: string;
}

export interface AboutEditorStat extends AboutPersistStat {
  id: string;
}

export type AboutStyle = 'classic' | 'bento' | 'minimal' | 'split' | 'timeline' | 'showcase';
export type AboutBrandMode = 'single' | 'dual';
export type AboutHarmony = 'analogous' | 'complementary' | 'triadic';

export interface AboutConfig {
  layout?: string;
  subHeading: string;
  heading: string;
  description: string;
  image: string;
  stats: AboutPersistStat[];
  buttonText: string;
  buttonLink: string;
  style?: AboutStyle;
  imageCaption?: string;
  harmony?: AboutHarmony;
}

export interface AboutEditorState {
  subHeading: string;
  heading: string;
  description: string;
  image: string;
  imageCaption: string;
  buttonText: string;
  buttonLink: string;
  stats: AboutEditorStat[];
  style: AboutStyle;
}

export interface AboutStyleOption {
  id: AboutStyle;
  label: string;
}
