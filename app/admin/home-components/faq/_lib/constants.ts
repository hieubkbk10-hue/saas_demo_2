import type { FaqConfig, FaqStyleOption, FaqItem } from '../_types';

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  { id: 1, question: '', answer: '' },
];

export const FAQ_STYLES: FaqStyleOption[] = [
  { id: 'accordion', label: 'Accordion' },
  { id: 'cards', label: 'Cards' },
  { id: 'two-column', label: '2 Cột' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'tabbed', label: 'Tabbed' },
];

export const DEFAULT_FAQ_CONFIG: FaqConfig = {
  description: '',
  buttonText: '',
  buttonLink: '',
};
