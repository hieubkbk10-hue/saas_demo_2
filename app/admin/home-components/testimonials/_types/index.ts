export interface TestimonialsPersistItem {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

export interface TestimonialsItem extends TestimonialsPersistItem {
  id: string;
}

export type TestimonialsStyle = 'cards' | 'slider' | 'masonry' | 'quote' | 'carousel' | 'minimal';

export type TestimonialsBrandMode = 'single' | 'dual';
export type TestimonialsHarmony = 'analogous' | 'complementary' | 'triadic';

export interface TestimonialsConfig {
  items: TestimonialsPersistItem[];
  style: TestimonialsStyle;
  harmony?: TestimonialsHarmony;
}
