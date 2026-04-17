import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type CartAvailability = {
  isAvailable: boolean;
  isLoading: boolean;
  cartEnabled: boolean;
  ordersEnabled: boolean;
};

export function useCartAvailable(): CartAvailability {
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });

  const isLoading = cartModule === undefined || ordersModule === undefined;
  const cartEnabled = cartModule?.enabled ?? false;
  const ordersEnabled = ordersModule?.enabled ?? false;
  const isAvailable = cartEnabled && ordersEnabled;

  return { cartEnabled, isAvailable, isLoading, ordersEnabled };
}
