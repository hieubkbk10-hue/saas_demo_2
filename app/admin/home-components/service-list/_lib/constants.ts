import type {
  ServiceListConfig,
  ServiceListStyle,
} from '../_types';

export const SERVICE_LIST_STYLES: { id: ServiceListStyle; label: string }[] = [
  { id: 'grid', label: 'Grid' },
  { id: 'bento', label: 'Bento' },
  { id: 'list', label: 'List' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'showcase', label: 'Showcase' }
];

export const DEFAULT_SERVICE_LIST_CONFIG: ServiceListConfig = {
  itemCount: 8,
  selectionMode: 'auto',
  sortBy: 'newest',
};
