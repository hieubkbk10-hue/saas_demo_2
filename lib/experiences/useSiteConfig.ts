import { api } from '@/convex/_generated/api';
import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { useCartAvailable } from './useCartAvailable';
import { normalizeOrderStatusPreset, parseOrderStatuses } from '@/lib/orders/statuses';
import { parseErrorPagesConfig, type ErrorPagesExperienceConfig } from './error-pages/config';

type PaginationType = 'pagination' | 'infiniteScroll';
type FilterPosition = 'sidebar' | 'top' | 'none';
type SearchLayoutStyle = 'search-only' | 'with-filters' | 'advanced';
type ResultsDisplayStyle = 'grid' | 'list';

type PostsListConfig = {
  layoutStyle: 'grid' | 'list' | 'masonry';
  filterPosition: FilterPosition;
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
};

type SearchFilterConfig = {
  layoutStyle: SearchLayoutStyle;
  resultsDisplayStyle: ResultsDisplayStyle;
  showFilters: boolean;
  showSorting: boolean;
  showResultCount: boolean;
};

type PostDetailLayoutStyle = 'classic' | 'modern' | 'minimal';

type PostDetailLayoutConfig = {
  showAuthor: boolean;
  showShare: boolean;
  showComments: boolean;
  showCommentLikes: boolean;
  showCommentReplies: boolean;
  showRelated: boolean;
  showTags: boolean;
  showThumbnail: boolean;
};

type PostsDetailConfig = PostDetailLayoutConfig & {
  layoutStyle: PostDetailLayoutStyle;
};

type BookingExperienceConfig = {
  showLegend: boolean;
  showCapacityHint: boolean;
  showServiceSelect: boolean;
};

const DEFAULT_POST_DETAIL_CONFIG: PostDetailLayoutConfig = {
  showAuthor: true,
  showShare: true,
  showComments: true,
  showCommentLikes: true,
  showCommentReplies: true,
  showRelated: true,
  showTags: true,
  showThumbnail: true,
};

const normalizePaginationType = (value?: string | boolean): PaginationType => {
  if (value === 'infiniteScroll') return 'infiniteScroll';
  if (value === 'pagination') return 'pagination';
  if (value === false) return 'infiniteScroll';
  return 'pagination';
};

export function usePostsListConfig(): PostsListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'posts_list_ui' });
  
  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<PostsListConfig & { showPagination?: boolean }> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'grid',
      filterPosition: raw?.filterPosition ?? 'sidebar',
      paginationType: normalizePaginationType(raw?.paginationType ?? raw?.showPagination),
      showSearch: raw?.showSearch ?? true,
      showCategories: raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: raw?.postsPerPage ?? 12,
    };
  }, [experienceSetting?.value]);
}

export function useSearchFilterConfig(): SearchFilterConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'search_filter_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: SearchLayoutStyle;
      layouts?: Partial<Record<SearchLayoutStyle, Partial<Omit<SearchFilterConfig, 'layoutStyle'>>>>;
    } | undefined;
    const layoutStyle: SearchLayoutStyle = raw?.layoutStyle ?? 'with-filters';
    const defaultConfig = {
      resultsDisplayStyle: 'grid' as ResultsDisplayStyle,
      showFilters: layoutStyle === 'search-only' ? false : true,
      showSorting: true,
      showResultCount: true,
    };
    const layoutConfig = raw?.layouts?.[layoutStyle] ?? {};
    return {
      layoutStyle,
      ...defaultConfig,
      ...layoutConfig,
    };
  }, [experienceSetting?.value]);
}

export function usePostsDetailConfig(): PostsDetailConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'posts_detail_ui' });
  const legacyStyleSetting = useQuery(api.settings.getByKey, { key: 'posts_detail_style' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: PostDetailLayoutStyle;
      showAuthor?: boolean;
      showShare?: boolean;
      showComments?: boolean;
      showCommentLikes?: boolean;
      showCommentReplies?: boolean;
      showRelated?: boolean;
      showTags?: boolean;
      showThumbnail?: boolean;
      layouts?: Record<PostDetailLayoutStyle, Partial<PostDetailLayoutConfig>>;
    } | undefined;
    const legacyStyle = legacyStyleSetting?.value as PostDetailLayoutStyle | undefined;
    const layoutStyle = raw?.layoutStyle ?? legacyStyle ?? 'classic';
    const legacyShared = raw?.layouts?.classic ?? raw?.layouts?.modern ?? raw?.layouts?.minimal ?? {};
    return {
      layoutStyle,
      ...DEFAULT_POST_DETAIL_CONFIG,
      ...legacyShared,
      ...raw,
    };
  }, [experienceSetting?.value, legacyStyleSetting?.value]);
}

