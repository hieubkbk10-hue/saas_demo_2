'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { getProductsListColors, type ProductsListColors } from '@/components/site/products/colors';
import { useCartConfig, useCheckoutConfig, useProductsListConfig } from '@/lib/experiences';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { notifyAddToCart, useCart } from '@/lib/cart';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { QuickAddVariantModal } from '@/components/products/QuickAddVariantModal';
import { ProductImageFrameOverlay, useProductFrameConfig } from '@/components/shared/ProductImageFrameBox';
import { ChevronDown, Heart, Package, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import type { ProductImageFrame } from '@/lib/products/product-frame';

type ProductSortOption = 'newest' | 'oldest' | 'popular' | 'price_asc' | 'price_desc' | 'name';
type ProductsListLayout = 'grid' | 'list' | 'catalog';
type ProductsSaleMode = 'cart' | 'contact' | 'affiliate';

function useProductImageAspectRatioSetting() {
  const setting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  return useMemo(() => resolveProductImageAspectRatio(setting?.value), [setting?.value]);
}

function useEnabledProductFields(): Set<string> {
  const fields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'products' });
  return useMemo(() => {
    if (!fields) {return new Set<string>();}
    return new Set(fields.map(f => f.fieldKey));
  }, [fields]);
}

function ProductsListSkeleton() {
  const brandColors = useBrandColors();
  const imageAspectRatio = useProductImageAspectRatioSetting();
  const tokens = useMemo(
    () => getProductsListColors(brandColors.primary, brandColors.secondary, brandColors.mode || 'single'),
    [brandColors.primary, brandColors.secondary, brandColors.mode]
  );
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );

  return (
    <div className="py-8 md:py-12 px-4 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-64 rounded mx-auto" style={{ backgroundColor: tokens.filterChipBg }} />
        </div>
        <div
          className="rounded-xl border p-4 mb-8"
          style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 flex-1 max-w-xs rounded-lg" style={{ backgroundColor: tokens.filterChipBg }} />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 rounded-full" style={{ backgroundColor: tokens.filterChipBg }} />
              ))}
            </div>
          </div>
        </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border"
              style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
            >
              <div style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }} />
              <div className="p-4 space-y-3">
                <div className="h-4 w-full rounded" style={{ backgroundColor: tokens.filterChipBg }} />
                <div className="h-5 w-24 rounded" style={{ backgroundColor: tokens.filterChipBg }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  const siblingCount = 1;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = 3 + 2 * siblingCount;
    for (let i = 1; i <= leftRange; i++) {
      items.push(i);
    }
    items.push('ellipsis');
    items.push(totalPages);
    return items;
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    items.push(firstPageIndex);
    items.push('ellipsis');
    const rightRange = 3 + 2 * siblingCount;
    for (let i = totalPages - rightRange + 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  items.push(firstPageIndex);
  items.push('ellipsis');
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    items.push(i);
  }
  items.push('ellipsis');
  items.push(lastPageIndex);

  return items;
}

