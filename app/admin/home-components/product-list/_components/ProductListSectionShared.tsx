'use client';

import React from 'react';
import Link from 'next/link';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { cn } from '../../../components/ui';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { ProductImageFrameOverlay, useProductFrameConfig } from '@/components/shared/ProductImageFrameBox';
import { withAlpha, type ProductListColorTokens } from '../_lib/colors';
import type { ProductListPreviewItem, ProductListStyle } from '../_types';

type ProductListSharedContext = 'preview' | 'site';
type ProductListPreviewDevice = 'mobile' | 'tablet' | 'desktop';
type ProductListSharedItem = ProductListPreviewItem & { href?: string };

interface ProductListSectionSharedProps {
  items: ProductListSharedItem[];
  subTitle: string;
  sectionTitle: string;
  style: ProductListStyle;
  tokens: ProductListColorTokens;
  context: ProductListSharedContext;
  device?: ProductListPreviewDevice;
  showViewAll?: boolean;
  viewAllHref?: string;
}

const getDiscount = (price?: string, originalPrice?: string) => {
  if (!price || !originalPrice) {return null;}
  const parsedPrice = Number.parseInt(price.replaceAll(/\D/g, ''));
  const parsedOriginal = Number.parseInt(originalPrice.replaceAll(/\D/g, ''));
  if (Number.isNaN(parsedPrice) || Number.isNaN(parsedOriginal) || parsedOriginal <= parsedPrice) {
    return null;
  }
  return `-${Math.round(((parsedOriginal - parsedPrice) / parsedOriginal) * 100)}%`;
};

