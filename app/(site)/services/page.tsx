'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { getServicesListColors } from '@/components/site/services/colors';
import { useServicesListConfig } from '@/lib/experiences';
import { ChevronDown } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import {
  FullWidthLayout,
  MagazineLayout,
  type ServiceSortOption,
  ServicesFilter,
  SidebarLayout,
} from '@/components/site/services';

type ServicesListLayout = 'fullwidth' | 'sidebar' | 'magazine';

function ServicesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-100">
          <div className="aspect-video bg-slate-200" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
            <div className="h-6 w-full bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
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

// Hook to get enabled service fields
function useEnabledServiceFields(): Set<string> {
  const fields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'services' });
  return useMemo(() => {
    if (!fields) {return new Set<string>();}
    return new Set(fields.map(f => f.fieldKey));
  }, [fields]);
}

function ServicesListSkeleton() {
  return (
    <div className="py-8 md:py-12 px-4 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-64 bg-slate-200 rounded mx-auto" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 flex-1 max-w-xs bg-slate-200 rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 bg-slate-200 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-100">
              <div className="aspect-video bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
                <div className="h-6 w-full bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesListSkeleton />}>
      <ServicesContent />
    </Suspense>
  );
}

function ServicesContent() {
  const { primary: brandColor, secondary, mode } = useBrandColors();
  const tokens = useMemo(
    () => getServicesListColors(brandColor, secondary, mode || 'single'),
    [brandColor, secondary, mode]
  );
  const listConfig = useServicesListConfig();
   const layout: ServicesListLayout = listConfig.layoutStyle === 'masonry'
     ? 'magazine'
     : (listConfig.layoutStyle === 'sidebar' ? 'sidebar' : 'fullwidth');
  const enabledFields = useEnabledServiceFields();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);

  const urlPage = Number(searchParams.get('page')) || 1;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ServiceSortOption>('newest');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
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
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const categories = useQuery(api.serviceCategories.listActive, { limit: 20 });
  const nonEmptyCategoryIds = useQuery(api.serviceCategories.listNonEmptyCategoryIds, { limit: 20 });

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
    if (!segment || segment === 'services') {return null;}
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
    api.services.listPublishedPaginated,
    {
      categoryId: activeCategory ?? undefined,
      sortBy: paginatedSortBy,
    },
    { initialNumItems: postsPerPage }
  );

  const useCursorPagination =
    listConfig.paginationType === 'pagination' &&
    !debouncedSearchQuery?.trim() &&
    !['title', 'price_asc', 'price_desc'].includes(sortBy);

  const offset = (urlPage - 1) * postsPerPage;
  const paginatedServices = useQuery(
    api.services.listPublishedWithOffset,
    listConfig.paginationType === 'pagination' && !useCursorPagination
      ? {
          categoryId: activeCategory ?? undefined,
          limit: postsPerPage,
          offset,
          search: debouncedSearchQuery || undefined,
          sortBy,
        }
      : 'skip'
  );

  const services = listConfig.paginationType === 'pagination'
    ? (useCursorPagination
      ? infiniteResults.slice(offset, offset + postsPerPage)
      : (paginatedServices ?? []))
    : infiniteResults;

  const totalCount = useQuery(api.services.countPublished, {
    categoryId: activeCategory ?? undefined,
  });

  const featuredServices = useQuery(api.services.listFeatured, { limit: 5 });

  const requiredCount = urlPage * postsPerPage;
  const isLoadingServices = listConfig.paginationType === 'pagination' && (
    useCursorPagination
      ? infiniteStatus === 'LoadingFirstPage' || (infiniteStatus !== 'Exhausted' && infiniteResults.length < requiredCount)
      : paginatedServices === undefined
  );

  // Build category map for O(1) lookup
  const categoryMap = useMemo(() => {
    if (!categories) return new Map<string, string>();
    return new Map(categories.map((c) => [c._id, c.name]));
  }, [categories]);

  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.slug]));
  }, [categories]);

  const getServiceDetailHref = useCallback((service: { slug: string; categoryId: Id<'serviceCategories'> }) => buildDetailPath({
    categorySlug: categorySlugMap.get(service.categoryId),
    mode: routeMode,
    moduleKey: 'services',
    recordSlug: service.slug,
  }), [categorySlugMap, routeMode]);

  useEffect(() => {
    if (listConfig.paginationType === 'infiniteScroll' && inView && infiniteStatus === 'CanLoadMore') {
      loadMore(postsPerPage);
    }
  }, [inView, infiniteStatus, loadMore, postsPerPage, listConfig.paginationType]);

  useEffect(() => {
    if (!useCursorPagination) return;
    if (infiniteStatus !== 'CanLoadMore') return;
    if (infiniteResults.length >= requiredCount) return;
    loadMore(requiredCount - infiniteResults.length);
  }, [useCursorPagination, infiniteStatus, infiniteResults.length, requiredCount, loadMore]);

  // Handlers
  const handleCategoryChange = useCallback((categoryId: Id<"serviceCategories"> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (categoryId && categoryOptions.length > 0) {
      const category = categoryOptions.find(c => c._id === categoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'services' }), { scroll: false });
          return;
        }
        params.set('category', category.slug);
      }
    } else {
      params.delete('category');
    }
    
    const newUrl = params.toString()
      ? `${buildModuleListPath('services')}?${params.toString()}`
      : buildModuleListPath('services');
    router.push(newUrl, { scroll: false });
  }, [searchParams, categoryOptions, router, routeMode]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((sort: ServiceSortOption) => {
    setSortBy(sort);
  }, []);

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
      router.replace(buildModuleListPath('services'), { scroll: false });
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

  // Loading state
  if (!categories) {
    return <ServicesListSkeleton />;
  }

  return (
    <div className="py-6 md:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: tokens.headingColor }}>
            Dịch vụ của chúng tôi
          </h1>
        </div>

        {/* Layout based rendering */}
        {layout === 'fullwidth' && (
          <>
            <div className="mb-8">
              <ServicesFilter
                categories={categoryOptions}
                selectedCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                totalResults={totalCount ?? 0}
                tokens={tokens}
              />
            </div>

            {isLoadingServices ? (
              <ServicesGridSkeleton count={postsPerPage} />
            ) : (
              <FullWidthLayout
                services={services}
                tokens={tokens}
                categoryMap={categoryMap}
                viewMode="grid"
                enabledFields={enabledFields}
                getDetailHref={getServiceDetailHref}
              />
            )}
          </>
        )}

        {layout === 'sidebar' && (
          isLoadingServices ? (
            <ServicesGridSkeleton count={postsPerPage} />
          ) : (
            <SidebarLayout
              services={services}
              tokens={tokens}
              categoryMap={categoryMap}
              categories={categoryOptions}
              selectedCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              enabledFields={enabledFields}
               showSearch={listConfig.showSearch}
               showCategories={listConfig.showCategories}
              getDetailHref={getServiceDetailHref}
            />
          )
        )}

        {layout === 'magazine' && (
          isLoadingServices ? (
            <ServicesGridSkeleton count={postsPerPage} />
          ) : (
            <MagazineLayout
              services={services}
              tokens={tokens}
              categoryMap={categoryMap}
              categories={categoryOptions}
              selectedCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              featuredServices={featuredServices ?? []}
              enabledFields={enabledFields}
              getDetailHref={getServiceDetailHref}
            />
          )
        )}

        {/* Pagination / Infinite Scroll */}
        {listConfig.paginationType === 'pagination' && totalCount && totalCount > postsPerPage && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 flex w-full items-center justify-between text-sm text-slate-500 sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Hiển thị</span>
                <select
                  value={postsPerPage}
                  onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  style={{ borderColor: tokens.paginationButtonBorder }}
                  aria-label="Số bài mỗi trang"
                >
                  {[12, 20, 24, 48, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>bài/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((urlPage - 1) * postsPerPage) + 1 : 0}–{Math.min(urlPage * postsPerPage, totalCount ?? 0)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">{totalCount ?? 0}</span>
                <span className="ml-1 text-slate-500">dịch vụ</span>
              </div>
            </div>

            <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
              <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
                <button
                  onClick={() => handlePageChange(urlPage - 1)}
                  disabled={urlPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={urlPage === 1 ? undefined : { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder }}
                  aria-label="Trang trước"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>

                {generatePaginationItems(urlPage, Math.ceil(totalCount / postsPerPage)).map((item, index) => {
                  if (item === 'ellipsis') {
                    return (
                      <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
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
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                        isActive
                          ? 'text-white shadow-sm border font-medium'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      } ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                      style={isActive ? { backgroundColor: tokens.paginationActiveBg, borderColor: tokens.paginationActiveBg, color: tokens.paginationActiveText } : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(urlPage + 1)}
                  disabled={totalCount ? urlPage >= Math.ceil(totalCount / postsPerPage) : true}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={totalCount && urlPage < Math.ceil(totalCount / postsPerPage) ? { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder } : undefined}
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
              <p className="text-sm text-slate-400">Cuộn để xem thêm...</p>
            ) : null}
          </div>
        )}

        {listConfig.paginationType === 'infiniteScroll' && infiniteStatus === 'Exhausted' && services.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm text-slate-400">Đã hiển thị tất cả {services.length} dịch vụ</p>
          </div>
        )}
      </div>
    </div>
  );
}
