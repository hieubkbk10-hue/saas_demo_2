'use client';

import type { CaseStudyStyle } from '../_types';

export const CASE_STUDY_STYLES: { id: CaseStudyStyle; label: string }[] = [
  { id: 'grid', label: 'Grid' },
  { id: 'featured', label: 'Featured' },
  { id: 'list', label: 'List' },
  { id: 'masonry', label: 'Masonry' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'timeline', label: 'Timeline' },
];