export function useBookingConfig(): BookingExperienceConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'booking_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<BookingExperienceConfig> | undefined;
    return {
      showLegend: raw?.showLegend ?? true,
      showCapacityHint: raw?.showCapacityHint ?? true,
      showServiceSelect: raw?.showServiceSelect ?? true,
    };
  }, [experienceSetting?.value]);
}

type ProductsListConfig = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  showPromotionBadge: boolean;
  enableQuickAddVariant: boolean;
};

export function useProductsListConfig(): ProductsListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'products_list_ui' });
  const { isAvailable: cartAvailable, ordersEnabled } = useCartAvailable();
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });
  
  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: ProductsListConfig['layoutStyle'] | 'masonry';
      layouts?: Record<string, Partial<Omit<ProductsListConfig, 'layoutStyle'> & { showPagination?: boolean }>>;
      paginationType?: string | boolean;
      showPagination?: boolean;
      showSearch?: boolean;
      showCategories?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
      showWishlistButton?: boolean;
      showAddToCartButton?: boolean;
      showBuyNowButton?: boolean;
      showPromotionBadge?: boolean;
      enableQuickAddVariant?: boolean;
    } | undefined;

    const rawLayout = raw?.layoutStyle;
    const layoutStyle: ProductsListConfig['layoutStyle'] = rawLayout === 'masonry' ? 'sidebar' : (rawLayout ?? 'grid');
    const layoutConfig = layoutStyle === 'sidebar'
      ? (raw?.layouts?.sidebar ?? raw?.layouts?.masonry)
      : raw?.layouts?.[layoutStyle];
    
    const configShowAddToCart = raw?.showAddToCartButton ?? true;
    const configShowBuyNow = raw?.showBuyNowButton ?? true;
    
    const wishlistEnabled = wishlistModule?.enabled ?? false;
    const promotionsEnabled = promotionsModule?.enabled ?? false;

    return {
      layoutStyle,
      paginationType: normalizePaginationType(layoutConfig?.paginationType ?? raw?.paginationType ?? layoutConfig?.showPagination ?? raw?.showPagination),
      showSearch: layoutConfig?.showSearch ?? raw?.showSearch ?? true,
      showCategories: layoutConfig?.showCategories ?? raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: layoutConfig?.postsPerPage ?? raw?.postsPerPage ?? 12,
      showWishlistButton: (raw?.showWishlistButton ?? true) && wishlistEnabled,
      showAddToCartButton: configShowAddToCart && cartAvailable,
      showBuyNowButton: configShowBuyNow && ordersEnabled,
      showPromotionBadge: (raw?.showPromotionBadge ?? true) && promotionsEnabled,
      enableQuickAddVariant: (raw?.enableQuickAddVariant ?? true) && cartAvailable,
    };
  }, [experienceSetting?.value, cartAvailable, ordersEnabled, wishlistModule?.enabled, promotionsModule?.enabled]);
}

type WishlistConfig = {
  layoutStyle: 'grid' | 'list' | 'table';
  showWishlistButton: boolean;
  showNote: boolean;
  showNotification: boolean;
  showAddToCartButton: boolean;
};