function ProductsGridSkeleton({ count = 8, tokens }: { count?: number; tokens: ProductsListColors }) {
  const imageAspectRatio = useProductImageAspectRatioSetting();
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border"
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }} />
          <div className="p-4 space-y-3">
            <div className="h-4 w-full rounded" style={{ backgroundColor: tokens.filterChipBg }} />
            <div className="h-5 w-24 rounded" style={{ backgroundColor: tokens.filterChipBg }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsListSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const tokens = useMemo(
    () => getProductsListColors(brandColors.primary, brandColors.secondary, brandColors.mode || 'single'),
    [brandColors.primary, brandColors.secondary, brandColors.mode]
  );
  const imageAspectRatio = useProductImageAspectRatioSetting();
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const { frame: productFrame } = useProductFrameConfig();
  const listConfig = useProductsListConfig();
  const layout: ProductsListLayout = listConfig.layoutStyle === 'sidebar' ? 'catalog' : listConfig.layoutStyle;
  const enableQuickAddVariant = listConfig.enableQuickAddVariant ?? true;
  const showWishlistButton = listConfig.showWishlistButton ?? true;
  const checkoutConfig = useCheckoutConfig();
  const showPromotionBadge = listConfig.showPromotionBadge ?? true;
  const { customer, isAuthenticated, openLoginModal } = useCustomerAuth();
  const { addItem, openDrawer } = useCart();
  const cartConfig = useCartConfig();
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const toggleWishlist = useMutation(api.wishlist.toggle);
  const enabledFields = useEnabledProductFields();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);

  const saleMode = useMemo<ProductsSaleMode>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [saleModeSetting?.value]);

  const showAddToCartButton = saleMode === 'cart' && (listConfig.showAddToCartButton ?? true);
  const showBuyNowButton = saleMode === 'cart'
    ? (listConfig.showBuyNowButton ?? true) && checkoutConfig.showBuyNow
    : true;
  const buyNowLabel = saleMode === 'contact' ? 'Liên hệ' : 'Mua ngay';

  const [quickAddTarget, setQuickAddTarget] = useState<null | {
    product: ProductCardProps['product'];
    action: 'addToCart' | 'buyNow';
  }>(null);

  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const isSearching = searchQuery.trim() !== debouncedSearchQuery.trim();
  const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
  const postsPerPage = pageSizeOverride ?? (listConfig.postsPerPage ?? 12);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchQuery]);

  const categories = useQuery(api.productCategories.listActive);
  const nonEmptyCategoryIds = useQuery(api.productCategories.listNonEmptyCategoryIds);

  const visibleCategories = useMemo(() => {
    if (!categories) {return undefined;}
    if (!listConfig.hideEmptyCategories) {return categories;}
    if (!nonEmptyCategoryIds) {return categories;}
    const nonEmptySet = new Set(nonEmptyCategoryIds);
    return categories.filter((category) => nonEmptySet.has(category._id));
  }, [categories, listConfig.hideEmptyCategories, nonEmptyCategoryIds]);

  const categoryOptions = useMemo(
    () => visibleCategories ?? categories ?? [],
    [visibleCategories, categories]
  );

  const categorySlugFromPath = useMemo(() => {
    if (routeMode !== 'unified') {return null;}
    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment || segment === 'products') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const categoryFromUrl = useMemo(() => {
    const catSlug = categorySlugFromPath ?? searchParams.get('category');
    if (!catSlug || categoryOptions.length === 0) {return null;}
    const matchedCategory = categoryOptions.find((c) => c.slug === catSlug);
    return matchedCategory?._id ?? null;
  }, [categorySlugFromPath, searchParams, categoryOptions]);

  const activeCategory = categoryFromUrl;

  const paginatedSortBy = sortBy === 'popular' ? 'popular' : (sortBy === 'oldest' ? 'oldest' : 'newest');

  const {
    results: infiniteResults,
    status: infiniteStatus,
    loadMore,
  } = usePaginatedQuery(
    api.products.listPublishedPaginated,
    {
      categoryId: activeCategory ?? undefined,
      sortBy: paginatedSortBy,
    },
    { initialNumItems: postsPerPage }
  );

  const isSearchActive = Boolean(debouncedSearchQuery?.trim());
  const isPaginationMode = listConfig.paginationType === 'pagination' || isSearchActive;

  const useCursorPagination =
    isPaginationMode &&
    !isSearchActive &&
    ['newest', 'oldest', 'popular'].includes(sortBy);

  const offset = (urlPage - 1) * postsPerPage;
  const paginatedProducts = useQuery(
    api.products.listPublishedWithOffset,
    isPaginationMode && !useCursorPagination
      ? {
          categoryId: activeCategory ?? undefined,
          limit: postsPerPage,
          offset,
          search: debouncedSearchQuery || undefined,
          sortBy,
        }
      : 'skip'
  );

  const products = useMemo(() => {
    if (isPaginationMode) {
      if (useCursorPagination) {
        return infiniteResults.slice(offset, offset + postsPerPage);
      }
      return paginatedProducts ?? [];
    }
    return infiniteResults;
  }, [infiniteResults, isPaginationMode, offset, paginatedProducts, postsPerPage, useCursorPagination]);

  const productIds = useMemo(() => products.map((product) => product._id), [products]);
  const wishlistProductIds = useQuery(
    api.wishlist.listCustomerProductIds,
    isAuthenticated && customer && productIds.length > 0 && (wishlistModule?.enabled ?? false)
      ? { customerId: customer.id as Id<'customers'>, productIds }
      : 'skip'
  );
  const wishlistIdSet = useMemo(() => new Set<Id<'products'>>(wishlistProductIds ?? []), [wishlistProductIds]);

  const totalCount = useQuery(api.products.countPublished, {
    categoryId: activeCategory ?? undefined,
    search: debouncedSearchQuery || undefined,
  });

  const categoryMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.name]));
  }, [categories]);

  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.slug]));
  }, [categories]);

  const getProductDetailHref = useCallback((product: ProductCardProps['product']) => buildDetailPath({
    categorySlug: categorySlugMap.get(product.categoryId),
    mode: routeMode,
    moduleKey: 'products',
    recordSlug: product.slug,
  }), [categorySlugMap, routeMode]);

  const requiredCount = urlPage * postsPerPage;

  useEffect(() => {
    if (isPaginationMode) {
      return;
    }
    if (inView && infiniteStatus === 'CanLoadMore') {
      loadMore(postsPerPage);
    }
  }, [inView, infiniteStatus, loadMore, postsPerPage, isPaginationMode]);

  useEffect(() => {
    if (!useCursorPagination) return;
    if (infiniteStatus !== 'CanLoadMore') return;
    if (infiniteResults.length >= requiredCount) return;
    loadMore(requiredCount - infiniteResults.length);
  }, [useCursorPagination, infiniteStatus, infiniteResults.length, requiredCount, loadMore]);

  const handleCategoryChange = useCallback((categoryId: Id<"productCategories"> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (categoryId && categoryOptions.length > 0) {
      const category = categoryOptions.find(c => c._id === categoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'products' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }
    const newUrl = params.toString()
      ? `${buildModuleListPath('products')}?${params.toString()}`
      : buildModuleListPath('products');
    router.push(newUrl, { scroll: false });
  }, [searchParams, categoryOptions, router, routeMode]);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSizeOverride(value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    const catSlug = categorySlugFromPath ?? searchParams.get('category');
    if (!catSlug || categoryOptions.length === 0) {return;}
    const hasMatch = categoryOptions.some((category) => category.slug === catSlug);
    if (hasMatch) {return;}
    if (routeMode === 'unified' && categorySlugFromPath) {
      router.replace(buildModuleListPath('products'), { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [categoryOptions, categorySlugFromPath, pathname, router, routeMode, searchParams]);


  const filterKey = `${activeCategory ?? ''}|${debouncedSearchQuery}|${sortBy}|${postsPerPage}`;
  const prevFilterKeyRef = useRef(filterKey);

  useEffect(() => {
    if (listConfig.paginationType !== 'pagination') {
      prevFilterKeyRef.current = filterKey;
      return;
    }

    const hasFilterChanged = prevFilterKeyRef.current !== filterKey;
    if (hasFilterChanged && urlPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    prevFilterKeyRef.current = filterKey;
  }, [filterKey, listConfig.paginationType, pathname, router, searchParams, urlPage]);
  const isLoadingProducts = isSearching || (isSearchActive && paginatedProducts === undefined) || (listConfig.paginationType === 'pagination' && (
    useCursorPagination
      ? infiniteStatus === 'LoadingFirstPage' || (infiniteStatus !== 'Exhausted' && infiniteResults.length < requiredCount)
      : paginatedProducts === undefined
  ));

  if (categories === undefined) {
    return <ProductsListSkeleton />;
  }

  const showPrice = enabledFields.has('price') || enabledFields.size === 0;
  const showSalePrice = enabledFields.has('salePrice');
  const showStock = enabledFields.has('stock');
  const canUseWishlist = showWishlistButton && (wishlistModule?.enabled ?? false);

  const handleWishlistToggle = async (productId: Id<'products'>) => {
    if (!isAuthenticated || !customer) {
      openLoginModal();
      return;
    }
    await toggleWishlist({ customerId: customer.id as Id<'customers'>, productId });
  };

  const openQuickAdd = (product: ProductCardProps['product'], action: 'addToCart' | 'buyNow') => {
    setQuickAddTarget({ product, action });
  };

  const closeQuickAdd = () => setQuickAddTarget(null);

  const handleQuickAddConfirm = async (variantId: Id<'productVariants'>, quantity: number) => {
    if (!quickAddTarget) {
      return;
    }

    const { product, action } = quickAddTarget;

    if (action === 'addToCart') {
      await addItem(product._id, quantity, variantId);
      notifyAddToCart();
      if (cartConfig.layoutStyle === 'drawer') {
        openDrawer();
      } else {
        router.push('/cart');
      }
    } else {
      router.push(`/checkout?productId=${product._id}&quantity=${quantity}&variantId=${variantId}`);
    }

    setQuickAddTarget(null);
  };

  const handleAddToCart = async (product: ProductCardProps['product']) => {
    if (showStock && product.stock <= 0) {
      return;
    }

    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (product.hasVariants) {
      if (enableQuickAddVariant) {
        openQuickAdd(product, 'addToCart');
        return;
      }
      router.push(getProductDetailHref(product));
      return;
    }

    await addItem(product._id, 1);
    notifyAddToCart();
    if (cartConfig.layoutStyle === 'drawer') {
      openDrawer();
    } else {
      router.push('/cart');
    }
  };

  const handleBuyNow = (product: ProductCardProps['product']) => {
    if (showStock && product.stock <= 0) {
      return;
    }

    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (product.hasVariants) {
      if (enableQuickAddVariant) {
        openQuickAdd(product, 'buyNow');
        return;
      }
      router.push(getProductDetailHref(product));
      return;
    }

    router.push(`/checkout?productId=${product._id}&quantity=1`);
  };

  const handlePrimaryAction = (product: ProductCardProps['product']) => {
    if (showStock && product.stock <= 0) {
      return;
    }

    if (saleMode === 'contact') {
      router.push('/contact');
      return;
    }

    if (saleMode === 'affiliate') {
      const affiliateLink = product.affiliateLink?.trim();
      if (affiliateLink) {
        window.open(affiliateLink, '_blank', 'noopener,noreferrer');
        return;
      }
      router.push(getProductDetailHref(product));
      return;
    }

    handleBuyNow(product);
  };

  const paginationNode = (
    <>
      {listConfig.paginationType === 'pagination' && totalCount && totalCount > postsPerPage && (
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6"
            style={{ color: tokens.metaText }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: tokens.bodyText }}>Hiển thị</span>
              <select
                value={postsPerPage}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="h-8 w-[70px] appearance-none rounded-md border px-2 text-sm font-medium shadow-sm focus:outline-none"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                }}
                aria-label="Số bài mỗi trang"
              >
                {[12, 20, 24, 48, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>bài/trang</span>
            </div>

            <div className="text-right sm:text-left">
              <span className="font-medium" style={{ color: tokens.bodyText }}>
                {totalCount ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalCount ?? 0)}
              </span>
              <span className="mx-1" style={{ color: tokens.paginationEllipsisText }}>/</span>
              <span className="font-medium" style={{ color: tokens.bodyText }}>{totalCount ?? 0}</span>
              <span className="ml-1" style={{ color: tokens.metaText }}>sản phẩm</span>
            </div>
          </div>

          <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
            <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
              <button
                onClick={() => handlePageChange(urlPage - 1)}
                disabled={urlPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={urlPage === 1
                  ? { color: tokens.paginationDisabledText, borderColor: tokens.inputBorder, backgroundColor: tokens.paginationButtonBg }
                  : { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder, backgroundColor: tokens.paginationButtonBg }
                }
                aria-label="Trang trước"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>

              {generatePaginationItems(urlPage, Math.ceil(totalCount / postsPerPage)).map((item, index) => {
                if (item === 'ellipsis') {
                  return (
                    <div
                      key={`ellipsis-${index}`}
                      className="flex h-8 w-8 items-center justify-center"
                      style={{ color: tokens.paginationEllipsisText }}
                    >
                      …
                    </div>
                  );
                }

                const pageNum = item as number;
                const isActive = pageNum === urlPage;
                const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== Math.ceil(totalCount / postsPerPage);

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 border ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                    style={isActive
                      ? {
                          backgroundColor: tokens.paginationActiveBg,
                          borderColor: tokens.paginationActiveBorder,
                          color: tokens.paginationActiveText,
                        }
                      : {
                          backgroundColor: tokens.paginationButtonBg,
                          borderColor: tokens.paginationButtonBorder,
                          color: tokens.paginationButtonText,
                        }
                    }
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(urlPage + 1)}
                disabled={totalCount ? urlPage >= Math.ceil(totalCount / postsPerPage) : true}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={totalCount && urlPage < Math.ceil(totalCount / postsPerPage)
                  ? { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder, backgroundColor: tokens.paginationButtonBg }
                  : { color: tokens.paginationDisabledText, borderColor: tokens.inputBorder, backgroundColor: tokens.paginationButtonBg }
                }
                aria-label="Trang sau"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {listConfig.paginationType === 'infiniteScroll' && infiniteStatus !== 'Exhausted' && (
        <div ref={loadMoreRef} className="text-center mt-6 py-8">
          {infiniteStatus === 'LoadingMore' ? (
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotStrong }} />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotMedium }} />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tokens.loadingDotSoft }} />
            </div>
          ) : infiniteStatus === 'CanLoadMore' ? (
            <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Cuộn để xem thêm...</p>
          ) : null}
        </div>
      )}

      {listConfig.paginationType === 'infiniteScroll' && infiniteStatus === 'Exhausted' && products.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Đã hiển thị tất cả {products.length} sản phẩm</p>
        </div>
      )}
    </>
  );

  const quickAddModal = quickAddTarget ? (
    <QuickAddVariantModal
      key={`${quickAddTarget.product._id}-${quickAddTarget.action}`}
      isOpen={Boolean(quickAddTarget)}
      product={quickAddTarget.product}
      brandColor={brandColor}
      actionLabel={quickAddTarget.action === 'buyNow' ? 'Mua ngay' : 'Thêm vào giỏ'}
      onClose={closeQuickAdd}
      onConfirm={handleQuickAddConfirm}
    />
  ) : null;

  // Render based on layout setting
  if (layout === 'catalog') {
    return (
      <>
        <CatalogLayout
          products={isLoadingProducts ? [] : products}
          categories={categoryOptions}
          categoryMap={categoryMap}
          selectedCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          tokens={tokens}
          showPrice={showPrice}
          showSalePrice={showSalePrice}
          showStock={showStock}
          saleMode={saleMode}
          totalCount={totalCount}
          paginationNode={paginationNode}
          showWishlistButton={showWishlistButton}
          showAddToCartButton={showAddToCartButton}
          showBuyNowButton={showBuyNowButton}
          buyNowLabel={buyNowLabel}
          showPromotionBadge={showPromotionBadge}
          wishlistIdSet={wishlistIdSet}
          onToggleWishlist={handleWishlistToggle}
          onAddToCart={handleAddToCart}
          onBuyNow={handlePrimaryAction}
          canUseWishlist={canUseWishlist}
          imageAspectRatioStyle={imageAspectRatioStyle}
          frame={productFrame}
          getDetailHref={getProductDetailHref}
        />
        {quickAddModal}
      </>
    );
  }

  if (layout === 'list') {
    return (
      <>
        <ListLayout
          products={isLoadingProducts ? [] : products}
          categories={categoryOptions}
          categoryMap={categoryMap}
          selectedCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          tokens={tokens}
          showPrice={showPrice}
          showSalePrice={showSalePrice}
          showStock={showStock}
          saleMode={saleMode}
          totalCount={totalCount}
          paginationNode={paginationNode}
          showWishlistButton={showWishlistButton}
          showAddToCartButton={showAddToCartButton}
          showBuyNowButton={showBuyNowButton}
          buyNowLabel={buyNowLabel}
          showPromotionBadge={showPromotionBadge}
          wishlistIdSet={wishlistIdSet}
          onToggleWishlist={handleWishlistToggle}
          onAddToCart={handleAddToCart}
          onBuyNow={handlePrimaryAction}
          canUseWishlist={canUseWishlist}
          imageAspectRatioStyle={imageAspectRatioStyle}
          frame={productFrame}
          getDetailHref={getProductDetailHref}
        />
        {quickAddModal}
      </>
    );
  }

  // Default: Grid Layout
  return (
    <>
      <div className="py-8 md:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: tokens.headingColor }}>Sản phẩm</h1>
          </div>

        <MobileProductsFilters
          categories={categoryOptions}
          selectedCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          tokens={tokens}
        />

        <div
          className="hidden lg:block rounded-xl border p-4 mb-8"
          style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) =>{  setSearchQuery(e.target.value); }}
                className="w-full h-10 pl-10 pr-4 rounded-lg border outline-none transition-colors placeholder:text-[var(--placeholder-color)]"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                  '--placeholder-color': tokens.inputPlaceholder,
                } as React.CSSProperties}
              />
              {searchQuery && (
                <button
                  onClick={() =>{  setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: tokens.inputIcon }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <select
                  value={activeCategory ?? ''}
                  onChange={(e) =>{  handleCategoryChange(e.target.value ? e.target.value as Id<"productCategories"> : null); }}
                  className="h-10 w-[220px] pl-3 pr-8 rounded-lg border text-sm outline-none appearance-none truncate"
                  style={{
                    borderColor: tokens.inputBorder,
                    backgroundColor: tokens.inputBackground,
                    color: tokens.inputText,
                  }}
                >
                  <option value="">Tất cả danh mục</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.inputIcon }} />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <select
                value={sortBy}
                onChange={(e) =>{  setSortBy(e.target.value as ProductSortOption); }}
                className="h-10 px-3 rounded-lg border text-sm outline-none"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="popular">Bán chạy</option>
                <option value="price_asc">Giá thấp → cao</option>
                <option value="price_desc">Giá cao → thấp</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: tokens.metaText }}>
            Hiển thị <span className="font-medium" style={{ color: tokens.bodyText }}>{products.length}</span>
            {totalCount !== undefined && totalCount > products.length && <> / {totalCount}</>} sản phẩm
          </p>
        </div>

        {/* Products Grid/List */}
        {isLoadingProducts ? (
          <ProductsGridSkeleton count={postsPerPage} tokens={tokens} />
        ) : products.length === 0 ? (
          <EmptyState tokens={tokens} onReset={() => { setSearchQuery(''); handleCategoryChange(null); }} />
        ) : (
          <ProductGrid
            products={products}
            categoryMap={categoryMap}
            tokens={tokens}
            showPrice={showPrice}
            showSalePrice={showSalePrice}
            showStock={showStock}
            saleMode={saleMode}
            showWishlistButton={showWishlistButton}
            showAddToCartButton={showAddToCartButton}
            showBuyNowButton={showBuyNowButton}
            buyNowLabel={buyNowLabel}
            showPromotionBadge={showPromotionBadge}
            wishlistIdSet={wishlistIdSet}
            onToggleWishlist={handleWishlistToggle}
            onAddToCart={handleAddToCart}
            onBuyNow={handlePrimaryAction}
            canUseWishlist={canUseWishlist}
            imageAspectRatioStyle={imageAspectRatioStyle}
            frame={productFrame}
            getDetailHref={getProductDetailHref}
          />
        )}

          {paginationNode}
        </div>
      </div>
      {quickAddModal}
    </>
  );
}

