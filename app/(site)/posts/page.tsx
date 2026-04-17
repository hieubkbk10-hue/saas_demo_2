'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { getPostsListColors } from '@/components/site/posts/colors';
import { usePostsListConfig } from '@/lib/experiences';
import type { Id } from '@/convex/_generated/dataModel';
import { buildCategoryPath, buildDetailPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import {
  FullWidthLayout,
  MagazineLayout,
  PostsFilter,
  SidebarLayout,
  type SortOption,
} from '@/components/site/posts';

type PostsListLayout = 'fullwidth' | 'sidebar' | 'magazine';

function usePostsLayout(): PostsListLayout {
  const setting = useQuery(api.settings.getByKey, { key: 'posts_list_style' });
  const value = setting?.value as string;
  if (value === 'fullwidth' || value === 'grid' || value === 'list') {return 'fullwidth';}
  if (value === 'sidebar') {return 'sidebar';}
  if (value === 'magazine') {return 'magazine';}
  return 'fullwidth';
}

function useEnabledPostFields(): Set<string> {
  const fields = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'posts' });
  return useMemo(() => {
    if (!fields) {return new Set<string>();}
    return new Set(fields.map(f => f.fieldKey));
  }, [fields]);
}

function PostsGridSkeleton({ count = 6 }: { count?: number }) {
  const tokens = getPostsListColors('#3b82f6', undefined, 'single');

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border"
          style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
        >
          <div className="aspect-video" style={{ backgroundColor: tokens.cardBorder }} />
          <div className="p-5 space-y-3">
            <div className="h-5 w-20 rounded-full" style={{ backgroundColor: tokens.cardBorder }} />
            <div className="h-6 w-full rounded" style={{ backgroundColor: tokens.cardBorder }} />
            <div className="h-4 w-3/4 rounded" style={{ backgroundColor: tokens.cardBorder }} />
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
function PostsListSkeleton() {
  const tokens = getPostsListColors('#3b82f6', undefined, 'single');

  return (
    <div className="py-8 md:py-12 px-4 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-64 rounded mx-auto" style={{ backgroundColor: tokens.cardBorder }} />
        </div>
        <div className="rounded-xl border p-4 mb-8" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 flex-1 max-w-xs rounded-lg" style={{ backgroundColor: tokens.cardBorder }} />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 rounded-full" style={{ backgroundColor: tokens.cardBorder }} />
              ))}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border"
              style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
            >
              <div className="aspect-video" style={{ backgroundColor: tokens.cardBorder }} />
              <div className="p-5 space-y-3">
                <div className="h-5 w-20 rounded-full" style={{ backgroundColor: tokens.cardBorder }} />
                <div className="h-6 w-full rounded" style={{ backgroundColor: tokens.cardBorder }} />
                <div className="h-4 w-3/4 rounded" style={{ backgroundColor: tokens.cardBorder }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<PostsListSkeleton />}>
      <PostsContent />
    </Suspense>
  );
}

