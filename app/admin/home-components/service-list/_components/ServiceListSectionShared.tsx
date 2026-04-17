'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Briefcase, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../../../components/ui';
import type { ServiceListColorTokens } from '../_lib/colors';
import type {
  ServiceListBrandMode,
  ServiceListPreviewItem,
  ServiceListStyle,
} from '../_types';

type ServiceListSharedContext = 'preview' | 'site';
type ServiceListPreviewDevice = 'mobile' | 'tablet' | 'desktop';

type ServiceListSharedItem = ServiceListPreviewItem & { href?: string };

interface ServiceListSectionSharedProps {
  items: ServiceListSharedItem[];
  sectionTitle: string;
  style: ServiceListStyle;
  mode: ServiceListBrandMode;
  tokens: ServiceListColorTokens;
  context: ServiceListSharedContext;
  device?: ServiceListPreviewDevice;
  showViewAll?: boolean;
  viewAllHref?: string;
  onItemClick?: (item: ServiceListSharedItem) => void;
  imagePriorityCount?: number;
}

const stripHtml = (value?: string) => {
  if (!value) {return '';}
  return value.replaceAll(/<[^>]*>/g, ' ').replaceAll(/\s+/g, ' ').trim();
};

const formatServicePrice = (price?: string | number) => {
  if (typeof price === 'number') {
    if (!Number.isFinite(price) || price <= 0) {return 'Liên hệ';}
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  }

  if (typeof price === 'string') {
    const trimmed = price.trim();
    if (!trimmed) {return 'Liên hệ';}

    const numeric = Number.parseInt(trimmed.replaceAll(/\D/g, ''), 10);
    if (Number.isFinite(numeric) && numeric > 0) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(numeric);
    }

    return trimmed;
  }

  return 'Liên hệ';
};

const ServiceBadge = ({
  tag,
  tokens,
}: {
  tag?: 'new' | 'hot';
  tokens: ServiceListColorTokens;
}) => {
  if (!tag) {return null;}

  if (tag === 'hot') {
    return (
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          backgroundColor: tokens.badgeHotBg,
          borderColor: tokens.badgeHotBg,
          color: tokens.badgeHotText,
        }}
      >
        Hot
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: tokens.badgeNewBg,
        borderColor: tokens.badgeNewBorder,
        color: tokens.badgeNewText,
      }}
    >
      New
    </span>
  );
};

const ServiceImage = ({
  context,
  src,
  alt,
  className,
  sizes,
  priority = false,
}: {
  context: ServiceListSharedContext;
  src: string;
  alt: string;
  className: string;
  sizes: string;
  priority?: boolean;
}) => (
  <Image
    src={src}
    alt={alt}
    fill
    sizes={sizes}
    className={className}
    priority={priority}
    draggable={false}
    unoptimized={context === 'preview'}
  />
);