// ========== SHARED COMPONENTS ==========

interface ProductCardProps {
  product: {
    _id: Id<'products'>;
    name: string;
    slug: string;
    image?: string;
    affiliateLink?: string;
    price: number;
    salePrice?: number;
    stock: number;
    hasVariants?: boolean;
    categoryId: string;
    description?: string;
  };
  categoryMap: Map<string, string>;
  showPrice: boolean;
  showSalePrice: boolean;
  showStock: boolean;
}

function ProductCardActions({ product, tokens, showStock, showAddToCartButton, showBuyNowButton, buyNowLabel, onAddToCart, onBuyNow }: { product: ProductCardProps['product']; tokens: ProductsListColors; showStock: boolean; showAddToCartButton: boolean; showBuyNowButton: boolean; buyNowLabel: string; onAddToCart: (product: ProductCardProps['product']) => void; onBuyNow: (product: ProductCardProps['product']) => void }) {
  if (!showAddToCartButton && !showBuyNowButton) {
    return null;
  }

  const isOutOfStock = showStock && product.stock <= 0;
  const secondaryLabel = isOutOfStock ? 'Hết hàng' : buyNowLabel;
  const actionHeightClass = showAddToCartButton && showBuyNowButton ? 'min-h-[76px]' : 'min-h-[36px]';

  return (
    <div className={`mt-3 grid grid-cols-1 gap-2 ${actionHeightClass}`}>
      {showAddToCartButton && (
        <button
          className="w-full rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
          style={{ backgroundColor: tokens.primaryActionBg, color: tokens.primaryActionText }}
          onClick={(event) => { event.preventDefault(); onAddToCart(product); }}
          disabled={isOutOfStock}
        >
          <ShoppingCart size={14} />
          Thêm vào giỏ
        </button>
      )}
      {showBuyNowButton && (
        <button
          className="w-full rounded-lg py-2 text-sm font-medium border transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
          style={{ borderColor: tokens.secondaryActionBorder, color: tokens.secondaryActionText }}
          onClick={(event) => { event.preventDefault(); onBuyNow(product); }}
          disabled={isOutOfStock}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}

function ProductGrid({ products, categoryMap, tokens, showPrice, showSalePrice, showStock, saleMode, showWishlistButton, showAddToCartButton, showBuyNowButton, buyNowLabel, showPromotionBadge, wishlistIdSet, onToggleWishlist, onAddToCart, onBuyNow, canUseWishlist, imageAspectRatioStyle, frame, getDetailHref }: { products: ProductCardProps['product'][]; categoryMap: Map<string, string>; tokens: ProductsListColors; showPrice: boolean; showSalePrice: boolean; showStock: boolean; saleMode: ProductsSaleMode; showWishlistButton: boolean; showAddToCartButton: boolean; showBuyNowButton: boolean; buyNowLabel: string; showPromotionBadge: boolean; wishlistIdSet: Set<Id<'products'>>; onToggleWishlist: (id: Id<'products'>) => void; onAddToCart: (product: ProductCardProps['product']) => void; onBuyNow: (product: ProductCardProps['product']) => void; canUseWishlist: boolean; imageAspectRatioStyle: React.CSSProperties; frame: ProductImageFrame | null; getDetailHref: (product: ProductCardProps['product']) => string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        (() => {
          const priceDisplay = getPublicPriceLabel({ saleMode, price: product.price, salePrice: product.salePrice, isRangeFromVariant: product.hasVariants });
          return (
        <Link
          key={product._id}
          href={getDetailHref(product)}
          className="group rounded-xl overflow-hidden border transition-colors flex flex-col h-full"
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div className="overflow-hidden relative" style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }}>
            {product.image ? (
                <Image mode="thumb" src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package size={48} style={{ color: tokens.neutralTextLight }} /></div>
            )}
            <ProductImageFrameOverlay frame={frame} />
            {showPromotionBadge && showSalePrice && priceDisplay.comparePrice && !priceDisplay.isContactPrice && (
              <span
                className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded"
                style={{ backgroundColor: tokens.promotionBadgeBg, color: tokens.promotionBadgeText }}
              >
                -{Math.round((1 - product.price / priceDisplay.comparePrice) * 100)}%
              </span>
            )}
            {showWishlistButton && canUseWishlist && (
              <button
                className="absolute top-2 right-2 p-2 rounded-full border transition-colors"
                style={{ backgroundColor: tokens.wishlistButtonBg, borderColor: tokens.wishlistButtonBorder, color: wishlistIdSet.has(product._id) ? tokens.wishlistIconActive : tokens.wishlistIcon }}
                onClick={(event) => { event.preventDefault(); onToggleWishlist(product._id); }}
                aria-label="Thêm vào yêu thích"
              >
                <Heart size={16} />
              </button>
            )}
          </div>
          <div className="p-4 flex flex-1 flex-col">
            <p className="text-xs mb-1" style={{ color: tokens.metaText }}>{categoryMap.get(product.categoryId) ?? 'Sản phẩm'}</p>
            <h3 className="font-medium line-clamp-2 transition-colors mb-2" style={{ color: tokens.bodyText }}>{product.name}</h3>
            {showPrice && (
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: tokens.priceColor }}>{priceDisplay.label}</span>
                {showSalePrice && priceDisplay.comparePrice && (
                  <span className="text-sm line-through" style={{ color: tokens.priceOriginalText }}>
                    {getPublicPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                  </span>
                )}
              </div>
            )}
            <div className="min-h-[20px] mt-2">
              {showStock && product.stock <= 5 && product.stock > 0 && <p className="text-xs" style={{ color: tokens.stockLowText }}>Chỉ còn {product.stock} sản phẩm</p>}
              {showStock && product.stock === 0 && <p className="text-xs" style={{ color: tokens.stockOutText }}>Hết hàng</p>}
            </div>
            <div className="mt-auto">
              <ProductCardActions
                product={product}
                tokens={tokens}
                showStock={showStock}
                showAddToCartButton={showAddToCartButton}
                showBuyNowButton={showBuyNowButton}
                buyNowLabel={buyNowLabel}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
              />
            </div>
          </div>
        </Link>
          );
        })()
      ))}
    </div>
  );
}

