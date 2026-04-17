'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { cn } from '@/app/admin/components/ui';
import type {
  HomepageCategoryHeroConfig,
  HomepageCategoryHeroCategoryItem,
  HomepageCategoryHeroMenuGroup,
  HomepageCategoryHeroSlide,
  HomepageCategoryData,
} from '@/app/admin/home-components/homepage-category-hero/_types';
import {
  DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG,
  normalizeHomepageCategoryHeroCategories,
  normalizeHomepageCategoryHeroStyle,
} from '@/app/admin/home-components/homepage-category-hero/_lib/constants';
import { getHomepageCategoryHeroColors, type HomepageCategoryHeroTokens } from '@/app/admin/home-components/homepage-category-hero/_lib/colors';
import { getHomepageCategoryHeroIcon } from '@/app/admin/home-components/homepage-category-hero/_lib/icon-options';
import { autoGenerateHomepageCategoryHeroMenu, buildCategoryAggregateMap } from '@/app/admin/home-components/homepage-category-hero/_lib/auto-generate';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';

type ResolvedCategory = {
  id: number | string;
  category: HomepageCategoryData;
  image?: string;
  imageOverride?: string;
  ctaLabel?: string;
  iconName?: string;
  groups: HomepageCategoryHeroCategoryItem['groups'];
};

type HeroProductSummary = {
  _id: Id<'products'>;
  name: string;
  slug: string;
  image?: string;
  categoryId: Id<'productCategories'>;
  sales: number;
  _creationTime: number;
};

type HeroPayload = {
  categories: Array<Doc<'productCategories'>>;
  stats: Array<{ categoryId: Id<'productCategories'>; productCount: number; totalSales: number; latestProductTime: number; representativeImage?: string; sampleImages?: string[] }>;
  productsByCategory?: Array<{ categoryId: Id<'productCategories'>; products: HeroProductSummary[] }>;
};

const getDeviceType = (width: number) => {
  if (width < 768) {return 'mobile';}
  if (width < 1024) {return 'tablet';}
  return 'desktop';
};

const splitGroupsIntoColumns = (groups: HomepageCategoryHeroMenuGroup[], columnCount = 3) => {
  const columns: HomepageCategoryHeroMenuGroup[][] = Array.from({ length: columnCount }, () => []);
  groups.forEach((group, index) => {
    columns[index % columnCount].push(group);
  });
  return columns;
};