export function ServiceListSectionShared({
  items,
  sectionTitle,
  style,
  mode,
  tokens,
  context,
  device = 'desktop',
  showViewAll = true,
  viewAllHref = '/services',
  onItemClick,
  imagePriorityCount = 0,
}: ServiceListSectionSharedProps) {
  const isPreview = context === 'preview';
  const isMobilePreview = isPreview && device === 'mobile';
  const isTabletPreview = isPreview && device === 'tablet';
  const heading = sectionTitle.trim() || 'Dịch vụ';
  const shouldShowViewAll = showViewAll && items.length >= 3;
  const carouselId = React.useId().replaceAll(':', '');
  const carouselElementId = `service-list-carousel-${carouselId}`;
  const [activeCarouselDot, setActiveCarouselDot] = React.useState(0);
  const [isCarouselDown, setIsCarouselDown] = React.useState(false);
  const [isCarouselDragging, setIsCarouselDragging] = React.useState(false);
  const [carouselStartX, setCarouselStartX] = React.useState(0);
  const [carouselScrollLeft, setCarouselScrollLeft] = React.useState(0);
  const carouselScrollRef = React.useRef<HTMLDivElement>(null);

  const handleCarouselMouseDown = (event: React.MouseEvent) => {
    if (!carouselScrollRef.current) {return;}
    setIsCarouselDown(true);
    setIsCarouselDragging(false);
    setCarouselStartX(event.pageX - carouselScrollRef.current.offsetLeft);
    setCarouselScrollLeft(carouselScrollRef.current.scrollLeft);
  };

  const handleCarouselMouseMove = (event: React.MouseEvent) => {
    if (!isCarouselDown || !carouselScrollRef.current) {return;}
    event.preventDefault();

    const x = event.pageX - carouselScrollRef.current.offsetLeft;
    const walk = (x - carouselStartX) * 1.2;
    carouselScrollRef.current.scrollLeft = carouselScrollLeft - walk;

    if (Math.abs(x - carouselStartX) > 5) {
      setIsCarouselDragging(true);
    }
  };

  const handleCarouselMouseUp = () => {
    setIsCarouselDown(false);
    window.setTimeout(() => {
      setIsCarouselDragging(false);
    }, 50);
  };

  const handleCarouselMouseLeave = () => {
    setIsCarouselDown(false);
    setIsCarouselDragging(false);
  };

  const baseSectionPadding = isPreview
    ? cn('py-7 md:py-8', isMobilePreview ? 'px-3' : 'px-4 md:px-6')
    : 'py-12 md:py-16 px-4 md:px-6';

  const viewAllAction = shouldShowViewAll
    ? (
      context === 'site'
        ? (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: tokens.ctaGhostText }}
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        )
        : (
          <span
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: tokens.ctaGhostText }}
          >
            Xem tất cả <ArrowRight size={16} />
          </span>
        )
    )
    : null;

  const wrapItem = ({
    item,
    className,
    children,
  }: {
    item: ServiceListSharedItem;
    className: string;
    children: React.ReactNode;
  }) => {
    const key = String(item.id);

    if (context === 'site') {
      return (
        <Link
          key={key}
          href={item.href ?? viewAllHref}
          className={cn(className, 'no-underline text-inherit')}
          onClick={(event) => {
            if (isCarouselDragging) {
              event.preventDefault();
              return;
            }
            onItemClick?.(item);
          }}
        >
          {children}
        </Link>
      );
    }

    return (
      <div
        key={key}
        className={className}
        onClick={() => { onItemClick?.(item); }}
      >
        {children}
      </div>
    );
  };

  const renderFallback = (size: number) => (
    <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: tokens.imageFallbackBg }}>
      <Briefcase size={size} style={{ color: tokens.imageFallbackIcon }} />
    </div>
  );

  const renderHeader = ({
    maxWidthClass = 'max-w-7xl',
    marginClass = 'mb-6',
  }: {
    maxWidthClass?: string;
    marginClass?: string;
  }) => (
    <div className={cn(maxWidthClass, 'mx-auto', marginClass)}>
      <div className="flex flex-row items-center justify-between gap-3 border-b pb-3" style={{ borderColor: tokens.neutralBorder }}>
        <h2
          className={cn(
            'tracking-tight font-semibold',
            isPreview
              ? (isMobilePreview ? 'text-xl' : 'text-2xl')
              : 'text-2xl md:text-3xl',
          )}
          style={{ color: tokens.heading }}
        >
          {heading}
        </h2>
        {viewAllAction}
      </div>
    </div>
  );

  const renderCardContent = (item: ServiceListSharedItem) => {
    const description = stripHtml(item.description);
    return (
      <>
        <h3 className="font-semibold leading-tight line-clamp-2" style={{ color: tokens.titleText }}>
          {item.name}
        </h3>
        {description ? (
          <p className="mt-1 text-sm line-clamp-2" style={{ color: tokens.descriptionText }}>
            {description}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: tokens.priceText }}>
            {formatServicePrice(item.price)}
          </span>
          <ArrowUpRight size={16} style={{ color: tokens.inlineMetaText }} />
        </div>
      </>
    );
  };

  const renderGrid = () => {
    const gridItems = items.slice(0, isPreview ? (isMobilePreview ? 3 : 6) : 6);

    return (
      <section className={baseSectionPadding} data-mode={mode}>
        {renderHeader({})}

        <div
          className={cn(
            'max-w-7xl mx-auto grid gap-4 md:gap-6',
            isPreview
              ? (isMobilePreview ? 'grid-cols-1' : (isTabletPreview ? 'grid-cols-2' : 'grid-cols-3'))
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {gridItems.map((item, index) => wrapItem({
            item,
            className: 'group block',
            children: (
              <article
                className="relative h-full rounded-xl border p-3 md:p-4"
                style={{
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                }}
              >
                <div className="relative mb-3 overflow-hidden rounded-lg aspect-[4/3]">
                  {item.image ? (
                    <ServiceImage
                      context={context}
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={!isPreview && index < imagePriorityCount}
                    />
                  ) : renderFallback(32)}

                  {item.tag ? (
                    <div className="absolute left-2 top-2 z-10">
                      <ServiceBadge tag={item.tag} tokens={tokens} />
                    </div>
                  ) : null}
                </div>

                {renderCardContent(item)}
              </article>
            ),
          }))}
        </div>
      </section>
    );
  };

  const renderBento = () => {
    const bentoItems = items.slice(0, 4);
    const remainingCount = Math.max(0, items.length - 4);

    if (isPreview && isMobilePreview) {
      return (
        <section className={baseSectionPadding} data-mode={mode}>
          {renderHeader({})}
          <div className="max-w-7xl mx-auto grid grid-cols-2 gap-3">
            {bentoItems.map((item, index) => wrapItem({
              item,
              className: 'group block',
              children: (
                <article
                  className="relative rounded-xl border p-2.5"
                  style={{
                    backgroundColor: tokens.cardBackground,
                    borderColor: tokens.cardBorder,
                  }}
                >
                  <div className="relative mb-2 overflow-hidden rounded-lg aspect-square">
                    {item.image ? (
                      <ServiceImage
                        context={context}
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        sizes="(max-width: 768px) 50vw, 160px"
                        priority={!isPreview && index < imagePriorityCount}
                      />
                    ) : renderFallback(24)}

                    {item.tag ? (
                      <div className="absolute left-2 top-2 z-10">
                        <ServiceBadge tag={item.tag} tokens={tokens} />
                      </div>
                    ) : null}
                  </div>

                  <h3 className="text-sm font-semibold line-clamp-2" style={{ color: tokens.titleText }}>
                    {item.name}
                  </h3>
                  <span className="mt-1 block text-xs font-semibold" style={{ color: tokens.priceText }}>
                    {formatServicePrice(item.price)}
                  </span>
                </article>
              ),
            }))}
          </div>
        </section>
      );
    }

    return (
      <section className={baseSectionPadding} data-mode={mode}>
        {renderHeader({})}

        <div
          className={cn(
            'max-w-7xl mx-auto grid gap-4',
            isPreview
              ? (isTabletPreview ? 'grid-cols-3 auto-rows-[220px]' : 'grid-cols-4 auto-rows-[250px]')
              : 'grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[250px]',
          )}
        >
          {bentoItems.map((item, index) => {
            const isFeatured = index === 0;
            const shouldPrioritize = !isPreview && index < imagePriorityCount;
            const isLast = index === 3;

            return wrapItem({
              item,
              className: cn(
                'group block',
                isFeatured && 'col-span-2 row-span-2',
                isLast && 'col-span-2',
              ),
              children: (
                <article
                  className="relative h-full rounded-xl border p-3 md:p-4"
                  style={{
                    backgroundColor: tokens.cardBackground,
                    borderColor: tokens.cardBorder,
                  }}
                >
                  <div className={cn('relative mb-3 overflow-hidden rounded-lg', isFeatured ? 'h-[65%] md:h-[70%]' : 'h-[58%]')}>
                    {item.image ? (
                      <ServiceImage
                        context={context}
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        priority={shouldPrioritize}
                      />
                    ) : renderFallback(isFeatured ? 40 : 28)}

                    {item.tag ? (
                      <div className="absolute left-2 top-2 z-10">
                        <ServiceBadge tag={item.tag} tokens={tokens} />
                      </div>
                    ) : null}

                    {isLast && remainingCount > 0 ? (
                      <span
                        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: tokens.badgeNewBg,
                          borderColor: tokens.badgeNewBorder,
                          color: tokens.badgeNewText,
                        }}
                      >
                        <Plus size={12} />
                        {remainingCount}
                      </span>
                    ) : null}
                  </div>

                  <h3 className={cn('font-semibold line-clamp-2', isFeatured ? 'text-base md:text-lg' : 'text-sm md:text-base')} style={{ color: tokens.titleText }}>
                    {item.name}
                  </h3>

                  {isFeatured && item.description ? (
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: tokens.descriptionText }}>
                      {stripHtml(item.description)}
                    </p>
                  ) : null}

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: tokens.priceText }}>
                      {formatServicePrice(item.price)}
                    </span>
                    <ArrowUpRight size={16} style={{ color: tokens.inlineMetaText }} />
                  </div>
                </article>
              ),
            });
          })}
        </div>
      </section>
    );
  };

  const renderList = () => {
    const listItems = items.slice(0, isPreview && isMobilePreview ? 4 : 6);

    return (
      <section className={baseSectionPadding} data-mode={mode}>
        {renderHeader({ maxWidthClass: 'max-w-4xl' })}

        <div className="max-w-4xl mx-auto space-y-2">
          {listItems.map((item, index) => wrapItem({
            item,
            className: 'group block',
            children: (
              <article
                className="rounded-xl border p-3 md:p-4"
                style={{
                  backgroundColor: tokens.cardBackground,
                  borderColor: tokens.cardBorder,
                }}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-lg flex-shrink-0">
                    {item.image ? (
                      <ServiceImage
                        context={context}
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        sizes="96px"
                        priority={!isPreview && index < imagePriorityCount}
                      />
                    ) : renderFallback(24)}

                    {item.tag ? (
                      <div className="absolute left-1.5 top-1.5 z-10">
                        <ServiceBadge tag={item.tag} tokens={tokens} />
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-base line-clamp-2" style={{ color: tokens.titleText }}>
                      {item.name}
                    </h3>

                    {item.description ? (
                      <p className="mt-1 text-xs md:text-sm line-clamp-2" style={{ color: tokens.descriptionText }}>
                        {stripHtml(item.description)}
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold" style={{ color: tokens.priceText }}>
                        {formatServicePrice(item.price)}
                      </span>
                      <ArrowUpRight size={16} style={{ color: tokens.inlineMetaText }} />
                    </div>
                  </div>
                </div>
              </article>
            ),
          }))}
        </div>
      </section>
    );
  };

  const renderCarousel = () => {
    const displayedItems = items.slice(0, 8);
    const cardWidth = isPreview
      ? (isMobilePreview ? 0.76 * 375 : (isTabletPreview ? 260 : 290))
      : 300;
    const gap = isPreview ? (isMobilePreview ? 12 : 16) : 16;
    const pageWidth = Math.max(cardWidth + gap, 1);
    const dotCount = Math.max(1, Math.min(3, displayedItems.length));

    const scrollToDot = (dotIndex: number) => {
      const container = document.getElementById(carouselElementId);
      if (!container) {return;}

      const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
      const targetRaw = dotIndex * pageWidth;
      const target = Math.min(targetRaw, maxScrollLeft);

      container.scrollTo({ left: target, behavior: 'smooth' });
      setActiveCarouselDot(dotIndex);
    };

    return (
      <section className={baseSectionPadding} data-mode={mode}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center justify-between gap-3">
              <h2
                className={cn(
                  'tracking-tight font-semibold',
                  isPreview
                    ? (isMobilePreview ? 'text-xl' : 'text-2xl')
                    : 'text-2xl md:text-3xl',
                )}
                style={{ color: tokens.heading }}
              >
                {heading}
              </h2>
              {isPreview && shouldShowViewAll ? viewAllAction : null}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {!isPreview ? viewAllAction : null}

              {displayedItems.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="h-11 w-11 rounded-full border inline-flex items-center justify-center"
                    style={{
                      backgroundColor: tokens.navButtonBg,
                      borderColor: tokens.navButtonBorder,
                      color: tokens.navButtonText,
                    }}
                    onClick={() => {
                      const next = Math.max(activeCarouselDot - 1, 0);
                      scrollToDot(next);
                    }}
                    aria-label="Cuộn trái"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    className="h-11 w-11 rounded-full border inline-flex items-center justify-center"
                    style={{
                      backgroundColor: tokens.navButtonBg,
                      borderColor: tokens.navButtonBorder,
                      color: tokens.navButtonText,
                    }}
                    onClick={() => {
                      const next = Math.min(activeCarouselDot + 1, dotCount - 1);
                      scrollToDot(next);
                    }}
                    aria-label="Cuộn phải"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              id={carouselElementId}
              ref={carouselScrollRef}
              className={cn(
                'flex snap-x snap-mandatory gap-3 md:gap-4 overflow-x-auto pb-2',
                context === 'site' ? 'select-none' : '',
                context === 'site' && isCarouselDown ? 'cursor-grabbing' : (context === 'site' ? 'cursor-grab' : ''),
              )}
              style={{
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                scrollBehavior: 'auto',
              }}
              onMouseDown={(event) => {
                if (context === 'site') {
                  handleCarouselMouseDown(event);
                }
              }}
              onMouseMove={(event) => {
                if (context === 'site') {
                  handleCarouselMouseMove(event);
                }
              }}
              onMouseUp={() => {
                if (context === 'site') {
                  handleCarouselMouseUp();
                }
              }}
              onMouseLeave={() => {
                if (context === 'site') {
                  handleCarouselMouseLeave();
                }
              }}
              onScroll={(event) => {
                const container = event.currentTarget;
                const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
                const current = Math.min(container.scrollLeft, maxScrollLeft);
                const nextDot = Math.max(0, Math.min(dotCount - 1, Math.round(current / pageWidth)));
                if (nextDot !== activeCarouselDot) {
                  setActiveCarouselDot(nextDot);
                }
              }}
            >
              {displayedItems.map((item, index) => wrapItem({
                item,
                className: cn(
                  'group snap-start flex-shrink-0 block',
                  isPreview
                    ? (isMobilePreview ? 'w-[76vw]' : (isTabletPreview ? 'w-[260px]' : 'w-[290px]'))
                    : 'w-[76vw] sm:w-[280px] lg:w-[300px]',
                ),
                children: (
                  <article
                    className="h-full rounded-xl border p-3"
                    style={{
                      backgroundColor: tokens.cardBackground,
                      borderColor: tokens.cardBorder,
                    }}
                  >
                    <div className="relative mb-3 overflow-hidden rounded-lg aspect-[4/3]">
                      {item.image ? (
                        <ServiceImage
                          context={context}
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          sizes="(max-width: 768px) 100vw, 300px"
                          priority={!isPreview && index < imagePriorityCount}
                        />
                      ) : renderFallback(28)}

                      {item.tag ? (
                        <div className="absolute left-2 top-2 z-10">
                          <ServiceBadge tag={item.tag} tokens={tokens} />
                        </div>
                      ) : null}
                    </div>

                    {renderCardContent(item)}
                  </article>
                ),
              }))}
            </div>
          </div>

          {displayedItems.length > 1 ? (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: dotCount }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Đi tới trang ${index + 1}`}
                  onClick={() => { scrollToDot(index); }}
                  className={cn('h-2 rounded-full transition-all', index === activeCarouselDot ? 'w-6' : 'w-2')}
                  style={{ backgroundColor: index === activeCarouselDot ? tokens.dotActive : tokens.dotInactive }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  };

  const renderMinimal = () => {
    const minimalItems = items.slice(0, isPreview ? (isMobilePreview ? 3 : 6) : 6);

    return (
      <section className={baseSectionPadding} data-mode={mode}>
        {renderHeader({})}

        <div
          className={cn(
            'max-w-7xl mx-auto grid gap-5 md:gap-6',
            isPreview
              ? (isMobilePreview ? 'grid-cols-1' : (isTabletPreview ? 'grid-cols-2' : 'grid-cols-3'))
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {minimalItems.map((item, index) => wrapItem({
            item,
            className: 'group block',
            children: (
              <article>
                <div
                  className="relative mb-4 overflow-hidden rounded-2xl border aspect-[3/2]"
                  style={{
                    borderColor: tokens.cardBorder,
                    backgroundColor: tokens.imageFallbackBg,
                  }}
                >
                  {item.image ? (
                    <ServiceImage
                      context={context}
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={!isPreview && index < imagePriorityCount}
                    />
                  ) : renderFallback(36)}

                  {item.tag ? (
                    <div className="absolute left-3 top-3 z-10">
                      <ServiceBadge tag={item.tag} tokens={tokens} />
                    </div>
                  ) : null}
                </div>

                <h3 className="text-base md:text-lg font-semibold line-clamp-2" style={{ color: tokens.titleText }}>
                  {item.name}
                </h3>

                {item.description ? (
                  <p className="mt-1 text-sm line-clamp-2" style={{ color: tokens.descriptionText }}>
                    {stripHtml(item.description)}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: tokens.priceText }}>
                    {formatServicePrice(item.price)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: tokens.inlineMetaText }}>
                    Chi tiết <ArrowUpRight size={15} />
                  </span>
                </div>
              </article>
            ),
          }))}
        </div>
      </section>
    );
  };

  const renderShowcase = () => {
    const featuredItem = items[0];
    const otherItems = items.slice(1, 5);

    if (isPreview && isMobilePreview) {
      return (
        <section className={baseSectionPadding} data-mode={mode}>
          {renderHeader({})}

          <div className="max-w-7xl mx-auto space-y-4">
            {featuredItem ? wrapItem({
              item: featuredItem,
              className: 'group block',
              children: (
                <article className="relative overflow-hidden rounded-2xl border aspect-[4/3]" style={{ borderColor: tokens.cardBorder }}>
                  {featuredItem.image ? (
                    <ServiceImage
                      context={context}
                      src={featuredItem.image}
                      alt={featuredItem.name}
                      className="h-full w-full object-cover"
                      sizes="100vw"
                      priority={!isPreview && imagePriorityCount > 0}
                    />
                  ) : renderFallback(44)}

                  <div className="absolute inset-0" style={{ backgroundImage: tokens.featuredOverlayScrim }} />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {featuredItem.tag ? (
                      <div className="mb-2"><ServiceBadge tag={featuredItem.tag} tokens={tokens} /></div>
                    ) : null}

                    <h3 className="text-lg font-semibold text-white line-clamp-2">{featuredItem.name}</h3>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{formatServicePrice(featuredItem.price)}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: tokens.featuredOverlaySubtle }}>
                        Xem chi tiết <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              ),
            }) : null}

            <div className="grid grid-cols-2 gap-3">
              {otherItems.map((item, index) => wrapItem({
                item,
                className: 'group block',
                children: (
                  <article className="rounded-xl border p-2.5" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
                    <div className="relative mb-2 overflow-hidden rounded-lg aspect-square">
                      {item.image ? (
                        <ServiceImage
                          context={context}
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          sizes="(max-width: 768px) 50vw, 180px"
                          priority={!isPreview && index < Math.max(imagePriorityCount - 1, 0)}
                        />
                      ) : renderFallback(22)}
                    </div>

                    <h4 className="text-sm font-semibold line-clamp-2" style={{ color: tokens.titleText }}>{item.name}</h4>
                    <span className="mt-1 block text-xs font-semibold" style={{ color: tokens.priceText }}>
                      {formatServicePrice(item.price)}
                    </span>
                  </article>
                ),
              }))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className={baseSectionPadding} data-mode={mode}>
        {renderHeader({})}

        <div className={cn('max-w-7xl mx-auto grid gap-4', isPreview ? (isTabletPreview ? 'grid-cols-2' : 'grid-cols-3') : 'grid-cols-1 lg:grid-cols-3')}>
          {featuredItem ? wrapItem({
            item: featuredItem,
            className: cn('group block', !isPreview && 'lg:row-span-2'),
            children: (
              <article className="relative h-full min-h-[320px] md:min-h-[440px] overflow-hidden rounded-2xl border" style={{ borderColor: tokens.cardBorder }}>
                {featuredItem.image ? (
                  <ServiceImage
                    context={context}
                    src={featuredItem.image}
                    alt={featuredItem.name}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority={!isPreview && imagePriorityCount > 0}
                  />
                ) : renderFallback(56)}

                <div className="absolute inset-0" style={{ backgroundImage: tokens.featuredOverlayScrim }} />

                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: tokens.featuredOverlaySubtle }}>
                    Dịch vụ nổi bật
                  </span>

                  <h3 className="mt-2 text-xl md:text-2xl font-semibold text-white line-clamp-2">
                    {featuredItem.name}
                  </h3>

                  {featuredItem.description ? (
                    <p className="mt-2 text-sm text-white/85 line-clamp-2">
                      {stripHtml(featuredItem.description)}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-base md:text-lg font-semibold text-white">
                      {formatServicePrice(featuredItem.price)}
                    </span>

                    <span
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: tokens.ctaSolidBg,
                        borderColor: tokens.ctaSolidBg,
                        color: tokens.ctaSolidText,
                      }}
                    >
                      Xem chi tiết <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </article>
            ),
          }) : null}

          <div className={cn('grid grid-cols-2 gap-3', !isPreview && 'lg:col-span-2')}>
            {otherItems.map((item, index) => wrapItem({
              item,
              className: 'group block',
              children: (
                <article className="h-full rounded-xl border p-3" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
                  <div className="relative mb-3 overflow-hidden rounded-lg aspect-[4/3]">
                    {item.image ? (
                      <ServiceImage
                        context={context}
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        sizes="(max-width: 1024px) 50vw, 260px"
                        priority={!isPreview && index < Math.max(imagePriorityCount - 1, 0)}
                      />
                    ) : renderFallback(28)}

                    {item.tag ? (
                      <div className="absolute left-2 top-2 z-10">
                        <ServiceBadge tag={item.tag} tokens={tokens} />
                      </div>
                    ) : null}
                  </div>

                  <h4 className="text-sm font-semibold line-clamp-2" style={{ color: tokens.titleText }}>
                    {item.name}
                  </h4>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: tokens.priceText }}>
                      {formatServicePrice(item.price)}
                    </span>
                    <ArrowUpRight size={16} style={{ color: tokens.inlineMetaText }} />
                  </div>
                </article>
              ),
            }))}
          </div>
        </div>
      </section>
    );
  };

  if (items.length === 0) {
    return (
      <section className={baseSectionPadding} data-mode={mode}>
        <div className="max-w-7xl mx-auto text-center py-10 rounded-xl border" style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.neutralBackground }}>
          <h2 className="text-xl font-semibold" style={{ color: tokens.heading }}>{heading}</h2>
          <p className="mt-2 text-sm" style={{ color: tokens.mutedText }}>Chưa có dịch vụ nào.</p>
        </div>
      </section>
    );
  }

  if (style === 'grid') {return renderGrid();}
  if (style === 'bento') {return renderBento();}
  if (style === 'list') {return renderList();}
  if (style === 'carousel') {return renderCarousel();}
  if (style === 'minimal') {return renderMinimal();}
  return renderShowcase();
}

