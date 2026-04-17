import type { ServiceEditorItem, ServiceItem } from '../_types';

export const normalizeServicesItemsForEditor = (items: unknown): ServiceEditorItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        return null;
      }

      const source = raw as Partial<ServiceEditorItem>;
      const fallbackId = 1_000_000 + index;
      const parsedId = typeof source.id === 'number' ? source.id : Number(source.id);

      return {
        id: Number.isFinite(parsedId) ? parsedId : fallbackId,
        icon: typeof source.icon === 'string' ? source.icon : 'Star',
        title: typeof source.title === 'string' ? source.title : '',
        description: typeof source.description === 'string' ? source.description : '',
      } as ServiceEditorItem;
    })
    .filter((item): item is ServiceEditorItem => item !== null);
};

export const toServicesPersistItems = (items: ServiceEditorItem[]): ServiceItem[] => {
  return items.map(({ icon, title, description }) => ({ icon, title, description }));
};