function BannerSlider({
  slides,
  className,
  isHidden,
  tokens,
}: {
  slides: HomepageCategoryHeroSlide[];
  className?: string;
  isHidden?: boolean;
  tokens: HomepageCategoryHeroTokens;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const isPointerDown = useRef(false);
  const normalizedSlides = slides.length > 0 ? slides : [{ url: '', link: '' }];
  const totalSlides = normalizedSlides.length;

  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides]);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(containerRef.current?.offsetWidth || 1);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const goToSlide = (index: number) => {
    const next = Math.max(0, Math.min(index, totalSlides - 1));
    setCurrentSlide(next);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerIdRef.current = event.pointerId;
    pointerStartX.current = event.clientX;
    pointerStartY.current = event.clientY;
    isDragging.current = false;
    isPointerDown.current = true;
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current || pointerStartX.current === null) {return;}
    const deltaX = event.clientX - pointerStartX.current;
    const deltaY = event.clientY - (pointerStartY.current ?? event.clientY);
    if (!isDragging.current) {
      if (Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isDragging.current = true;
      } else {
        return;
      }
    }
    setDragOffset(deltaX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) {return;}
    const deltaX = event.clientX - (pointerStartX.current ?? event.clientX);
    if (isDragging.current) {
      const threshold = Math.max(40, containerWidth * 0.18);
      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0) {
          goToSlide(currentSlide + 1);
        } else {
          goToSlide(currentSlide - 1);
        }
      }
    }
    pointerStartX.current = null;
    pointerStartY.current = null;
    isPointerDown.current = false;
    setDragOffset(0);
    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
      pointerIdRef.current = null;
    }
    window.setTimeout(() => {
      isDragging.current = false;
    }, 0);
  };

  const handleLinkClick = (event: React.MouseEvent) => {
    if (isDragging.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleDragStart = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className={cn('relative w-full h-full transition-opacity duration-300', className, isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-full overflow-hidden touch-pan-y"
      >
        <div
          className={cn(
            'flex h-full w-full transition-transform duration-500 ease-out',
            isPointerDown.current || isDragging.current ? 'transition-none' : ''
          )}
          style={{
            transform: `translate3d(calc(${-(currentSlide * 100)}% + ${dragOffset}px), 0, 0)`,
          }}
        >
          {normalizedSlides.map((slide, idx) => {
            const content = slide.url ? (
              <Image
                mode="primary"
                src={slide.url}
                alt={`Banner ${idx + 1}`}
                fill
                className="object-cover"
                priority={idx === 0}
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                sizes="100vw"
                draggable={false}
                onDragStart={handleDragStart}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm"
                style={{
                  background: `linear-gradient(135deg, ${tokens.placeholder.background} 0%, ${tokens.neutral.surfaceAlt} 100%)`,
                  color: tokens.placeholder.text,
                }}
              >
                Chưa có banner hero
              </div>
            );

            return (
              <div
                key={`${slide.url}-${idx}`}
                className="relative h-full w-full shrink-0"
                style={{ backgroundColor: tokens.placeholder.background }}
              >
                {slide.url && slide.link ? (
                  <Link
                    href={slide.link}
                    className="absolute inset-0"
                    onClick={handleLinkClick}
                    onDragStart={handleDragStart}
                    draggable={false}
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            );
          })}
        </div>
      </div>
      {normalizedSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {normalizedSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn('h-1.5 rounded-full transition-all duration-300', currentSlide === idx ? 'w-6' : 'w-1.5')}
              style={{
                backgroundColor: currentSlide === idx ? tokens.primary.solid : tokens.neutral.surfaceAlt,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HomepageCategoryHeroSection({
  config,
  brandColor,
  secondary,
  mode = 'single',
  previewDevice,
  tokens,
}: {
  config: HomepageCategoryHeroConfig;
  brandColor: string;
  secondary?: string;
  mode?: 'single' | 'dual';
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
  tokens?: HomepageCategoryHeroTokens;
}) {
  const resolvedTokens = useMemo(
    () => tokens ?? getHomepageCategoryHeroColors(brandColor, secondary ?? '', mode),
    [tokens, brandColor, secondary, mode]
  );
  const resolvedConfig = useMemo(() => ({
    ...DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG,
    ...config,
    style: normalizeHomepageCategoryHeroStyle(config.style),
    heroSlides: config.heroSlides ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heroSlides,
    categories: normalizeHomepageCategoryHeroCategories(config.categories ?? DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categories),
  }), [config]);
  const convex = useConvex();
  const categoriesData = useQuery(api.productCategories.listActive);
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const needsHeroPayload = resolvedConfig.selectionMode === 'auto' || resolvedConfig.hideEmptyCategories;
  const legacyPayload = useQuery(
    api.productCategories.listActiveWithStats,
    needsHeroPayload
      ? { productLimit: resolvedConfig.autoGenerateConfig.productScanLimit }
      : 'skip'
  );
  const [heroPayload, setHeroPayload] = useState<HeroPayload | null>(null);
  const hierarchyFeature = useQuery(
    api.admin.modules.getModuleFeature,
    needsHeroPayload
      ? { moduleKey: 'products', featureKey: 'enableCategoryHierarchy' }
      : 'skip'
  );
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>(previewDevice ?? 'desktop');
  const [activeCategoryId, setActiveCategoryId] = useState<number | string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const categoryListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!needsHeroPayload) {
      setHeroPayload(null);
      return undefined;
    }
    let active = true;
    convex
      .query(api.productCategories.listActiveWithStatsForHero, {
        productLimit: resolvedConfig.autoGenerateConfig.productScanLimit,
        productPerCategoryLimit: resolvedConfig.autoGenerateConfig.maxItemsPerGroup,
      })
      .then((payload) => {
        if (active) {
          setHeroPayload(payload as HeroPayload);
        }
      })
      .catch(() => {
        if (active) {
          setHeroPayload(null);
        }
      });
    return () => {
      active = false;
    };
  }, [convex, needsHeroPayload, resolvedConfig.autoGenerateConfig.maxItemsPerGroup, resolvedConfig.autoGenerateConfig.productScanLimit]);

  useEffect(() => {
    if (previewDevice) {
      setDevice(previewDevice);
      return;
    }
    const updateDevice = () => {
      setDevice(getDeviceType(window.innerWidth));
    };
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, [previewDevice]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, HomepageCategoryData>();
    (categoriesData ?? []).forEach((category) => {
      map.set(category._id, category);
    });
    return map;
  }, [categoriesData]);

  const resolvedHeroPayload = useMemo(() => {
    if (!needsHeroPayload) {return null;}
    if (heroPayload) {return heroPayload;}
    if (legacyPayload) {
      return { ...legacyPayload, productsByCategory: [] } as HeroPayload;
    }
    return null;
  }, [heroPayload, legacyPayload, needsHeroPayload]);

  const productMap = useMemo(() => {
    const map = new Map<string, HeroProductSummary>();
    (resolvedHeroPayload?.productsByCategory ?? []).forEach((entry) => {
      (entry.products ?? []).forEach((product) => {
        map.set(product._id, product);
      });
    });
    return map;
  }, [resolvedHeroPayload?.productsByCategory]);

  const aggregateMap = useMemo(() => {
    if (!resolvedHeroPayload) {return null;}
    return buildCategoryAggregateMap({
      categories: resolvedHeroPayload.categories ?? [],
      stats: resolvedHeroPayload.stats ?? [],
    });
  }, [resolvedHeroPayload]);

  const hierarchyEnabled = hierarchyFeature?.enabled === true;

  const autoGenerated = useMemo(() => {
    if (resolvedConfig.selectionMode !== 'auto' || !resolvedHeroPayload) {return null;}
    return autoGenerateHomepageCategoryHeroMenu({
      categories: resolvedHeroPayload.categories ?? [],
      stats: resolvedHeroPayload.stats ?? [],
      productsByCategory: resolvedHeroPayload.productsByCategory ?? [],
      hierarchyEnabled,
      config: resolvedConfig.autoGenerateConfig,
      hideEmptyCategories: resolvedConfig.hideEmptyCategories,
    });
  }, [hierarchyEnabled, resolvedConfig.autoGenerateConfig, resolvedConfig.hideEmptyCategories, resolvedConfig.selectionMode, resolvedHeroPayload]);

  const resolvedCategories = useMemo<ResolvedCategory[]>(() => {
    const selectionMode = resolvedConfig.selectionMode ?? 'manual';
    const rawItems: HomepageCategoryHeroCategoryItem[] = selectionMode === 'auto'
      ? (autoGenerated?.categories ?? [])
      : (resolvedConfig.categories ?? []);

    const list = rawItems
      .map((item, index) => {
        const category = categoryMap.get(item.categoryId);
        if (!category) {return null;}
        const image = item.imageOverride ?? category.image;

        if (resolvedConfig.hideEmptyCategories && aggregateMap) {
          const aggregated = aggregateMap.get(category._id);
          if (!aggregated || aggregated.productCount <= 0) {
            return null;
          }
        }

        return {
          id: item.id ?? index,
          category,
          image,
          imageOverride: item.imageOverride,
          iconName: item.iconName,
          ctaLabel: item.ctaLabel?.trim() || undefined,
          groups: item.groups ?? [],
        } satisfies ResolvedCategory;
      })
      .filter(Boolean) as ResolvedCategory[];

    return list;
  }, [aggregateMap, autoGenerated, categoryMap, resolvedConfig.categories, resolvedConfig.hideEmptyCategories, resolvedConfig.selectionMode, routeMode]);

  const maxCategories = device === 'mobile'
    ? resolvedConfig.maxCategoriesMobile
    : device === 'tablet'
      ? resolvedConfig.maxCategoriesTablet
      : resolvedConfig.maxCategoriesDesktop;

  const visibleCategories = resolvedCategories.slice(0, maxCategories);
  const heroSlides = resolvedConfig.heroSlides ?? [];

  const isDesktop = device === 'desktop';

  useEffect(() => {
    if (visibleCategories.length === 0) {
      setActiveCategoryId(null);
      return;
    }
    setActiveCategoryId((prev) => {
      if (prev !== null && visibleCategories.some((item) => item.id === prev)) {
        return prev;
      }
      return null;
    });
  }, [visibleCategories, isDesktop]);

  useEffect(() => {
    updateScrollState();
  }, [visibleCategories, device]);

  const resolveCategoryLink = (category?: HomepageCategoryData) => {
    if (!category) {return '#';}
    const slug = category.slug ?? category._id;
    return `/products?category=${slug}`;
  };

  const resolveAllProductsLink = () => resolvedConfig.ctaUrl || '/products';
  const resolveAllProductsLabel = () => {
    const label = resolvedConfig.ctaText?.trim();
    if (!label || label === 'Xem tất cả sản phẩm') {return 'Tất cả';}
    return label;
  };

  const resolveMenuLabel = (category?: HomepageCategoryData) => category?.name || '';

  const resolveMenuItem = (item?: HomepageCategoryHeroMenuGroup['items'][number]) => {
    if (!item) {
      return { label: 'Mục', href: '#', isProduct: false };
    }
    if (item.targetType === 'product' || item.productId) {
      const product = item.productId ? productMap.get(item.productId) : undefined;
      const label = item.label ?? product?.name ?? 'Sản phẩm';
      const slug = item.slug ?? product?.slug;
      const href = slug ? buildDetailPath({
        categorySlug: product?.categoryId ? categoryMap.get(product.categoryId)?.slug : undefined,
        mode: routeMode,
        moduleKey: 'products',
        recordSlug: slug,
      }) : '#';
      return { label, href, isProduct: true, image: item.image ?? product?.image };
    }
    const category = item.categoryId ? categoryMap.get(item.categoryId) : undefined;
    const label = resolveMenuLabel(category) || 'Mục';
    const href = resolveCategoryLink(category);
    return { label, href, isProduct: false };
  };

  const normalizeMenuLabel = (value: string) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setActiveCategoryId(null);
    }, 120);
  };

  const updateScrollState = () => {
    const el = categoryListRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  const scrollCategoryList = (direction: 'up' | 'down') => {
    const el = categoryListRef.current;
    if (!el) {return;}
    const delta = direction === 'up' ? -160 : 160;
    el.scrollBy({ top: delta, behavior: 'smooth' });
  };

  const renderCategoryThumb = (item: ResolvedCategory) => {
    if (!resolvedConfig.showCategoryImage) {return null;}
    const resolvedImage = item.imageOverride ?? item.image;
    const sizeMap: Record<HomepageCategoryHeroConfig['categoryImageSize'], number> = {
      '2xs': 16,
      'xs': 20,
      'sm': 24,
      'md': 28,
      'lg': 32,
      'xl': 40,
    };
    const containerSize = sizeMap[resolvedConfig.categoryImageSize] ?? 24;
    const iconSize = Math.max(12, Math.round(containerSize * 0.65));
    const fontSize = Math.max(9, Math.round(containerSize * 0.45));
    const shapeClass = resolvedConfig.categoryImageShape === 'square'
      ? 'rounded-none'
      : resolvedConfig.categoryImageShape === 'rounded'
        ? 'rounded-xl'
        : 'rounded-full';

    if (resolvedConfig.categoryVisualMode === 'icon') {
      const Icon = getHomepageCategoryHeroIcon(item.iconName);
      if (Icon) {
        return (
          <div
            className={cn('flex items-center justify-center overflow-hidden border', shapeClass)}
            style={{
              width: containerSize,
              height: containerSize,
              borderColor: resolvedTokens.neutral.border,
              backgroundColor: resolvedTokens.neutral.surfaceAlt,
              color: resolvedTokens.placeholder.icon,
            }}
          >
            <Icon width={iconSize} height={iconSize} />
          </div>
        );
      }
      return (
        <div
          className={cn('flex items-center justify-center border border-dashed font-semibold', shapeClass)}
          style={{
            width: containerSize,
            height: containerSize,
            borderColor: resolvedTokens.neutral.border,
            backgroundColor: resolvedTokens.neutral.surfaceAlt,
            color: resolvedTokens.neutral.textMuted,
            fontSize,
          }}
        >
          {item.category.name.slice(0, 1)}
        </div>
      );
    }

    if (resolvedImage) {
      return (
        <div
          className={cn('overflow-hidden border', shapeClass)}
          style={{
            width: containerSize,
            height: containerSize,
            borderColor: resolvedTokens.neutral.border,
            backgroundColor: resolvedTokens.neutral.surfaceAlt,
          }}
        >
          <Image
            mode="primary"
            src={resolvedImage}
            alt={item.category.name}
            width={containerSize}
            height={containerSize}
            className="h-full w-full object-cover"
            sizes={`${containerSize}px`}
          />
        </div>
      );
    }
    return (
      <div
        className={cn('flex items-center justify-center border border-dashed font-semibold', shapeClass)}
        style={{
          width: containerSize,
          height: containerSize,
          borderColor: resolvedTokens.neutral.border,
          backgroundColor: resolvedTokens.neutral.surfaceAlt,
          color: resolvedTokens.neutral.textMuted,
          fontSize,
        }}
      >
        {item.category.name.slice(0, 1)}
      </div>
    );
  };

  const renderMegaMenuColumns = (groups: HomepageCategoryHeroMenuGroup[], panelTitle: string) => {
    const columns = splitGroupsIntoColumns(groups, 3);
    const normalizedPanelTitle = normalizeMenuLabel(panelTitle);
    return columns.map((column, colIdx) => (
      <div key={colIdx} className="flex flex-col gap-10">
        {column.map((group) => {
          const items = group.items ?? [];
          const firstLabel = resolveMenuItem(items[0]).label.trim();
          const groupTitle = (group.title || '').trim();
          const normalizedTitle = normalizeMenuLabel(groupTitle);
          const normalizedFirst = normalizeMenuLabel(firstLabel);
          const hideGroupTitle = (items.length === 1
            && normalizedTitle
            && normalizedTitle === normalizedFirst
            && normalizedFirst !== 'muc')
            || (normalizedTitle
              && normalizedPanelTitle
              && normalizedTitle === normalizedPanelTitle);

          return (
            <div key={group.id}>
              {!hideGroupTitle && (
                <h3
                  className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2"
                  style={{ color: resolvedTokens.sidebar.groupTitle }}
                >
                  {group.title || 'Nhóm'}
                </h3>
              )}
              {items.length > 0 && (
                <ul className={cn('flex flex-col gap-3', hideGroupTitle ? 'pt-0' : '')}>
                  {items.map((item) => {
                    const resolvedItem = resolveMenuItem(item);
                    return (
                      <li key={item.id}>
                        <Link
                          href={resolvedItem.href}
                          className="text-sm transition-colors inline-block hover:text-[var(--hero-link-hover)] active:text-[var(--hero-link-active)]"
                          style={{ color: resolvedTokens.menuLink.text }}
                        >
                          {resolvedItem.label || 'Mục'}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  const renderSidebarLayout = (variant: 'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft') => {
    const isClassic = variant === 'classic';
    const isFlush = variant === 'flush';
    const isMinimal = variant === 'minimal';
    const isSoft = variant === 'soft';

    const sectionStyle = {
      backgroundColor: resolvedTokens.neutral.surface,
      '--hero-nav-hover-bg': resolvedTokens.sidebar.inactiveHoverBg,
      '--hero-nav-hover-text': resolvedTokens.sidebar.inactiveHoverText,
      '--hero-link-hover': resolvedTokens.menuLink.hover,
      '--hero-link-active': resolvedTokens.menuLink.active,
      '--hero-soft-hover-bg': resolvedTokens.softPill.hoverBg,
      '--hero-soft-hover-text': resolvedTokens.softPill.hoverText,
    } as React.CSSProperties;

    const sectionClass = cn(
      'w-full',
      resolvedConfig.attachToHeader ? 'pt-0' : 'pt-4 md:pt-6'
    );
    const containerClass = cn(
      'relative flex flex-col lg:flex-row w-full max-w-7xl mx-auto',
      variant === 'sidebar' && 'border rounded-xl overflow-hidden lg:h-[576px]',
      isClassic && 'gap-4 lg:h-[576px]',
      isFlush && 'rounded-xl overflow-hidden border lg:h-[600px]',
      isMinimal && 'gap-8 lg:h-[600px]',
      isSoft && 'gap-6 lg:h-[576px]'
    );
    const sidebarClass = cn(
      'relative w-full shrink-0 flex flex-col z-20',
      variant === 'sidebar' && 'lg:w-72 lg:border-r py-2 lg:py-3',
      isClassic && 'lg:w-72 rounded-lg border overflow-hidden',
      isFlush && 'lg:w-72 border-r',
      isMinimal && 'lg:w-64',
      isSoft && 'lg:w-80 rounded-[1rem] border p-3'
    );
    const buttonPadding = {
      sidebar: 'px-4 py-3.5 lg:py-3',
      classic: 'px-4 py-3',
      flush: 'px-6 py-4 border-l-2',
      minimal: 'px-3 py-2.5 border-b md:border-b-0 md:border-l-2',
      soft: 'px-5 py-4',
    } satisfies Record<'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft', string>;
    const buttonActive = {
      sidebar: 'font-medium z-10 rounded-lg mx-2',
      classic: 'font-semibold rounded-lg mx-2',
      flush: 'border',
      minimal: 'border',
      soft: 'rounded-xl',
    } satisfies Record<'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft', string>;
    const buttonInactive = {
      sidebar: 'mx-2 rounded-lg transition-colors',
      classic: 'mx-2 rounded-lg transition-colors',
      flush: 'border-transparent transition-colors',
      minimal: 'border-transparent transition-colors',
      soft: 'rounded-xl transition-colors',
    } satisfies Record<'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft', string>;
    const heroClass = cn(
      'hidden lg:block flex-1 relative overflow-hidden z-10',
      variant === 'sidebar' && '',
      isClassic && 'rounded-lg',
      isFlush && '',
      isMinimal && 'border',
      isSoft && 'rounded-[1rem]'
    );
    const mobileHeroClass = cn(
      'block lg:hidden w-full relative aspect-[16/9] sm:aspect-[21/9]',
      isMinimal ? 'border' : 'border-b',
      isSoft ? 'rounded-[1rem] overflow-hidden' : ''
    );
    const megaPanelBase = {
      sidebar: 'absolute left-6 top-6 bottom-6 w-[620px] max-w-[70%] rounded-xl border p-8 transition-all duration-300 ease-out',
      classic: 'absolute top-4 bottom-4 left-4 w-[520px] max-w-[80%] rounded-lg border p-6 transition-all duration-300 ease-out',
      flush: 'absolute inset-y-0 left-0 w-full lg:w-80 border-r p-6 transition-all duration-300 ease-in-out',
      minimal: 'absolute inset-0 p-8 md:p-12 transition-all duration-200',
      soft: 'absolute inset-4 rounded-[0.75rem] p-6 border transition-all duration-200',
    } satisfies Record<'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft', string>;
    const megaPanelActive = {
      sidebar: 'opacity-100 translate-x-0 z-10',
      classic: 'opacity-100 translate-x-0 z-10',
      flush: 'translate-x-0',
      minimal: 'opacity-100',
      soft: 'opacity-100',
    } satisfies Record<'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft', string>;
    const megaPanelInactive = {
      sidebar: 'opacity-0 translate-x-4 pointer-events-none z-0',
      classic: 'opacity-0 translate-x-4 pointer-events-none z-0',
      flush: '-translate-x-full',
      minimal: 'opacity-0 pointer-events-none',
      soft: 'opacity-0 pointer-events-none',
    } satisfies Record<'sidebar' | 'classic' | 'flush' | 'minimal' | 'soft', string>;
    const mobilePanelClass = cn(
      'mx-4 px-4 py-5 border flex flex-col gap-6',
      isSoft ? 'rounded-[0.75rem]' : 'rounded-lg'
    );

    return (
      <section className={sectionClass} style={sectionStyle}>
        <div className="mx-auto max-w-8xl px-4 py-6 md:px-6 lg:px-8">
          <div
            className={containerClass}
            style={{
              backgroundColor: resolvedTokens.neutral.surface,
              borderColor: resolvedTokens.neutral.border,
            }}
            onMouseEnter={() => {
              if (isDesktop) {
                clearCloseTimeout();
              }
            }}
            onMouseLeave={() => {
              if (isDesktop) {
                scheduleClose();
              }
            }}
          >
            <div
              className={mobileHeroClass}
              style={{
                backgroundColor: resolvedTokens.neutral.surfaceMuted,
                borderColor: resolvedTokens.neutral.border,
              }}
            >
              <BannerSlider
                slides={heroSlides}
                className={isSoft ? 'absolute inset-0' : undefined}
                tokens={resolvedTokens}
              />
            </div>

            <div
              className={sidebarClass}
              style={{
                backgroundColor: resolvedTokens.neutral.surfaceMuted,
                borderColor: resolvedTokens.neutral.border,
              }}
            >
              {isClassic && (
                <div
                  className="p-4 border-b hidden lg:block"
                  style={{
                    borderColor: resolvedTokens.neutral.border,
                    backgroundColor: resolvedTokens.neutral.surfaceAlt,
                  }}
                >
                  <h2 className="text-sm font-semibold" style={{ color: resolvedTokens.neutral.text }}>
                    Danh mục sản phẩm
                  </h2>
                </div>
              )}
              <div
                ref={categoryListRef}
                onScroll={updateScrollState}
                className={cn(
                  'flex flex-1 flex-col overflow-y-auto',
                  isMinimal || isSoft || isClassic || isFlush ? 'py-2' : 'py-0',
                  isMinimal || isSoft || isClassic || isFlush ? 'lg:py-3' : '',
                  '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
                )}
              >
                {visibleCategories.length === 0 ? (
                  <div className="px-4 py-4 text-sm" style={{ color: resolvedTokens.neutral.textMuted }}>
                    Chưa có danh mục phù hợp để hiển thị.
                  </div>
                ) : (
                  visibleCategories.map((item) => {
                    const isActive = activeCategoryId === item.id;
                    const groups = (item.groups ?? []).filter((group) => (group.items ?? []).length > 0);
                    const hasMegaMenu = groups.length > 0 || Boolean(item.category);
                    const categoryLink = resolveCategoryLink(item.category);
                    const allProductsLink = resolveAllProductsLink();
                    const activeButtonStyle = isActive
                      ? {
                        borderColor: resolvedTokens.sidebar.activeBorder,
                        color: resolvedTokens.sidebar.activeText,
                        backgroundColor: resolvedTokens.sidebar.activeBg,
                      }
                      : { color: resolvedTokens.sidebar.inactiveText };
                    return (
                      <div key={item.id} className="relative flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isDesktop) {
                              setActiveCategoryId(isActive ? null : item.id);
                            }
                          }}
                          onMouseEnter={() => {
                            if (isDesktop) {
                              clearCloseTimeout();
                              setActiveCategoryId(item.id);
                            }
                          }}
                          onFocus={() => {
                            if (isDesktop) {
                              setActiveCategoryId(item.id);
                            }
                          }}
                          className={cn(
                            'relative flex items-center justify-between text-sm transition-all duration-200 outline-none',
                            buttonPadding[variant],
                            isActive ? buttonActive[variant] : buttonInactive[variant],
                            !isActive && 'hover:bg-[var(--hero-nav-hover-bg)] hover:text-[var(--hero-nav-hover-text)]'
                          )}
                          style={activeButtonStyle}
                        >
                          <div className={cn('flex items-center gap-3.5', isMinimal ? 'gap-2' : '')}>
                            {renderCategoryThumb(item)}
                            <span className={cn(isMinimal ? 'text-sm font-medium' : '')}>{resolveMenuLabel(item.category)}</span>
                          </div>
                          {hasMegaMenu && (
                            <>
                              <ChevronRight
                                className={cn('hidden lg:block w-4 h-4 transition-transform', isActive ? 'translate-x-0.5' : '')}
                                style={{ color: isActive ? resolvedTokens.menuLink.active : resolvedTokens.neutral.textSubtle }}
                              />
                              <ChevronDown
                                className={cn('lg:hidden w-4 h-4 transition-transform duration-200', isActive ? 'rotate-180' : '')}
                                style={{ color: isActive ? resolvedTokens.menuLink.active : resolvedTokens.neutral.textSubtle }}
                              />
                            </>
                          )}
                        </button>
                        {hasMegaMenu && (
                          <div
                            className={cn(
                              'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
                              isActive ? 'max-h-[1200px] opacity-100 mt-1 mb-3' : 'max-h-0 opacity-0'
                            )}
                          >
                            <div
                              className={mobilePanelClass}
                              style={{
                                backgroundColor: resolvedTokens.panel.background,
                                borderColor: resolvedTokens.panel.border,
                              }}
                            >
                              {splitGroupsIntoColumns(groups, 3).map((column, colIdx) => (
                                <div key={colIdx} className="flex flex-col gap-5">
                                  {column.map((group) => {
                                    const items = group.items ?? [];
                                    const firstLabel = resolveMenuItem(items[0]).label.trim();
                                    const groupTitle = (group.title || '').trim();
                                    const normalizedTitle = normalizeMenuLabel(groupTitle);
                                    const normalizedFirst = normalizeMenuLabel(firstLabel);
                                    const normalizedPanelTitle = normalizeMenuLabel(resolveMenuLabel(item.category));
                                    const hideGroupTitle = (items.length === 1
                                      && normalizedTitle
                                      && normalizedTitle === normalizedFirst
                                      && normalizedFirst !== 'muc')
                                      || (normalizedTitle
                                        && normalizedPanelTitle
                                        && normalizedTitle === normalizedPanelTitle);

                                    return (
                                      <div key={group.id}>
                                        {!hideGroupTitle && (
                                        <h3
                                          className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2"
                                          style={{ color: resolvedTokens.sidebar.groupTitle }}
                                        >
                                            {group.title || 'Nhóm'}
                                          </h3>
                                        )}
                                        {items.length > 0 && (
                                          <ul className={cn('flex flex-col gap-2.5', isSoft ? 'gap-3' : '')}>
                                            {items.map((link) => {
                                              const resolvedItem = resolveMenuItem(link);
                                              return (
                                                <li key={link.id}>
                                                  <Link
                                                    href={resolvedItem.href}
                                                    className={cn(
                                                    'text-sm transition-colors block py-0.5 active:text-[var(--hero-link-active)]',
                                                    isSoft
                                                      ? 'rounded-full border px-3 py-1.5 hover:bg-[var(--hero-soft-hover-bg)] hover:text-[var(--hero-soft-hover-text)]'
                                                      : 'hover:text-[var(--hero-link-hover)]'
                                                    )}
                                                  style={{
                                                    color: resolvedTokens.menuLink.text,
                                                    borderColor: isSoft ? resolvedTokens.softPill.border : undefined,
                                                    backgroundColor: isSoft ? resolvedTokens.softPill.bg : undefined,
                                                  }}
                                                  >
                                                    {resolvedItem.label || 'Mục'}
                                                  </Link>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                              <div className="flex flex-col gap-2">
                                {groups.length === 0 && (
                                  <Link
                                    href={categoryLink}
                                    className="inline-flex items-center gap-2 text-sm font-medium"
                                    style={{ color: resolvedTokens.sidebar.groupTitle }}
                                  >
                                    Mở mục này
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                )}
                                <Link
                                  href={allProductsLink}
                                  className="inline-flex items-center gap-2 text-sm"
                                  style={{ color: resolvedTokens.neutral.textMuted }}
                                >
                                  {resolveAllProductsLabel()}
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {(canScrollUp || canScrollDown) && variant === 'sidebar' && (
                <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between py-2">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => scrollCategoryList('up')}
                      disabled={!canScrollUp}
                      className={cn(
                        'pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border transition',
                        canScrollUp ? 'opacity-100 hover:bg-[var(--hero-nav-hover-bg)]' : 'opacity-0'
                      )}
                      style={{
                        backgroundColor: resolvedTokens.control.buttonBg,
                        borderColor: resolvedTokens.control.buttonBorder,
                        color: resolvedTokens.control.buttonIcon,
                      }}
                    >
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => scrollCategoryList('down')}
                      disabled={!canScrollDown}
                      className={cn(
                        'pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border transition',
                        canScrollDown ? 'opacity-100 hover:bg-[var(--hero-nav-hover-bg)]' : 'opacity-0'
                      )}
                      style={{
                        backgroundColor: resolvedTokens.control.buttonBg,
                        borderColor: resolvedTokens.control.buttonBorder,
                        color: resolvedTokens.control.buttonIcon,
                      }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className={heroClass}
              style={{
                backgroundColor: resolvedTokens.neutral.surfaceMuted,
                borderColor: resolvedTokens.neutral.border,
              }}
            >
              <BannerSlider slides={heroSlides} className="absolute inset-0" tokens={resolvedTokens} />
              {isClassic && <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.2), transparent)' }} />}
              {isMinimal && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />}

              {visibleCategories.map((item) => {
                const groups = (item.groups ?? []).filter((group) => (group.items ?? []).length > 0);
                const isActive = activeCategoryId === item.id;
                const categoryLink = resolveCategoryLink(item.category);
                const allProductsLink = resolveAllProductsLink();
                const allProductsLabel = resolveAllProductsLabel();
                return (
                  <div
                    key={`mega-${item.id}`}
                    className={cn(
                      megaPanelBase[variant],
                      isActive ? megaPanelActive[variant] : megaPanelInactive[variant]
                    )}
                    style={{
                      backgroundColor: resolvedTokens.panel.background,
                      borderColor: resolvedTokens.panel.border,
                    }}
                    onMouseEnter={() => {
                      if (isDesktop) {
                        clearCloseTimeout();
                      }
                    }}
                    onMouseLeave={() => {
                      if (isDesktop) {
                        scheduleClose();
                      }
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <Link
                        href={categoryLink}
                        className="text-base font-semibold transition-colors hover:text-[var(--hero-link-hover)]"
                        style={{ color: resolvedTokens.neutral.text }}
                      >
                        {resolveMenuLabel(item.category)}
                      </Link>
                      <div className="flex items-center gap-3">
                        {groups.length === 0 && (
                          <Link
                            href={categoryLink}
                            className="inline-flex items-center gap-2 text-sm font-medium"
                            style={{ color: resolvedTokens.menuLink.active }}
                          >
                            Mở mục này
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={allProductsLink}
                          className="inline-flex items-center gap-2 text-sm"
                          style={{ color: resolvedTokens.menuLink.text }}
                        >
                          {allProductsLabel}
                        </Link>
                      </div>
                    </div>
                    {groups.length > 0 ? (
                      <div className={cn('grid gap-10 h-full', isFlush ? 'grid-cols-1' : 'grid-cols-3')}>
                        {renderMegaMenuColumns(groups, resolveMenuLabel(item.category))}
                      </div>
                    ) : (
                      <div
                        className="rounded-lg border border-dashed px-4 py-6 text-sm"
                        style={{
                          borderColor: resolvedTokens.neutral.border,
                          backgroundColor: resolvedTokens.neutral.surface,
                          color: resolvedTokens.neutral.textMuted,
                        }}
                      >
                        Chưa có mục con.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderTopNavLayout = () => (
    <section
      className={cn('w-full', resolvedConfig.attachToHeader ? 'pt-0' : 'pt-4 md:pt-6')}
      style={{
        backgroundColor: resolvedTokens.neutral.surface,
        '--hero-topnav-hover-bg': resolvedTokens.topNav.inactiveHoverBg,
        '--hero-topnav-hover-text': resolvedTokens.topNav.inactiveHoverText,
        '--hero-topnav-link-hover': resolvedTokens.menuLink.hover,
      } as React.CSSProperties}
    >
      <div className="mx-auto max-w-8xl px-4 py-6 md:px-6 lg:px-8">
        <div
          className="relative flex flex-col gap-4"
          onMouseEnter={() => {
            if (isDesktop) {
              clearCloseTimeout();
            }
          }}
          onMouseLeave={() => {
            if (isDesktop) {
              scheduleClose();
            }
          }}
        >
          <div
            className="rounded-lg border p-2 relative z-20"
            style={{
              backgroundColor: resolvedTokens.neutral.surface,
              borderColor: resolvedTokens.neutral.border,
            }}
          >
            <div className="flex overflow-x-auto gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {visibleCategories.map((item) => {
                const isActive = activeCategoryId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => {
                      if (isDesktop) {
                        clearCloseTimeout();
                        setActiveCategoryId(item.id);
                      }
                    }}
                    onFocus={() => {
                      if (isDesktop) {
                        setActiveCategoryId(item.id);
                      }
                    }}
                    onClick={() => {
                      if (!isDesktop) {
                        setActiveCategoryId(isActive ? null : item.id);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-colors shrink-0 text-sm font-medium',
                      !isActive && 'hover:bg-[var(--hero-topnav-hover-bg)] hover:text-[var(--hero-topnav-hover-text)]'
                    )}
                    style={isActive
                      ? { backgroundColor: resolvedTokens.topNav.activeBg, color: resolvedTokens.topNav.activeText }
                      : { color: resolvedTokens.topNav.inactiveText }}
                  >
                    {renderCategoryThumb(item)}
                    <span className="whitespace-nowrap">{resolveMenuLabel(item.category)}</span>
                  </button>
                );
              })}
            </div>

            {visibleCategories.map((item) => {
              const isActive = activeCategoryId === item.id;
              const groups = (item.groups ?? []).filter((group) => (group.items ?? []).length > 0);
              const categoryLink = resolveCategoryLink(item.category);
              return (
                <div
                  key={`topnav-${item.id}`}
                  className={cn(
                    'absolute left-0 right-0 mt-2 rounded-lg border p-6 z-30 transition-all duration-200',
                    isActive ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                  )}
                  style={{
                    backgroundColor: resolvedTokens.panel.background,
                    borderColor: resolvedTokens.panel.border,
                  }}
                >
                  {groups.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {groups.flatMap((group) => group.items ?? []).slice(0, 12).map((link) => {
                        const resolvedItem = resolveMenuItem(link);
                        return (
                          <Link
                            key={link.id}
                            href={resolvedItem.href}
                            className="text-sm flex items-center gap-2 hover:text-[var(--hero-topnav-link-hover)]"
                            style={{ color: resolvedTokens.menuLink.text }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: resolvedTokens.topNav.bullet }} />
                            {resolvedItem.label || 'Mục'}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Link
                        href={categoryLink}
                        className="inline-flex items-center gap-2 text-sm font-medium"
                        style={{ color: resolvedTokens.menuLink.active }}
                      >
                        Mở mục này
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={resolveAllProductsLink()}
                        className="inline-flex items-center gap-2 text-sm"
                        style={{ color: resolvedTokens.menuLink.text }}
                      >
                        {resolveAllProductsLabel()}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="relative rounded-lg overflow-hidden h-[360px] md:h-[480px] z-10"
            style={{ backgroundColor: resolvedTokens.neutral.surfaceMuted, borderColor: resolvedTokens.neutral.border }}
          >
            <BannerSlider slides={heroSlides} className="absolute inset-0" tokens={resolvedTokens} />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );

  if (resolvedConfig.style === 'top-nav') {
    return renderTopNavLayout();
  }

  if (resolvedConfig.style === 'classic') {
    return renderSidebarLayout('classic');
  }

  if (resolvedConfig.style === 'flush') {
    return renderSidebarLayout('flush');
  }

  if (resolvedConfig.style === 'minimal') {
    return renderSidebarLayout('minimal');
  }

  if (resolvedConfig.style === 'soft') {
    return renderSidebarLayout('soft');
  }

  return renderSidebarLayout('sidebar');
}
