'use client';

export type CaseStudyStyle = 'grid' | 'featured' | 'list' | 'masonry' | 'carousel' | 'timeline';
export type CaseStudyBrandMode = 'single' | 'dual';

export interface CaseStudyProject {
  id: number | string;
  title: string;
  category: string;
  image: string;
  description: string;
  link?: string;
}
