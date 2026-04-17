import type {
  ClientsConfig,
  ClientsStyle,
} from '../_types';

export const CLIENTS_STYLES: Array<{ id: ClientsStyle; label: string }> = [
  { id: 'simpleGrid', label: 'Simple Grid' },
  { id: 'compactInline', label: 'Compact Inline' },
  { id: 'subtleMarquee', label: 'Subtle Marquee' },
  { id: 'grid', label: 'Grid' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'featured', label: 'Featured' },
];

export const DEFAULT_CLIENTS_CONFIG: ClientsConfig = {
  items: [
    {
      link: '',
      name: '',
      url: '',
    },
  ],
  style: 'simpleGrid',
  texts: {
    simpleGrid: {
      subtitle: 'Được tin tưởng bởi',
      heading: 'Khách hàng tin tưởng',
    },
    compactInline: {
      heading: 'Khách hàng tin tưởng',
    },
    subtleMarquee: {
      heading: 'Khách hàng tin tưởng',
      subtitle: 'Đối tác',
    },
    grid: {
      heading: 'Khách hàng tin tưởng',
      countLabel: 'đối tác',
    },
    carousel: {
      heading: 'Khách hàng tin tưởng',
      scrollHint: 'Vuốt để xem thêm',
    },
    featured: {
      heading: 'Khách hàng tin tưởng',
      subtitle: 'Được tin tưởng bởi các thương hiệu hàng đầu',
      othersLabel: 'Và nhiều đối tác khác',
    },
  } as Record<ClientsStyle, Record<string, string>>,
};