export function useWishlistConfig(): WishlistConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'wishlist_ui' });
  const noteFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNote', moduleKey: 'wishlist' });
  const notificationFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNotification', moduleKey: 'wishlist' });
  const { isAvailable: cartAvailable } = useCartAvailable();

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: WishlistConfig['layoutStyle'] | 'masonry';
      layouts?: Record<string, Partial<Omit<WishlistConfig, 'layoutStyle'>>>;
      showAddToCartButton?: boolean;
    } | undefined;

    const rawLayout = raw?.layoutStyle;
    const layoutStyle: WishlistConfig['layoutStyle'] = rawLayout === 'masonry' ? 'table' : (rawLayout ?? 'grid');
    const layoutConfig = raw?.layouts?.[layoutStyle] ?? raw?.layouts?.masonry ?? {};
    const showNote = layoutConfig.showNote ?? true;
    const showNotification = layoutConfig.showNotification ?? true;
    const configShowAddToCart = layoutConfig.showAddToCartButton ?? raw?.showAddToCartButton ?? true;

    return {
      layoutStyle,
      showWishlistButton: layoutConfig.showWishlistButton ?? true,
      showNote: (noteFeature?.enabled ?? true) && showNote,
      showNotification: (notificationFeature?.enabled ?? true) && showNotification,
      showAddToCartButton: configShowAddToCart && cartAvailable,
    };
  }, [experienceSetting?.value, noteFeature?.enabled, notificationFeature?.enabled, cartAvailable]);
}

type ServicesListConfig = {
   layoutStyle: 'grid' | 'sidebar' | 'masonry';
  filterPosition: 'sidebar' | 'top' | 'none';
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  hideEmptyCategories: boolean;
  postsPerPage: number;
};

export function useServicesListConfig(): ServicesListConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'services_list_ui' });
  
  return useMemo(() => {
    const raw = experienceSetting?.value as {
       layoutStyle?: ServicesListConfig['layoutStyle'] | 'list';
      layouts?: Record<string, Partial<Omit<ServicesListConfig, 'layoutStyle'> & { showPagination?: boolean }>>;
      filterPosition?: FilterPosition;
      paginationType?: string | boolean;
      showPagination?: boolean;
      showSearch?: boolean;
      showCategories?: boolean;
      hideEmptyCategories?: boolean;
      postsPerPage?: number;
    } | undefined;

     const rawLayout = raw?.layoutStyle;
     const layoutStyle: ServicesListConfig['layoutStyle'] = rawLayout === 'list' ? 'sidebar' : (rawLayout ?? 'grid');
    const layoutConfig = raw?.layouts?.[layoutStyle];
    return {
      layoutStyle,
      filterPosition: layoutConfig?.filterPosition ?? raw?.filterPosition ?? 'sidebar',
      paginationType: normalizePaginationType(layoutConfig?.paginationType ?? raw?.paginationType ?? layoutConfig?.showPagination ?? raw?.showPagination),
      showSearch: layoutConfig?.showSearch ?? raw?.showSearch ?? true,
      showCategories: layoutConfig?.showCategories ?? raw?.showCategories ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
      postsPerPage: layoutConfig?.postsPerPage ?? raw?.postsPerPage ?? 12,
    };
  }, [experienceSetting?.value]);
}

type CartConfig = {
  layoutStyle: 'drawer' | 'page' | 'table';
  showExpiry: boolean;
  showNote: boolean;
};

export function useCartConfig(): CartConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'cart_ui' });
  const expiryFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableExpiry', moduleKey: 'cart' });
  const noteFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableNote', moduleKey: 'cart' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: CartConfig['layoutStyle'];
      layouts?: Record<string, Partial<Omit<CartConfig, 'layoutStyle'>>>;
    } | undefined;

    const layoutStyle: CartConfig['layoutStyle'] = raw?.layoutStyle ?? 'drawer';
    const layoutConfig = raw?.layouts?.[layoutStyle] ?? {};

    return {
      layoutStyle,
      showExpiry: (expiryFeature?.enabled ?? false) && (layoutConfig.showExpiry ?? false),
      showNote: (noteFeature?.enabled ?? false) && (layoutConfig.showNote ?? false),
    };
  }, [experienceSetting?.value, expiryFeature?.enabled, noteFeature?.enabled]);
}

type CheckoutConfig = {
  flowStyle: 'single-page' | 'multi-step' | 'wizard-accordion';
  orderSummaryPosition: 'right' | 'bottom';
  showPaymentMethods: boolean;
  showShippingOptions: boolean;
  showBuyNow: boolean;
};

