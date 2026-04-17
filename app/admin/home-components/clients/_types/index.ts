export interface ClientItem {
  url: string;
  link: string;
  name?: string;
}

export interface ClientEditorItem extends ClientItem {
  id: string;
  inputMode: 'upload' | 'url';
}

export type ClientsStyle = 'simpleGrid' | 'compactInline' | 'subtleMarquee' | 'grid' | 'carousel' | 'featured';
export type ClientsBrandMode = 'single' | 'dual';
export type ClientsHarmony = 'analogous' | 'complementary' | 'triadic';

export interface ClientsConfig {
  items: ClientItem[];
  style: ClientsStyle;
  texts?: Record<ClientsStyle, Record<string, string>>;
  harmony?: ClientsHarmony;
}