function ProductList({ products, categoryMap, tokens, showPrice, showSalePrice, showStock, saleMode, showWishlistButton, showAddToCartButton, showBuyNowButton, buyNowLabel, showPromotionBadge, wishlistIdSet, onToggleWishlist, onAddToCart, onBuyNow, canUseWishlist, imageAspectRatioStyle, frame, getDetailHref }: { products: ProductCardProps['product'][]; categoryMap: Map<string, string>; tokens: ProductsListColors; showPrice: boolean; showSalePrice: boolean; showStock: boolean; saleMode: ProductsSaleMode; showWishlistButton: boolean; showAddToCartButton: boolean; showBuyNowButton: boolean; buyNowLabel: string; showPromotionBadge: boolean; wishlistIdSet: Set<Id<'products'>>; onToggleWishlist: (id: Id<'products'>) => void; onAddToCart: (product: ProductCardProps['product']) => void; onBuyNow: (product: ProductCardProps['product']) => void; canUseWishlist: boolean; imageAspectRatioStyle: React.CSSProperties; frame: ProductImageFrame | null; getDetailHref: (product: ProductCardProps['product']) => string }) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        (() => {
          const priceDisplay = getPublicPriceLabel({ saleMode, price: product.price, salePrice: product.salePrice, isRangeFromVariant: product.hasVariants });
          return (
        <Link
          key={product._id}
          href={getDetailHref(product)}
          className="group flex gap-4 rounded-xl overflow-hidden border transition-colors p-4"
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div className="w-32 md:w-40 shrink-0 overflow-hidden rounded-lg relative" style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }}>
            {product.image ? (
                <Image mode="thumb" src={product.image} alt={product.name} fill sizes="160px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package size={32} style={{ color: tokens.neutralTextLight }} /></div>
            )}
            <ProductImageFrameOverlay frame={frame} />
            {showPromotionBadge && showSalePrice && priceDisplay.comparePrice && !priceDisplay.isContactPrice && (
              <span
                className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded"
                style={{ backgroundColor: tokens.promotionBadgeBg, color: tokens.promotionBadgeText }}
              >
                -{Math.round((1 - product.price / priceDisplay.comparePrice) * 100)}%
              </span>
            )}
            {showWishlistButton && canUseWishlist && (
              <button
                className="absolute top-2 right-2 p-2 rounded-full border transition-colors"
                style={{ backgroundColor: tokens.wishlistButtonBg, borderColor: tokens.wishlistButtonBorder, color: wishlistIdSet.has(product._id) ? tokens.wishlistIconActive : tokens.wishlistIcon }}
                onClick={(event) => { event.preventDefault(); onToggleWishlist(product._id); }}
                aria-label="Thêm vào yêu thích"
              >
                <Heart size={16} />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-xs mb-1" style={{ color: tokens.metaText }}>{categoryMap.get(product.categoryId) ?? 'Sản phẩm'}</p>
            <h3 className="font-semibold text-lg transition-colors mb-2" style={{ color: tokens.bodyText }}>{product.name}</h3>
            {product.description && <p className="text-sm line-clamp-2 mb-3" style={{ color: tokens.metaText }} dangerouslySetInnerHTML={{ __html: product.description.slice(0, 150) }} />}
            <div className="flex items-center gap-4">
              {showPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold" style={{ color: tokens.priceColor }}>{priceDisplay.label}</span>
                  {showSalePrice && priceDisplay.comparePrice && (
                    <span className="text-sm line-through" style={{ color: tokens.priceOriginalText }}>
                      {getPublicPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                    </span>
                  )}
                </div>
              )}
              {showStock && product.stock <= 5 && product.stock > 0 && <span className="text-xs" style={{ color: tokens.stockLowText }}>Chỉ còn {product.stock}</span>}
              {showStock && product.stock === 0 && <span className="text-xs" style={{ color: tokens.stockOutText }}>Hết hàng</span>}
            </div>
          </div>
          {(showAddToCartButton || showBuyNowButton) && (
            <div className="hidden md:flex items-center gap-2">
              {showAddToCartButton && (
                <button
                  className="p-3 rounded-full border transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                  style={{ borderColor: tokens.secondaryActionBorder, color: tokens.secondaryActionText, backgroundColor: tokens.cardBackground }}
                  onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
                  disabled={showStock && product.stock <= 0}
                >
                  <ShoppingCart size={20} />
                </button>
              )}
              {showBuyNowButton && (
                <button
                  className="px-3 py-2 rounded-full border text-xs font-medium transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                  style={{ borderColor: tokens.secondaryActionBorder, color: tokens.secondaryActionText }}
                  onClick={(e) => { e.preventDefault(); onBuyNow(product); }}
                  disabled={showStock && product.stock <= 0}
                >
                  {showStock && product.stock <= 0 ? 'Hết hàng' : buyNowLabel}
                </button>
              )}
            </div>
          )}
        </Link>
          );
        })()
      ))}
    </div>
  );
}