function PostsContent() {
  const brandColors = useBrandColors();
  const brandColor = brandColors.primary;
  const tokens = useMemo(
    () => getPostsListColors(brandColors.primary, brandColors.secondary, brandColors.mode || 'single'),
    [brandColors.primary, brandColors.secondary, brandColors.mode]
  );
  const layout = usePostsLayout();
  const enabledFields = useEnabledPostFields();
  const listConfig = usePostsListConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  
  // Read page from URL for pagination mode
  const urlPage = Number(searchParams.get('page')) || 1;
  
  // Filter states (client-side for search)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
  const postsPerPage = pageSizeOverride ?? (listConfig.postsPerPage ?? 12);
  
  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchQuery]);

  // Queries
  const categories = useQuery(api.postCategories.listActive, { limit: 20 });
  const nonEmptyCategoryIds = useQuery(api.postCategories.listNonEmptyCategoryIds, { limit: 20 });

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
    if (!segment || segment === 'posts') {return null;}
    return segment;
  }, [pathname, routeMode]);

  const categoryFromUrl = useMemo(() => {
    const catSlug = categorySlugFromPath ?? searchParams.get('catpost');
    if (!catSlug || categoryOptions.length === 0) {return null;}
    const matchedCategory = categoryOptions.find((c) => c.slug === catSlug);
    return matchedCategory?._id ?? null;
  }, [categorySlugFromPath, searchParams, categoryOptions]);

  const activeCategory = categoryFromUrl;
  
  // Map sortBy to the limited options supported by listPublishedPaginated
  const paginatedSortBy = sortBy === 'popular' ? 'popular' : (sortBy === 'oldest' ? 'oldest' : 'newest');
  
  // Use usePaginatedQuery for infinite scroll mode (reactive, accumulates results)
  const {
    results: infiniteResults,
    status: infiniteStatus,
    loadMore,
  } = usePaginatedQuery(
    api.posts.listPublishedPaginated,
    { 
      categoryId: activeCategory ?? undefined,
      sortBy: paginatedSortBy,
    },
    { initialNumItems: postsPerPage }
  );
  
  // Use offset-based query for pagination mode (proper server-side pagination)
  const useCursorPagination =
    listConfig.paginationType === 'pagination' &&
    !debouncedSearchQuery?.trim() &&
    sortBy !== 'title';

  const offset = (urlPage - 1) * postsPerPage;
  const paginatedPosts = useQuery(
    api.posts.listPublishedWithOffset,
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
  
  const posts = listConfig.paginationType === 'pagination'
    ? (useCursorPagination
      ? infiniteResults.slice(offset, offset + postsPerPage)
      : (paginatedPosts ?? []))
    : infiniteResults;
  
  // Loading state for pagination mode  
  const requiredCount = urlPage * postsPerPage;
  const isLoadingPosts = listConfig.paginationType === 'pagination' && (
    useCursorPagination
      ? infiniteStatus === 'LoadingFirstPage' || (infiniteStatus !== 'Exhausted' && infiniteResults.length < requiredCount)
      : paginatedPosts === undefined
  );
  
  const totalCount = useQuery(api.posts.countPublished, {
    categoryId: activeCategory ?? undefined,
  });
  const featuredPosts = useQuery(api.posts.listFeatured, { limit: 5 });
  
  // Load more when scrolling to bottom (infinite scroll mode)
  useEffect(() => {
    if (listConfig.paginationType === 'infiniteScroll' && inView && infiniteStatus === 'CanLoadMore') {
      loadMore(postsPerPage);
    }
  }, [inView, infiniteStatus, loadMore, postsPerPage, listConfig.paginationType]);

  // Ensure enough items are loaded for current page (cursor pagination mode)
  useEffect(() => {
    if (!useCursorPagination) return;
    if (infiniteStatus !== 'CanLoadMore') return;
    if (infiniteResults.length >= requiredCount) return;
    loadMore(requiredCount - infiniteResults.length);
  }, [useCursorPagination, infiniteStatus, infiniteResults.length, requiredCount, urlPage, postsPerPage, loadMore]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.ceil(totalCount / postsPerPage);
  }, [totalCount, postsPerPage]);

  // Build category map for O(1) lookup
  const categoryMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.name]));
  }, [categories]);

  const categorySlugMap = useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((c) => [c._id, c.slug]));
  }, [categories]);

  const getPostDetailHref = useCallback((post: { slug: string; categoryId: Id<'postCategories'> }) => buildDetailPath({
    categorySlug: categorySlugMap.get(post.categoryId),
    mode: routeMode,
    moduleKey: 'posts',
    recordSlug: post.slug,
  }), [categorySlugMap, routeMode]);

  // Handlers
  const handleCategoryChange = useCallback((categoryId: Id<"postCategories"> | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (categoryId && categoryOptions.length > 0) {
      const category = categoryOptions.find(c => c._id === categoryId);
      if (category) {
        if (routeMode === 'unified') {
          router.push(buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'posts' }), { scroll: false });
          return;
        }
        params.set('catpost', category.slug);
      }
    } else {
      params.delete('catpost');
    }
    
    const newUrl = params.toString()
      ? `${buildModuleListPath('posts')}?${params.toString()}`
      : buildModuleListPath('posts');
    router.push(newUrl, { scroll: false });
  }, [searchParams, categoryOptions, router, routeMode]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSizeOverride(value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, pathname, router]);

  const filterKey = `${activeCategory ?? ''}|${debouncedSearchQuery}|${sortBy}|${postsPerPage}`;
  const prevFilterKeyRef = useRef(filterKey);
  
  // Update URL when page changes (pagination mode)
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
    const catSlug = categorySlugFromPath ?? searchParams.get('catpost');
    if (!catSlug || categoryOptions.length === 0) {return;}
    const hasMatch = categoryOptions.some((category) => category.slug === catSlug);
    if (hasMatch) {return;}
    if (routeMode === 'unified' && categorySlugFromPath) {
      router.replace(buildModuleListPath('posts'), { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('catpost');
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [categoryOptions, categorySlugFromPath, pathname, router, routeMode, searchParams]);
  
  // Reset page to 1 when search/filter/page size changes
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

  // Initial loading state only (not on search/filter changes)
  const isInitialLoading = categories === undefined;

  if (isInitialLoading) {
    return <PostsListSkeleton />;
  }

  return (
    <div className="py-6 md:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: tokens.headingColor }}>
            Tin tức & Bài viết
          </h1>
        </div>

        {/* Layout based rendering */}
        {layout === 'fullwidth' && (
          <>
            {/* Filter Bar - Hide based on config */}
            {(listConfig.showSearch || listConfig.showCategories) && (
              <div className="mb-5">
                <PostsFilter
                  categories={categoryOptions}
                  selectedCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  totalResults={totalCount ?? (posts?.length ?? 0)}
                  tokens={tokens}
                  showSearch={listConfig.showSearch}
                  showCategories={listConfig.showCategories}
                />
              </div>
            )}

            {/* Posts */}
            {isLoadingPosts ? (
              <PostsGridSkeleton count={postsPerPage} />
            ) : (
              <FullWidthLayout
                posts={posts}
                brandColor={brandColor}
                tokens={tokens}
                categoryMap={categoryMap}
                enabledFields={enabledFields}
                getDetailHref={getPostDetailHref}
              />
            )}
          </>
        )}

        {layout === 'sidebar' && (
          isLoadingPosts ? (
            <PostsGridSkeleton count={postsPerPage} />
          ) : (
            <SidebarLayout
              posts={posts}
              brandColor={brandColor}
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
              getDetailHref={getPostDetailHref}
            />
          )
        )}

        {layout === 'magazine' && (
          isLoadingPosts ? (
            <PostsGridSkeleton count={postsPerPage} />
          ) : (
            <MagazineLayout
              posts={posts}
              brandColor={brandColor}
              tokens={tokens}
              categoryMap={categoryMap}
              categories={categoryOptions}
              selectedCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              featuredPosts={featuredPosts ?? []}
              enabledFields={enabledFields}
              showSearch={listConfig.showSearch}
              showCategories={listConfig.showCategories}
              getDetailHref={getPostDetailHref}
            />
          )
        )}

        {/* Pagination / Infinite Scroll */}
        {listConfig.paginationType === 'pagination' && totalPages > 1 && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 flex w-full items-center justify-between text-sm sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <span style={{ color: tokens.metaText }}>Hiển thị</span>
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
                <span className="mx-1" style={{ color: tokens.neutralTextLight }}>/</span>
                <span className="font-medium" style={{ color: tokens.bodyText }}>{totalCount ?? 0}</span>
                <span className="ml-1" style={{ color: tokens.metaText }}>bài viết</span>
              </div>
            </div>

            <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
              <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
                <button
                  onClick={() => handlePageChange(urlPage - 1)}
                  disabled={urlPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={urlPage === 1 ? undefined : { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder }}
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {generatePaginationItems(urlPage, totalPages).map((item, index) => {
                  if (item === 'ellipsis') {
                    return (
                      <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center" style={{ color: tokens.paginationEllipsisText }}>
                        …
                      </div>
                    );
                  }

                  const pageNum = item as number;
                  const isActive = pageNum === urlPage;
                  const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== totalPages;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                        isActive
                          ? 'text-white shadow-sm border font-medium'
                          : ''
                      } ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                      style={isActive ? {
                        backgroundColor: tokens.paginationActiveBg,
                        borderColor: tokens.paginationActiveBorder,
                        color: tokens.paginationActiveText,
                      } : {
                        color: tokens.paginationButtonText,
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(urlPage + 1)}
                  disabled={urlPage === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={urlPage === totalPages ? undefined : { color: tokens.paginationButtonText, borderColor: tokens.paginationButtonBorder }}
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        )}
        
        {/* Infinite scroll trigger */}
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
        
        {/* Show "All loaded" message for infinite scroll */}
        {listConfig.paginationType === 'infiniteScroll' && infiniteStatus === 'Exhausted' && posts.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Đã hiển thị tất cả {posts.length} bài viết</p>
          </div>
        )}
      </div>
    </div>
  );
}