export function useCheckoutConfig(): CheckoutConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'checkout_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as {
      flowStyle?: CheckoutConfig['flowStyle'];
      layouts?: Record<string, Partial<Omit<CheckoutConfig, 'flowStyle' | 'showBuyNow'>>>;
      showBuyNow?: boolean;
      orderSummaryPosition?: CheckoutConfig['orderSummaryPosition'];
      showPaymentMethods?: boolean;
      showShippingOptions?: boolean;
    } | undefined;

    const flowStyle: CheckoutConfig['flowStyle'] = raw?.flowStyle ?? 'multi-step';
    const layoutConfig = raw?.layouts?.[flowStyle] ?? {};

    return {
      flowStyle,
      orderSummaryPosition: layoutConfig.orderSummaryPosition ?? raw?.orderSummaryPosition ?? 'right',
      showPaymentMethods: layoutConfig.showPaymentMethods ?? raw?.showPaymentMethods ?? true,
      showShippingOptions: layoutConfig.showShippingOptions ?? raw?.showShippingOptions ?? true,
      showBuyNow: raw?.showBuyNow ?? true,
    };
  }, [experienceSetting?.value]);
}

type AccountOrdersConfig = {
  layoutStyle: 'cards' | 'compact' | 'timeline';
  showStats: boolean;
  showOrderItems: boolean;
  showPaymentMethod: boolean;
  showShippingMethod: boolean;
  showShippingAddress: boolean;
  showTracking: boolean;
  showTimeline: boolean;
  paginationType: PaginationType;
  ordersPerPage: number;
  defaultStatusFilter: string[];
};

export function useAccountOrdersConfig(): AccountOrdersConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'account_orders_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<AccountOrdersConfig> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'cards',
      showStats: raw?.showStats ?? true,
      showOrderItems: raw?.showOrderItems ?? true,
      showPaymentMethod: raw?.showPaymentMethod ?? true,
      showShippingMethod: raw?.showShippingMethod ?? true,
      showShippingAddress: raw?.showShippingAddress ?? true,
      showTracking: raw?.showTracking ?? true,
      showTimeline: raw?.showTimeline ?? true,
      paginationType: normalizePaginationType(raw?.paginationType),
      ordersPerPage: raw?.ordersPerPage ?? 12,
      defaultStatusFilter: Array.isArray(raw?.defaultStatusFilter)
        ? raw?.defaultStatusFilter.filter((value) => typeof value === 'string')
        : [],
    };
  }, [experienceSetting?.value]);
}

export function useOrderStatuses() {
  const statusData = useQuery(api.orders.getOrderStatuses);

  return useMemo(() => {
    const preset = normalizeOrderStatusPreset(statusData?.preset);
    const statuses = parseOrderStatuses(statusData?.statuses, preset);

    return {
      preset,
      statuses,
    };
  }, [statusData?.preset, statusData?.statuses]);
}

type AccountProfileConfig = {
  layoutStyle: 'card' | 'sidebar' | 'compact';
  showQuickActions: boolean;
  showContactInfo: boolean;
  showAddress: boolean;
  showMemberId: boolean;
  showJoinDate: boolean;
  actionItems: string[];
};

export function useAccountProfileConfig(): AccountProfileConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'account_profile_ui' });

  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<AccountProfileConfig> | undefined;
    const rawActions = Array.isArray(raw?.actionItems)
      ? raw?.actionItems.filter((value): value is string => typeof value === 'string')
      : null;
    const normalizedActions = rawActions?.length ? rawActions : ['orders', 'shop', 'wishlist', 'payment', 'settings'];

    return {
      layoutStyle: raw?.layoutStyle ?? 'card',
      showQuickActions: raw?.showQuickActions ?? true,
      showContactInfo: raw?.showContactInfo ?? true,
      showAddress: raw?.showAddress ?? true,
      showMemberId: raw?.showMemberId ?? true,
      showJoinDate: raw?.showJoinDate ?? true,
      actionItems: normalizedActions,
    };
  }, [experienceSetting?.value]);
}

export function useErrorPagesConfig(): ErrorPagesExperienceConfig {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'error_pages_ui' });

  return useMemo(() => parseErrorPagesConfig(experienceSetting?.value), [experienceSetting?.value]);
}