function EmptyState({ tokens, onReset }: { tokens: ProductsListColors; onReset: () => void }) {
  return (
    <div className="text-center py-16">
      <div
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: tokens.emptyStateIconBg }}
      >
        <Package size={32} style={{ color: tokens.emptyStateIconColor }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: tokens.emptyStateTitle }}>Không tìm thấy sản phẩm</h3>
      <p className="mb-6" style={{ color: tokens.emptyStateText }}>Thử thay đổi từ khóa hoặc bộ lọc khác</p>
      <button
        onClick={onReset}
        className="px-6 py-2 rounded-lg font-medium transition-colors"
        style={{ backgroundColor: tokens.emptyStateButtonBg, color: tokens.emptyStateButtonText }}
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}

// ========== CATALOG LAYOUT ==========

interface LayoutProps {
  products: ProductCardProps['product'][];
  categories: { _id: Id<"productCategories">; name: string; slug: string }[];
  categoryMap: Map<string, string>;
  selectedCategory: Id<"productCategories"> | null;
  onCategoryChange: (id: Id<"productCategories"> | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: ProductSortOption;
  onSortChange: (s: ProductSortOption) => void;
  tokens: ProductsListColors;
  showPrice: boolean;
  showSalePrice: boolean;
  showStock: boolean;
  saleMode: ProductsSaleMode;
  totalCount: number | undefined;
  paginationNode?: React.ReactNode;
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  buyNowLabel: string;
  showPromotionBadge: boolean;
  wishlistIdSet: Set<Id<'products'>>;
  onToggleWishlist: (id: Id<'products'>) => void;
  onAddToCart: (product: ProductCardProps['product']) => void;
  onBuyNow: (product: ProductCardProps['product']) => void;
  canUseWishlist: boolean;
  imageAspectRatioStyle: React.CSSProperties;
  frame: ProductImageFrame | null;
  getDetailHref: (product: ProductCardProps['product']) => string;
}

interface MobileProductsFiltersProps {
  categories: { _id: Id<'productCategories'>; name: string; slug: string }[];
  selectedCategory: Id<'productCategories'> | null;
  onCategoryChange: (categoryId: Id<'productCategories'> | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: ProductSortOption;
  onSortChange: (sort: ProductSortOption) => void;
  tokens: ProductsListColors;
}

function MobileProductsFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  tokens,
}: MobileProductsFiltersProps) {
  const [open, setOpen] = useState(false);
  const hasActiveFilters = Boolean(selectedCategory || searchQuery) || sortBy !== 'newest';

  return (
    <div className="lg:hidden rounded-xl border p-3 mb-4" style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}>
      <button
        onClick={() => { setOpen(prev => !prev); }}
        className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-medium"
        style={{
          borderColor: tokens.filterButtonBorder,
          backgroundColor: tokens.filterButtonBg,
          color: tokens.filterButtonText,
        }}
        aria-expanded={open}
        aria-label="Bật tắt bộ lọc sản phẩm"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          Bộ lọc sản phẩm
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tokens.filterChipActiveBg }} />
          )}
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: tokens.filterBarBorder }}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => { onSearchChange(e.target.value); }}
              className="w-full h-10 pl-9 pr-9 rounded-lg border text-sm outline-none placeholder:text-[var(--placeholder-color)]"
              style={{
                borderColor: tokens.inputBorder,
                backgroundColor: tokens.inputBackground,
                color: tokens.inputText,
                '--placeholder-color': tokens.inputPlaceholder,
              } as React.CSSProperties}
            />
            {searchQuery && (
              <button
                onClick={() => { onSearchChange(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: tokens.inputIcon }}
                aria-label="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: tokens.metaText }}>Danh mục</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { onCategoryChange(null); }}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
                style={selectedCategory === null
                  ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText, borderColor: tokens.filterChipActiveBorder }
                  : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText, borderColor: tokens.filterChipBorder }
                }
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => { onCategoryChange(cat._id); }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
                  style={selectedCategory === cat._id
                    ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText, borderColor: tokens.filterChipActiveBorder }
                    : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText, borderColor: tokens.filterChipBorder }
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider" style={{ color: tokens.metaText }}>
              Sắp xếp
            </label>
            <select
              value={sortBy}
              onChange={(e) => { onSortChange(e.target.value as ProductSortOption); }}
              className="w-full h-10 rounded-lg border px-3 text-sm outline-none"
              style={{
                borderColor: tokens.inputBorder,
                backgroundColor: tokens.inputBackground,
                color: tokens.inputText,
              }}
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Bán chạy</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogLayout({ products, categories, selectedCategory, onCategoryChange, searchQuery, onSearchChange, sortBy, onSortChange, tokens, showPrice, showSalePrice, showStock, saleMode, totalCount, paginationNode, showWishlistButton, showAddToCartButton, showBuyNowButton, buyNowLabel, showPromotionBadge, wishlistIdSet, onToggleWishlist, onAddToCart, onBuyNow, canUseWishlist, imageAspectRatioStyle, getDetailHref }: LayoutProps) {
  return (
    <div className="py-8 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: tokens.headingColor }}>Sản phẩm</h1>
        </div>

        <MobileProductsFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          tokens={tokens}
        />

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="hidden lg:block w-64 shrink-0 space-y-4">
            <div className="rounded-xl border p-4" style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}>
              <h3 className="font-semibold mb-3" style={{ color: tokens.bodyText }}>Tìm kiếm</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) =>{  onSearchChange(e.target.value); }}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border text-sm outline-none placeholder:text-[var(--placeholder-color)]"
                  style={{
                    borderColor: tokens.inputBorder,
                    backgroundColor: tokens.inputBackground,
                    color: tokens.inputText,
                    '--placeholder-color': tokens.inputPlaceholder,
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}>
              <h3 className="font-semibold mb-3" style={{ color: tokens.bodyText }}>Danh mục</h3>
              <div className="space-y-1">
                <button
                  onClick={() =>{  onCategoryChange(null); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border"
                  style={selectedCategory === null
                    ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText, borderColor: tokens.filterChipActiveBorder }
                    : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText, borderColor: tokens.filterChipBorder }
                  }
                >
                  Tất cả sản phẩm
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() =>{  onCategoryChange(cat._id); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border"
                    style={selectedCategory === cat._id
                      ? { backgroundColor: tokens.filterChipActiveBg, color: tokens.filterChipActiveText, borderColor: tokens.filterChipActiveBorder }
                      : { backgroundColor: tokens.filterChipBg, color: tokens.filterChipText, borderColor: tokens.filterChipBorder }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}>
              <h3 className="font-semibold mb-3" style={{ color: tokens.bodyText }}>Sắp xếp</h3>
              <select
                value={sortBy}
                onChange={(e) =>{  onSortChange(e.target.value as ProductSortOption); }}
                className="w-full h-9 px-3 rounded-lg border text-sm"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="popular">Bán chạy</option>
                <option value="price_asc">Giá thấp → cao</option>
                <option value="price_desc">Giá cao → thấp</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm" style={{ color: tokens.metaText }}>
                Hiển thị <span className="font-medium" style={{ color: tokens.bodyText }}>{products.length}</span>
                {totalCount !== undefined && totalCount > products.length && <> / {totalCount}</>} sản phẩm
              </p>
            </div>

            {products.length === 0 ? (
              <EmptyState tokens={tokens} onReset={() => { onSearchChange(''); onCategoryChange(null); }} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  (() => {
                    const priceDisplay = getPublicPriceLabel({ saleMode, price: product.price, salePrice: product.salePrice, isRangeFromVariant: product.hasVariants });
                    return (
                  <Link
                    key={product._id}
                    href={getDetailHref(product)}
                    className="group rounded-xl overflow-hidden border transition-colors flex flex-col h-full"
                    style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                  >
                    <div className="overflow-hidden relative" style={{ ...imageAspectRatioStyle, backgroundColor: tokens.filterChipBg }}>
                      {product.image ? (
                        <Image mode="thumb" src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package size={32} style={{ color: tokens.neutralTextLight }} /></div>
                      )}
                      {showPromotionBadge && showSalePrice && priceDisplay.comparePrice && !priceDisplay.isContactPrice && (
                        <span
                          className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded"
                          style={{ backgroundColor: tokens.promotionBadgeBg, color: tokens.promotionBadgeText }}
                        >
                          -{Math.round((1 - product.price / priceDisplay.comparePrice) * 100)}%
                        </span>
                      )}
                      {showWishlistButton && canUseWishlist && (
                        <button
                          className="absolute top-2 right-2 p-2 rounded-full border transition-colors"
                          style={{ backgroundColor: tokens.wishlistButtonBg, borderColor: tokens.wishlistButtonBorder, color: wishlistIdSet.has(product._id) ? tokens.wishlistIconActive : tokens.wishlistIcon }}
                          onClick={(event) => { event.preventDefault(); onToggleWishlist(product._id); }}
                          aria-label="Thêm vào yêu thích"
                        >
                          <Heart size={16} />
                        </button>
                      )}
                    </div>
                    <div className="p-3 flex flex-1 flex-col">
                      <h3 className="font-medium text-sm line-clamp-2 transition-colors" style={{ color: tokens.bodyText }}>{product.name}</h3>
                      {showPrice && <span className="font-bold text-sm block mt-1" style={{ color: tokens.priceColor }}>{priceDisplay.label}</span>}
                      <div className="min-h-[20px] mt-2">
                        {showStock && product.stock <= 5 && product.stock > 0 && <span className="text-xs block" style={{ color: tokens.stockLowText }}>Chỉ còn {product.stock} sản phẩm</span>}
                        {showStock && product.stock === 0 && <span className="text-xs block" style={{ color: tokens.stockOutText }}>Hết hàng</span>}
                      </div>
                      <div className="mt-auto">
                        <ProductCardActions
                          product={product}
                          tokens={tokens}
                          showStock={showStock}
                          showAddToCartButton={showAddToCartButton}
                          showBuyNowButton={showBuyNowButton}
                          buyNowLabel={buyNowLabel}
                          onAddToCart={onAddToCart}
                          onBuyNow={onBuyNow}
                        />
                      </div>
                    </div>
                  </Link>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
        </div>

        {paginationNode}
      </div>
    </div>
  );
}

// ========== LIST LAYOUT (Full width list view) ==========

function ListLayout({ products, categories, categoryMap, selectedCategory, onCategoryChange, searchQuery, onSearchChange, sortBy, onSortChange, tokens, showPrice, showSalePrice, showStock, saleMode, totalCount, paginationNode, showWishlistButton, showAddToCartButton, showBuyNowButton, buyNowLabel, showPromotionBadge, wishlistIdSet, onToggleWishlist, onAddToCart, onBuyNow, canUseWishlist, imageAspectRatioStyle, frame, getDetailHref }: LayoutProps) {
  return (
    <div className="py-8 md:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: tokens.headingColor }}>Sản phẩm</h1>
        </div>

        <MobileProductsFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          tokens={tokens}
        />

        <div
          className="hidden md:block rounded-xl border p-4 mb-6"
          style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.filterBarBorder }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.inputIcon }} />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) =>{  onSearchChange(e.target.value); }}
                className="w-full h-10 pl-10 pr-4 rounded-lg border outline-none placeholder:text-[var(--placeholder-color)]"
                style={{
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                  '--placeholder-color': tokens.inputPlaceholder,
                } as React.CSSProperties}
              />
            </div>
            <select
              value={selectedCategory ?? ''}
              onChange={(e) =>{  onCategoryChange(e.target.value ? e.target.value as Id<"productCategories"> : null); }}
              className="h-10 px-3 rounded-lg border text-sm"
              style={{
                borderColor: tokens.inputBorder,
                backgroundColor: tokens.inputBackground,
                color: tokens.inputText,
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) =>{  onSortChange(e.target.value as ProductSortOption); }}
              className="h-10 px-3 rounded-lg border text-sm"
              style={{
                borderColor: tokens.inputBorder,
                backgroundColor: tokens.inputBackground,
                color: tokens.inputText,
              }}
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Bán chạy</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: tokens.metaText }}>
            Hiển thị <span className="font-medium" style={{ color: tokens.bodyText }}>{products.length}</span>
            {totalCount !== undefined && totalCount > products.length && <> / {totalCount}</>} sản phẩm
          </p>
        </div>

        {products.length === 0 ? (
          <EmptyState tokens={tokens} onReset={() => { onSearchChange(''); onCategoryChange(null); }} />
        ) : (
          <ProductList
            products={products}
            categoryMap={categoryMap}
            tokens={tokens}
            showPrice={showPrice}
            showSalePrice={showSalePrice}
            showStock={showStock}
            saleMode={saleMode}
            showWishlistButton={showWishlistButton}
            showAddToCartButton={showAddToCartButton}
            showBuyNowButton={showBuyNowButton}
            buyNowLabel={buyNowLabel}
            showPromotionBadge={showPromotionBadge}
            wishlistIdSet={wishlistIdSet}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            canUseWishlist={canUseWishlist}
            imageAspectRatioStyle={imageAspectRatioStyle}
            frame={frame}
            getDetailHref={getDetailHref}
          />
        )}

        {paginationNode}
      </div>
    </div>
  );
}