const ProductBadge = ({
  text,
  variant = 'solid',
  tokens,
  className,
}: {
  text: string;
  variant?: 'solid' | 'outline';
  tokens: ProductListColorTokens;
  className?: string;
}) => {
  const baseClass = cn(
    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
    className,
  );

  if (variant === 'outline') {
    return (
      <span
        className={baseClass}
        style={{
          backgroundColor: 'transparent',
          borderColor: tokens.badgeOutlineBorder,
          color: tokens.badgeOutlineText,
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={baseClass}
      style={{
        backgroundColor: tokens.badgeSolidBg,
        borderColor: tokens.badgeSolidBg,
        color: tokens.badgeSolidText,
      }}
    >
      {text}
    </span>
  );
};

const ProductImage = ({
  context,
  src,
  alt,
  className,
  sizes,
}: {
  context: ProductListSharedContext;
  src: string;
  alt: string;
  className: string;
  sizes: string;
}) => {
  const { frame } = useProductFrameConfig();

  if (context === 'site') {
    return (
      <>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
        />
        <ProductImageFrameOverlay frame={frame} />
      </>
    );
  }

  return (
    <>
      <PreviewImage
        src={src}
        alt={alt}
        className={className}
      />
      <ProductImageFrameOverlay frame={frame} />
    </>
  );
};

export function ProductListSectionShared({
  items,
  subTitle,
  sectionTitle,
  style,
  tokens,
  context,
  device = 'desktop',
  showViewAll = true,
  viewAllHref = '/products',
}: ProductListSectionSharedProps) {
  const carouselId = React.useId().replaceAll(':', '');
  const carouselElementId = `product-list-shared-${carouselId}`;

  const isPreview = context === 'preview';
  const isMobilePreview = isPreview && device === 'mobile';
  const isTabletPreview = isPreview && device === 'tablet';

  const sectionPadding = isPreview
    ? cn('py-8 md:py-10', isMobilePreview ? 'px-3' : 'px-4 md:px-6')
    : 'py-10 md:py-16 px-4 md:px-6';

  const viewAllMobile = showViewAll ? (
    context === 'site' ? (
      <Link
        href={viewAllHref}
        className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center"
        style={{ color: tokens.ctaSecondaryText }}
      >
        Xem tất cả <ArrowRight size={16} />
      </Link>
    ) : (
      <button
        type="button"
        className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center"
        style={{ color: tokens.ctaSecondaryText }}
      >
        Xem tất cả <ArrowRight size={16} />
      </button>
    )
  ) : null;

  const viewAllDesktop = showViewAll ? (
    context === 'site' ? (
      <Link
        href={viewAllHref}
        className="hidden md:flex gap-2 pl-6 border-l transition-colors items-center"
        style={{ color: tokens.ctaSecondaryText, borderColor: tokens.neutralBorder }}
      >
        Xem tất cả <ArrowRight size={16} />
      </Link>
    ) : (
      <button
        type="button"
        className="hidden md:flex gap-2 pl-6 border-l transition-colors items-center"
        style={{ color: tokens.ctaSecondaryText, borderColor: tokens.neutralBorder }}
      >
        Xem tất cả <ArrowRight size={16} />
      </button>
    )
  ) : null;

  const renderHeader = (bottomClass = 'mb-6 md:mb-10') => (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', bottomClass)}>
      <div className="flex items-end justify-between w-full md:w-auto">
        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: tokens.subtitleSecondary }}>
            <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: tokens.accentSecondary }}></span>
            {subTitle}
          </div>
          <h2
            className={cn('font-bold tracking-tight', isMobilePreview ? 'text-2xl' : 'text-2xl md:text-4xl')}
            style={{ color: tokens.headingPrimary }}
          >
            {sectionTitle}
          </h2>
        </div>
        {viewAllMobile}
      </div>
      {viewAllDesktop}
    </div>
  );

  const wrapItem = ({
    item,
    className,
    children,
  }: {
    item: ProductListSharedItem;
    className: string;
    children: React.ReactNode;
  }) => {
    const key = String(item.id);

    if (context === 'site' && item.href) {
      return (
        <Link key={key} href={item.href} className={cn(className, 'no-underline text-inherit')}>
          {children}
        </Link>
      );
    }

    return <div key={key} className={className}>{children}</div>;
  };

  const renderFallback = (size: number) => (
    <div className="h-full w-full flex items-center justify-center">
      <Package size={size} className="text-slate-300" />
    </div>
  );

  const renderMinimal = () => (
    <section className={sectionPadding}>
      {renderHeader('mb-6 md:mb-10')}
      <div
        className={cn(
          'grid gap-x-6 gap-y-10',
          isPreview
            ? (isMobilePreview ? 'grid-cols-2 gap-x-3 gap-y-6' : (isTabletPreview ? 'grid-cols-3' : 'grid-cols-4'))
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10',
        )}
      >
        {items.slice(0, 4).map((item) => {
          const discount = getDiscount(item.price, item.originalPrice);
          return wrapItem({
            item,
            className: 'group cursor-pointer',
            children: (
              <>
                <div
                  className="relative aspect-square overflow-hidden rounded-2xl mb-4 border border-transparent transition-all"
                  style={{ backgroundColor: tokens.neutralBackground }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = tokens.cardBorderHover;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  {item.image ? (
                    <ProductImage
                      context={context}
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  ) : renderFallback(48)}

                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {discount && <ProductBadge text={discount} tokens={tokens} className="text-[10px] px-2 py-1" />}
                    {item.tag === 'new' && !discount && <ProductBadge text="NEW" variant="outline" tokens={tokens} className="text-[10px] px-2 py-1" />}
                    {item.tag === 'hot' && !discount && <ProductBadge text="HOT" tokens={tokens} className="text-[10px] px-2 py-1" />}
                  </div>

                  <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <span
                      className="block w-full bg-white/95 hover:bg-white backdrop-blur-md shadow-lg font-bold py-2 px-4 rounded-lg text-sm text-center"
                      style={{ color: tokens.ctaSecondaryText }}
                    >
                      Xem chi tiết
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-slate-900 text-base truncate group-hover:opacity-80 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold" style={{ color: tokens.pricePrimary }}>{item.price}</span>
                    {item.originalPrice && <span className="text-xs text-slate-400 line-through">{item.originalPrice}</span>}
                  </div>
                </div>
              </>
            ),
          });
        })}
      </div>
    </section>
  );

  const renderCommerce = () => (
    <section className={sectionPadding}>
      {renderHeader('mb-6 md:mb-10')}
      <div
        className={cn(
          'grid gap-6',
          isPreview
            ? (isMobilePreview ? 'grid-cols-1 sm:grid-cols-2 gap-4' : (isTabletPreview ? 'grid-cols-2' : 'grid-cols-4'))
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
        )}
      >
        {items.slice(0, 4).map((item) => {
          const discount = getDiscount(item.price, item.originalPrice);
          return wrapItem({
            item,
            className: 'group bg-white border rounded-xl overflow-hidden transition-all duration-300 flex flex-col',
            children: (
              <>
                <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: tokens.neutralBackground }}>
                  {item.image ? (
                    <ProductImage
                      context={context}
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : renderFallback(40)}
                  {discount && (
                    <div className="absolute top-2 right-2">
                      <ProductBadge text={discount} tokens={tokens} className="text-[10px] px-2 py-1" />
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:opacity-80 transition-colors">
                    {item.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-4 mt-auto pt-2">
                    <span className="text-base font-bold group-hover:opacity-80 transition-colors" style={{ color: tokens.pricePrimary }}>{item.price}</span>
                    {item.originalPrice && <span className="text-xs text-slate-400 line-through">{item.originalPrice}</span>}
                  </div>

                  <span
                    className="w-full gap-1.5 md:gap-2 border-2 py-1.5 md:py-2 px-2 md:px-4 rounded-lg font-medium flex items-center justify-center transition-colors whitespace-nowrap text-xs md:text-sm"
                    style={{ borderColor: tokens.ctaSecondaryBorder, color: tokens.ctaSecondaryText }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = tokens.ctaSecondaryHoverBg;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Xem chi tiết
                    <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                  </span>
                </div>
              </>
            ),
          });
        })}
      </div>
    </section>
  );

  const renderBento = () => {
    const featured = items[items.length > 7 ? 7 : items.length - 1] || items[0];
    const others = items.slice(0, 4);
    const discount = getDiscount(featured?.price, featured?.originalPrice);

    return (
      <section className={sectionPadding}>
        {renderHeader('mb-6 md:mb-10')}

        {isMobilePreview ? (
          <div className="grid grid-cols-2 gap-3">
            {others.slice(0, 4).map((item) => {
              const itemDiscount = getDiscount(item.price, item.originalPrice);
              return wrapItem({
                item,
                className: 'group bg-white border rounded-xl p-2 flex flex-col cursor-pointer hover:shadow-md transition-all',
                children: (
                  <>
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2" style={{ backgroundColor: tokens.neutralBackground }}>
                      {item.image ? (
                        <ProductImage
                          context={context}
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 160px"
                        />
                      ) : renderFallback(24)}
                      {itemDiscount && (
                        <div className="absolute top-2 left-2">
                          <ProductBadge text={itemDiscount} tokens={tokens} className="text-[10px] px-1.5 py-0.5" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-slate-900 truncate group-hover:opacity-80 transition-colors">{item.name}</h4>
                    <span className="text-sm font-bold mt-1" style={{ color: tokens.pricePrimary }}>{item.price}</span>
                  </>
                ),
              });
            })}
          </div>
        ) : (
          <div className={cn('grid gap-4 h-auto', isTabletPreview ? 'grid-cols-3 grid-rows-2' : 'grid-cols-4 grid-rows-2')}>
            {wrapItem({
              item: featured ?? { id: 'featured-bento-missing', name: '', price: '' },
              className: 'col-span-2 row-span-2 relative group rounded-2xl overflow-hidden cursor-pointer min-h-[400px] border border-transparent transition-colors',
              children: (
                <>
                  {featured?.image ? (
                    <ProductImage
                      context={context}
                      src={featured.image}
                      alt={featured.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ backgroundColor: tokens.neutralBackground }}>
                      <Package size={64} className="text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  {discount && (
                    <div className="absolute top-4 right-4">
                      <ProductBadge text={discount} tokens={tokens} className="text-sm px-3 py-1" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                    <h3 className="text-2xl md:text-4xl font-bold mb-3 leading-tight" style={{ color: tokens.featuredOverlayText }}>
                      {featured?.name}
                    </h3>
                    <div className="flex flex-row items-center justify-between gap-4 mt-2">
                      <span className="text-2xl font-bold" style={{ color: tokens.featuredOverlayText }}>{featured?.price}</span>
                      <span
                        className="rounded-full px-6 py-2 border-0 shadow-lg transition-all hover:scale-105"
                        style={{
                          backgroundColor: tokens.ctaPrimary,
                          color: tokens.ctaPrimaryText,
                        }}
                      >
                        Xem chi tiết
                      </span>
                    </div>
                  </div>
                </>
              ),
            })}

            {others.slice(0, 4).map((item) => {
              const itemDiscount = getDiscount(item.price, item.originalPrice);
              return wrapItem({
                item,
                className: 'col-span-1 row-span-1 bg-white border rounded-2xl p-3 flex flex-col group hover:shadow-lg transition-all cursor-pointer relative overflow-hidden',
                children: (
                  <>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3" style={{ backgroundColor: tokens.featuredSurface }}>
                      {item.image ? (
                        <ProductImage
                          context={context}
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                          sizes="(max-width: 1024px) 50vw, 200px"
                        />
                      ) : renderFallback(32)}

                      {itemDiscount && (
                        <div className="absolute top-2 left-2">
                          <ProductBadge text={itemDiscount} tokens={tokens} className="text-[10px] px-1.5 py-0.5" />
                        </div>
                      )}

                      <div className="absolute bottom-2 right-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="p-2 rounded-full shadow-lg" style={{ backgroundColor: tokens.accentSecondary, color: tokens.badgeSolidText }}>
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto px-1">
                      <h4 className="font-medium text-sm text-slate-900 truncate group-hover:opacity-80 transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold" style={{ color: tokens.pricePrimary }}>{item.price}</span>
                        {item.originalPrice && <span className="text-[10px] text-slate-400 line-through opacity-70">{item.originalPrice}</span>}
                      </div>
                    </div>
                  </>
                ),
              });
            })}
          </div>
        )}
      </section>
    );
  };

  const renderCarousel = () => {
    const visibleItems = items.slice(0, 8);

    return (
      <section className={sectionPadding}>
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-8">
          <div className="flex items-end justify-between w-full md:w-auto">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: tokens.subtitleSecondary }}>
                <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: tokens.accentSecondary }}></span>
                {subTitle}
              </div>
              <h2
                className={cn('font-bold tracking-tight', isMobilePreview ? 'text-2xl' : 'text-2xl md:text-4xl')}
                style={{ color: tokens.headingPrimary }}
              >
                {sectionTitle}
              </h2>
            </div>
            <div className="flex gap-2 md:hidden">
              <button
                type="button"
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: tokens.navBorder, backgroundColor: tokens.navBg, color: tokens.navText }}
                onClick={() => {
                  const container = document.querySelector(`#${carouselElementId}`);
                  if (container) {container.scrollBy({ behavior: 'smooth', left: -220 });}
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: tokens.navBorder, backgroundColor: tokens.navBg, color: tokens.navText }}
                onClick={() => {
                  const container = document.querySelector(`#${carouselElementId}`);
                  if (container) {container.scrollBy({ behavior: 'smooth', left: 220 });}
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              className="w-10 h-10 rounded-full border flex items-center justify-center"
              style={{ borderColor: tokens.navBorder, backgroundColor: tokens.navBg, color: tokens.navText }}
              onClick={() => {
                const container = document.querySelector(`#${carouselElementId}`);
                if (container) {container.scrollBy({ behavior: 'smooth', left: -280 });}
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: tokens.ctaPrimary, color: tokens.ctaPrimaryText }}
              onClick={() => {
                const container = document.querySelector(`#${carouselElementId}`);
                if (container) {container.scrollBy({ behavior: 'smooth', left: 280 });}
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden -mx-3 md:-mx-4 px-3 md:px-4">
          <div
            id={carouselElementId}
            className={cn('flex overflow-x-auto snap-x snap-mandatory', isPreview ? (isMobilePreview ? 'gap-3' : 'gap-5') : 'gap-3 md:gap-5')}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {visibleItems.map((item) => {
              const discount = getDiscount(item.price, item.originalPrice);
              return wrapItem({
                item,
                className: cn(
                  'flex-shrink-0 group cursor-pointer snap-start',
                  isPreview
                    ? (isMobilePreview ? 'w-[160px]' : (isTabletPreview ? 'w-[220px]' : 'w-[260px]'))
                    : 'w-[160px] md:w-[220px] lg:w-[260px]',
                ),
                children: (
                  <>
                    <div
                      className="relative aspect-square overflow-hidden rounded-xl mb-3 border border-transparent transition-all"
                      style={{ backgroundColor: tokens.neutralBackground }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor = tokens.cardBorderHover;
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      {item.image ? (
                        <ProductImage
                          context={context}
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 260px"
                        />
                      ) : renderFallback(40)}
                      {discount && (
                        <div className="absolute top-2 left-2">
                          <ProductBadge text={discount} tokens={tokens} className="text-[10px] px-2 py-1" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm truncate group-hover:opacity-80 transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm" style={{ color: tokens.pricePrimary }}>{item.price}</span>
                      {item.originalPrice && <span className="text-xs text-slate-400 line-through">{item.originalPrice}</span>}
                    </div>
                  </>
                ),
              });
            })}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              className={cn('h-2 rounded-full transition-all', index === 0 ? 'w-6' : 'w-2')}
              style={{ backgroundColor: index === 0 ? tokens.dotActive : tokens.dotInactive }}
            />
          ))}
        </div>
      </section>
    );
  };

  const renderCompact = () => (
    <section className={sectionPadding}>
      {renderHeader('mb-6 md:mb-8')}

      <div
        className={cn(
          'grid gap-3',
          isPreview
            ? (isMobilePreview ? 'grid-cols-2' : (isTabletPreview ? 'grid-cols-4' : 'grid-cols-6'))
            : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
        )}
      >
        {items.slice(0, 6).map((item) => {
          const discount = getDiscount(item.price, item.originalPrice);
          return wrapItem({
            item,
            className: 'group cursor-pointer bg-white rounded-lg border p-2 hover:shadow-md transition-all',
            children: (
              <>
                <div className="relative aspect-square overflow-hidden rounded-md mb-2" style={{ backgroundColor: tokens.neutralBackground }}>
                  {item.image ? (
                    <ProductImage
                      context={context}
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 160px"
                    />
                  ) : renderFallback(24)}
                  {discount && (
                    <div className="absolute top-1 left-1">
                      <ProductBadge text={discount} tokens={tokens} className="text-[9px] px-1.5 py-0.5" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-xs text-slate-900 truncate group-hover:opacity-80 transition-colors">{item.name}</h3>
                <span className="font-bold text-xs mt-0.5 block" style={{ color: tokens.pricePrimary }}>{item.price}</span>
              </>
            ),
          });
        })}
      </div>
    </section>
  );

  const renderShowcaseDesktop = (featured: ProductListSharedItem | undefined, others: ProductListSharedItem[]) => {
    const featuredDiscount = getDiscount(featured?.price, featured?.originalPrice);

    return (
      <div className={cn('grid gap-4', isPreview ? (isTabletPreview ? 'grid-cols-2' : 'grid-cols-3') : 'hidden md:grid grid-cols-3')}>
        {wrapItem({
          item: featured ?? { id: 'featured-missing', name: '', price: '' },
          className: 'relative group rounded-2xl overflow-hidden cursor-pointer h-[400px] border transition-colors',
          children: (
            <>
              {featured?.image ? (
                <ProductImage
                  context={context}
                  src={featured.image}
                  alt={featured.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ backgroundColor: tokens.neutralBackground }}>
                  <Package size={64} className="text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {featuredDiscount && (
                <div className="absolute top-4 left-4">
                  <ProductBadge text={featuredDiscount} tokens={tokens} className="text-sm px-3 py-1" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <ProductBadge text="Nổi bật" tokens={tokens} className="mb-2" />
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: tokens.featuredOverlayText }}>{featured?.name}</h3>
                <div className="flex items-center justify-between">
                  <span
                    className="text-xl font-bold"
                    style={{
                      color: tokens.featuredOverlayText,
                      textShadow: `0 2px 8px ${withAlpha(tokens.secondary, 0.4, tokens.primary)}`,
                    }}
                  >
                    {featured?.price}
                  </span>
                  <span
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: tokens.ctaPrimary, color: tokens.ctaPrimaryText }}
                  >
                    Xem chi tiết
                  </span>
                </div>
              </div>
            </>
          ),
        })}

        <div className={cn('grid grid-cols-2 gap-3', isPreview ? (device === 'desktop' && 'col-span-2') : 'col-span-2')}>
          {others.map((item) => {
            const discount = getDiscount(item.price, item.originalPrice);
            return wrapItem({
              item,
              className: 'group bg-white border rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-md transition-all',
              children: (
                <>
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3" style={{ backgroundColor: tokens.neutralBackground }}>
                    {item.image ? (
                      <ProductImage
                        context={context}
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 1024px) 50vw, 200px"
                      />
                    ) : renderFallback(32)}
                    {discount && (
                      <div className="absolute top-2 left-2">
                        <ProductBadge text={discount} tokens={tokens} className="text-[10px] px-1.5 py-0.5" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-slate-900 truncate group-hover:opacity-80 transition-colors">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold" style={{ color: tokens.pricePrimary }}>{item.price}</span>
                    {item.originalPrice && <span className="text-[10px] text-slate-400 line-through">{item.originalPrice}</span>}
                  </div>
                </>
              ),
            });
          })}
        </div>
      </div>
    );
  };

  const renderShowcase = () => {
    const showcaseFeatured = items[0];
    const showcaseOthers = items.slice(1, 5);

    return (
      <section className={sectionPadding}>
        {renderHeader('mb-6 md:mb-8')}

        {(isPreview ? isMobilePreview : true) && (
          <div className={cn('grid grid-cols-2 gap-3', !isPreview && 'md:hidden')}>
            {items.slice(0, 4).map((item) => {
              const discount = getDiscount(item.price, item.originalPrice);
              return wrapItem({
                item,
                className: 'group bg-white border rounded-xl p-2 flex flex-col cursor-pointer hover:shadow-md transition-all',
                children: (
                  <>
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2" style={{ backgroundColor: tokens.neutralBackground }}>
                      {item.image ? (
                        <ProductImage
                          context={context}
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          sizes="(max-width: 768px) 50vw, 160px"
                        />
                      ) : renderFallback(24)}
                      {discount && (
                        <div className="absolute top-2 left-2">
                          <ProductBadge text={discount} tokens={tokens} className="text-[10px] px-1.5 py-0.5" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-slate-900 truncate">{item.name}</h4>
                    <span className="text-sm font-bold mt-1" style={{ color: tokens.pricePrimary }}>{item.price}</span>
                  </>
                ),
              });
            })}
          </div>
        )}

        {(!isPreview || !isMobilePreview) && renderShowcaseDesktop(showcaseFeatured, showcaseOthers)}
      </section>
    );
  };

  if (style === 'minimal') {return renderMinimal();}
  if (style === 'commerce') {return renderCommerce();}
  if (style === 'carousel') {return renderCarousel();}
  if (style === 'compact') {return renderCompact();}
  if (style === 'showcase') {return renderShowcase();}
  return renderBento();
}

