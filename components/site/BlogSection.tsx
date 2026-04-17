'use client';

import React from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowRight, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import {
  getBlogColorTokens,
  getBlogValidationResult,
  type BlogBrandMode,
} from '@/app/admin/home-components/blog/_lib/colors';
import { sortBlogPosts } from '@/app/admin/home-components/blog/_lib/constants';
import type { BlogStyle } from '@/app/admin/home-components/blog/_types';

interface BlogSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: BlogBrandMode;
  title: string;
}

export function BlogSection({ config, brandColor, secondary, mode, title }: BlogSectionProps) {
  const style = (config.style as BlogStyle) || 'grid';
  const itemCount = Math.min((config.itemCount as number) || 6, 10);
  const sortBy = ((config.sortBy as 'newest' | 'popular' | 'random') || 'newest');
  const selectionMode = (config.selectionMode as 'auto' | 'manual') || 'auto';

  const selectedPostIds = React.useMemo(() => (
    Array.isArray(config.selectedPostIds)
      ? (config.selectedPostIds as string[]).filter((id): id is string => typeof id === 'string' && id.length > 0)
      : []
  ), [config.selectedPostIds]);

  const tokens = getBlogColorTokens({
    primary: brandColor,
    secondary,
    mode,
  });

  const validation = getBlogValidationResult({
    primary: brandColor,
    secondary,
    mode,
  });

  void validation;

  const querySortBy = sortBy === 'popular'
    ? 'popular'
    : 'newest';

  const allPublished = useQuery(api.posts.searchPublished, {
    limit: 50,
    sortBy: querySortBy,
  });

  const categories = useQuery(api.postCategories.listActive, { limit: 40 });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = React.useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);

  const categoryMap = React.useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.name]));
  }, [categories]);

  const categorySlugMap = React.useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.slug]));
  }, [categories]);

  const getPostDetailHref = React.useCallback((post: { slug: string; categoryId: string }) => buildDetailPath({
    categorySlug: categorySlugMap.get(post.categoryId),
    mode: routeMode,
    moduleKey: 'posts',
    recordSlug: post.slug,
  }), [categorySlugMap, routeMode]);

  const orderedPosts = React.useMemo(() => {
    if (!allPublished) {return undefined;}

    const source = sortBlogPosts(allPublished, sortBy, title);

    if (selectionMode !== 'manual' || selectedPostIds.length === 0) {
      return source.slice(0, itemCount);
    }

    const postMap = new Map(source.map((post) => [String(post._id), post]));
    const manualOrdered = selectedPostIds
      .map((postId) => postMap.get(postId))
      .filter((post): post is NonNullable<typeof post> => post !== undefined);

    return manualOrdered.slice(0, itemCount);
  }, [allPublished, selectionMode, selectedPostIds, itemCount, sortBy, title]);

  const carouselId = React.useId();

  if (orderedPosts === undefined) {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  const posts = orderedPosts;
  const showViewAll = posts.length > 0;

  const renderImagePlaceholder = (size = 24) => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: tokens.imageFallbackBg }}>
      <FileText size={size} style={{ color: tokens.imageFallbackIcon }} />
    </div>
  );

  if (posts.length === 0) {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4" style={{ color: tokens.heading }}>{title}</h2>
          <p style={{ color: tokens.mutedText }}>Chưa có bài viết nào được xuất bản.</p>
        </div>
      </section>
    );
  }

  if (style === 'grid') {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter text-left mb-8 md:mb-10" style={{ color: tokens.heading }}>{title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 xl:gap-8">
            {posts.slice(0, 6).map((post) => (
              <Link key={post._id} href={getPostDetailHref(post)} className="group">
                <article className="flex flex-col overflow-hidden rounded-xl border h-full" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {post.thumbnail ? (
                      <Image mode="thumb" src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                    ) : (
                      renderImagePlaceholder(32)
                    )}
                    <div className="absolute left-3 top-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded border" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>
                        {categoryMap.get(post.categoryId) ?? 'Tin tức'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-2 text-base md:text-lg font-bold leading-tight tracking-tight line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                    {post.excerpt && <p className="text-sm line-clamp-2 mb-2" style={{ color: tokens.mutedText }}>{post.excerpt}</p>}
                    <div className="mt-auto pt-2">
                      <time className="text-xs" style={{ color: tokens.mutedText }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          {showViewAll && (
            <div className="flex justify-center pt-8 md:pt-10">
              <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.viewAllText }}>
                Xem tất cả <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'list') {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter text-left mb-8 md:mb-10" style={{ color: tokens.heading }}>{title}</h2>
          <div className="grid gap-4">
            {posts.slice(0, 5).map((post) => (
              <Link key={post._id} href={getPostDetailHref(post)} className="group block">
                <article className="flex w-full flex-col sm:flex-row overflow-hidden rounded-lg border" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full sm:w-[220px] overflow-hidden flex-shrink-0">
                    {post.thumbnail ? (
                      <Image mode="thumb" src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="(min-width: 640px) 220px, 100vw" />
                    ) : (
                      renderImagePlaceholder(24)
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-4 sm:px-6">
                    <div className="mb-2">
                      <span className="text-xs font-semibold" style={{ color: tokens.subheading }}>{categoryMap.get(post.categoryId) ?? 'Tin tức'}</span>
                    </div>
                    <h3 className="mb-2 text-base md:text-lg font-bold leading-snug line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                    {post.excerpt && <p className="text-sm line-clamp-2 mb-2" style={{ color: tokens.mutedText }}>{post.excerpt}</p>}
                    <div className="flex items-center gap-3">
                      <time className="text-xs" style={{ color: tokens.mutedText }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          {showViewAll && (
            <div className="flex justify-center pt-8 md:pt-10">
              <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.viewAllText }}>
                Xem tất cả <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'featured') {
    const [featuredPost, ...otherPosts] = posts;

    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter" style={{ color: tokens.heading }}>{title}</h2>
            {showViewAll && (
              <Link href="/posts" className="flex items-center gap-1 text-sm font-semibold" style={{ color: tokens.viewAllText }}>
                Xem tất cả <ArrowRight size={16} />
              </Link>
            )}
          </div>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-12">
            {featuredPost && (
              <Link href={getPostDetailHref(featuredPost)} className="lg:col-span-8 group">
                <article className="relative flex h-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px] flex-col justify-end overflow-hidden rounded-xl border" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  <div className="absolute inset-0 z-0">
                    {featuredPost.thumbnail ? (
                      <Image mode="primary" src={featuredPost.thumbnail} alt={featuredPost.title} fill className="object-cover" sizes="(min-width: 1024px) 70vw, 100vw" />
                    ) : (
                      renderImagePlaceholder(40)
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                  </div>
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="mb-3 flex items-center space-x-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded border" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>
                        {categoryMap.get(featuredPost.categoryId) ?? 'Tin tức'}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight text-white">{featuredPost.title}</h3>
                    {featuredPost.excerpt && <p className="text-sm text-slate-200 line-clamp-2 mb-3">{featuredPost.excerpt}</p>}
                    <time className="text-sm font-medium text-slate-300">{featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                  </div>
                </article>
              </Link>
            )}
            <div className="flex flex-col gap-3 lg:col-span-4">
              <h3 className="font-semibold text-base mb-1 px-1" style={{ color: tokens.bodyText }}>Đáng chú ý</h3>
              {otherPosts.slice(0, 4).map((post) => (
                <Link key={post._id} href={getPostDetailHref(post)} className="group">
                  <article className="flex items-center space-x-4 rounded-lg p-2 border" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                    <div className="relative h-14 w-14 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-md border" style={{ borderColor: tokens.cardBorder }}>
                      {post.thumbnail ? (
                        <Image mode="thumb" src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="64px" />
                      ) : (
                        renderImagePlaceholder(16)
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tokens.subheading }}>{categoryMap.get(post.categoryId) ?? 'Tin tức'}</span>
                      <h4 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h4>
                      <time className="mt-1 text-[10px]" style={{ color: tokens.mutedText }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'magazine') {
    const [featured, ...rest] = posts;
    const otherPosts = rest.slice(0, 4);

    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest" style={{ color: tokens.subheading }}>
                <span className="w-6 h-[2px]" style={{ backgroundColor: tokens.sectionAccentByStyle.magazine }}></span>
                Magazine
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter" style={{ color: tokens.heading }}>{title}</h2>
            </div>
            {showViewAll && (
              <Link href="/posts" className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.viewAllText }}>
                Xem tất cả <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className="lg:hidden space-y-4">
            {featured && (
              <Link href={getPostDetailHref(featured)} className="group block">
                <article className="relative rounded-xl overflow-hidden aspect-[16/9] border" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  {featured.thumbnail ? (
                    <Image mode="primary" src={featured.thumbnail} alt={featured.title} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
                  ) : (
                    renderImagePlaceholder(36)
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="px-2 py-1 text-[10px] font-bold rounded border mb-2 inline-block" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>
                      {categoryMap.get(featured.categoryId) ?? 'Tin tức'}
                    </span>
                    <h3 className="text-lg font-bold text-white line-clamp-2">{featured.title}</h3>
                  </div>
                </article>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-3">
              {otherPosts.map((post) => (
                <Link key={post._id} href={getPostDetailHref(post)} className="group">
                  <article className="rounded-xl border overflow-hidden h-full" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {post.thumbnail ? (
                        <Image mode="thumb" src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 50vw" />
                      ) : (
                        renderImagePlaceholder(20)
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h4>
                      <time className="text-[10px] mt-1 block" style={{ color: tokens.mutedText }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            {featured && (
              <Link href={getPostDetailHref(featured)} className="lg:row-span-2 group">
                <article className="relative rounded-2xl overflow-hidden h-full min-h-[420px] border" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  {featured.thumbnail ? (
                    <Image mode="primary" src={featured.thumbnail} alt={featured.title} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
                  ) : (
                    renderImagePlaceholder(42)
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="px-2.5 py-1 text-xs font-bold rounded border mb-3 inline-block" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>
                      {categoryMap.get(featured.categoryId) ?? 'Nổi bật'}
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 mb-2">{featured.title}</h3>
                    {featured.excerpt && <p className="text-sm text-slate-200 line-clamp-2 mb-3">{featured.excerpt}</p>}
                    <time className="text-sm text-slate-300">{featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                  </div>
                </article>
              </Link>
            )}

            {otherPosts.map((post) => (
              <Link key={post._id} href={getPostDetailHref(post)} className="group">
                <article className="rounded-xl border overflow-hidden h-full flex flex-col" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0">
                    {post.thumbnail ? (
                      <Image mode="thumb" src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 50vw" />
                    ) : (
                      renderImagePlaceholder(28)
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-bold uppercase mb-1" style={{ color: tokens.subheading }}>{categoryMap.get(post.categoryId) ?? 'Tin tức'}</span>
                    <h4 className="text-base font-semibold line-clamp-2 mb-2" style={{ color: tokens.bodyText }}>{post.title}</h4>
                    <time className="text-xs mt-auto" style={{ color: tokens.mutedText }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'carousel') {
    const carouselDomId = `blog-carousel-${carouselId.replaceAll(':', '')}`;
    const cardWidth = 320;
    const gap = 20;
    const displayedPosts = posts.slice(0, 6);
    const showArrowsDesktop = displayedPosts.length > 3;
    const showArrowsMobile = displayedPosts.length > 1;

    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-8">
            <div className="flex items-end justify-between w-full md:w-auto">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter" style={{ color: tokens.heading }}>{title}</h2>
              {showArrowsMobile && (
                <div className="flex gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const container = document.querySelector(`#${carouselDomId}`);
                      if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                    }}
                    className="w-11 h-11 rounded-full border flex items-center justify-center"
                    style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}
                  >
                    <ChevronLeft size={18} style={{ color: tokens.arrowButtonIcon }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const container = document.querySelector(`#${carouselDomId}`);
                      if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                    }}
                    className="w-11 h-11 rounded-full border flex items-center justify-center"
                    style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}
                  >
                    <ChevronRight size={18} style={{ color: tokens.arrowButtonIcon }} />
                  </button>
                </div>
              )}
            </div>

            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselDomId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="w-11 h-11 rounded-full border flex items-center justify-center"
                  style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}
                >
                  <ChevronLeft size={18} style={{ color: tokens.arrowButtonIcon }} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselDomId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="w-11 h-11 rounded-full border flex items-center justify-center"
                  style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}
                >
                  <ChevronRight size={18} style={{ color: tokens.arrowButtonIcon }} />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <div
              id={carouselDomId}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-5 py-4 px-2 select-none scrollbar-hide"
              style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {displayedPosts.map((post) => (
                <Link key={post._id} href={getPostDetailHref(post)} className="snap-start flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px] group" draggable={false}>
                  <article className="rounded-xl border overflow-hidden h-full flex flex-col" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                    <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0">
                      {post.thumbnail ? (
                        <Image mode="thumb" src={post.thumbnail} alt={post.title} fill className="object-cover" draggable={false} sizes="(min-width: 1024px) 360px, (min-width: 768px) 320px, 280px" />
                      ) : (
                        renderImagePlaceholder(32)
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase" style={{ color: tokens.subheading }}>{categoryMap.get(post.categoryId) ?? 'Tin tức'}</span>
                      </div>
                      <h3 className="font-bold line-clamp-2 mb-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                      <p className="text-sm line-clamp-2 mb-3 flex-1" style={{ color: tokens.mutedText }}>{post.excerpt ?? ''}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <time className="text-xs" style={{ color: tokens.mutedText }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                        <ArrowRight size={16} style={{ color: tokens.arrowButtonIcon }} />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
              <div className="flex-shrink-0 w-4" />
            </div>

            <style>{`
              #${carouselDomId}::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b pb-4 mb-8" style={{ borderColor: tokens.cardBorder }}>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight" style={{ color: tokens.heading }}>{title}</h2>
            {showViewAll && (
              <Link href="/posts" className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.viewAllText }}>
                Xem tất cả <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className="space-y-0">
            {posts.slice(0, 5).map((post, index) => (
              <Link key={post._id} href={getPostDetailHref(post)} className="group block">
                <article className="flex items-start gap-4 py-5 border-b" style={{ borderColor: tokens.cardBorder }}>
                  <span className="text-xl md:text-2xl font-bold tabular-nums flex-shrink-0 w-8 md:w-10" style={{ color: tokens.numberText }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tokens.subheading }}>{categoryMap.get(post.categoryId) ?? 'Tin tức'}</span>
                      <span className="text-[10px]" style={{ color: tokens.mutedText }}>•</span>
                      <time className="text-[10px]" style={{ color: tokens.mutedText }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</time>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                    {post.excerpt && <p className="text-sm line-clamp-1 mt-1" style={{ color: tokens.mutedText }}>{post.excerpt}</p>}
                  </div>
                  <ArrowRight size={18} className="flex-shrink-0 mt-1" style={{ color: tokens.arrowButtonIcon }} />
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
