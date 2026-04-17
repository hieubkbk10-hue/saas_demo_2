'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Package } from 'lucide-react';
import { BrandBadge, SaleBadge } from '@/components/site/shared/BrandColorHelpers';
import { ProductImageFrameOverlay, useProductFrameConfig } from '@/components/shared/ProductImageFrameBox';
import { getPublicPriceLabel } from '@/lib/products/public-price';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';

// 6 Styles theo mẫu previews.tsx
// 'minimal' = Luxury Minimal, 'commerce' = Commerce Card, 'bento' = Bento Grid
// 'carousel' = Horizontal Scroll, 'compact' = Dense Grid, 'showcase' = Featured + Grid
type ProductListStyle = 'minimal' | 'commerce' | 'bento' | 'carousel' | 'compact' | 'showcase';

interface ProductListSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual';
  title: string;
}

interface SectionHeaderProps {
  brandColor: string;
  secondary: string;
  subTitle: string;
  sectionTitle: string;
  showViewAll: boolean;
}

const SectionHeader = ({ brandColor: _brandColor, secondary, subTitle, sectionTitle, showViewAll }: SectionHeaderProps) => (
  <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-10">
    <div className="flex items-end justify-between w-full md:w-auto">
      <div className="space-y-1 md:space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
          <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
          {subTitle}
        </div>
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
          {sectionTitle}
        </h2>
      </div>
      {showViewAll && (
        <Link href="/products" className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center" style={{ color: secondary }}>
          Xem tất cả <ArrowRight size={16} />
        </Link>
      )}
    </div>
    {showViewAll && (
      <Link href="/products" className="hidden md:flex gap-2 text-slate-500 hover:text-slate-900 pl-6 border-l border-slate-200 transition-colors items-center">
        Xem tất cả <ArrowRight size={16} />
      </Link>
    )}
  </div>
);

export function ProductListSection({ config, brandColor, secondary, title }: ProductListSectionProps) {
  const style = (config.style as ProductListStyle) || 'commerce';
  const itemCount = (config.itemCount as number) || 8;
  const selectionMode = (config.selectionMode as 'auto' | 'manual') || 'auto';
  const selectedProductIds = React.useMemo(() => (config.selectedProductIds as string[]) || [], [config.selectedProductIds]);
  const subTitle = (config.subTitle as string) || 'Bộ sưu tập';
  const sectionTitle = (config.sectionTitle as string) || title;
  const carouselId = React.useId();
  const carouselElementId = `product-carousel-${carouselId.replaceAll(':', '')}`;
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const categories = useQuery(api.productCategories.listActive);
  const saleMode = React.useMemo<'cart' | 'contact' | 'affiliate'>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [saleModeSetting?.value]);
  const imageAspectRatio = React.useMemo(
    () => resolveProductImageAspectRatio(aspectRatioSetting?.value),
    [aspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = React.useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const routeMode = React.useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const categorySlugMap = React.useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.slug]));
  }, [categories]);
  const getProductDetailHref = React.useCallback((product?: { slug?: string | null; categoryId?: string }) => {
    if (!product?.slug) {return '/products';}
    return buildDetailPath({
      categorySlug: product.categoryId ? categorySlugMap.get(product.categoryId) : undefined,
      mode: routeMode,
      moduleKey: 'products',
      recordSlug: product.slug,
    });
  }, [categorySlugMap, routeMode]);
  const { frame } = useProductFrameConfig();
  
  // Query products based on selection mode
  const productsData = useQuery(
    api.products.listPublicResolved,
    selectionMode === 'auto' ? { limit: Math.min(itemCount, 20) } : { limit: 100 }
  );
  
  // Get products to display based on selection mode
  const products = React.useMemo(() => {
    if (!productsData) {return [];}
    
    if (selectionMode === 'manual' && selectedProductIds.length > 0) {
      const productMap = new Map(productsData.map(p => [p._id, p]));
      return selectedProductIds
        .map(id => productMap.get(id as Id<"products">))
        .filter((p): p is NonNullable<typeof p> => p !== undefined && p.status === 'Active');
    }
    
    return productsData.filter(p => p.status === 'Active').slice(0, itemCount);
  }, [productsData, selectionMode, selectedProductIds, itemCount]);

  const showViewAll = products.length >= 3;

  // Loading state
  if (productsData === undefined) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  // No products state
  if (products.length === 0) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-4">{title}</h2>
          <p className="text-slate-500">Chưa có sản phẩm nào.</p>
        </div>
      </section>
    );
  }

  // Format price
  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getPublicPriceLabel({ saleMode, price, salePrice, isRangeFromVariant });

  const formatComparePrice = (price?: number) =>
    price ? getPublicPriceLabel({ saleMode: 'cart', price }).label : '';

  const getDiscount = (currentPrice?: number, comparePrice?: number, isContactPrice?: boolean) => {
    if (isContactPrice || !currentPrice || !comparePrice || comparePrice <= currentPrice) {return null;}
    return `-${Math.round(((comparePrice - currentPrice) / comparePrice) * 100)}%`;
  };


  // Style 1: Luxury Minimal - Clean grid với hover effects và view details button
  if (style === 'minimal') {
    return (
      <section className="py-10 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader brandColor={brandColor} secondary={secondary} subTitle={subTitle} sectionTitle={sectionTitle} showViewAll={showViewAll} />
          
          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
            {products.slice(0, 4).map((product) => {
              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
              const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
              return (
                <Link key={product._id} href={getProductDetailHref(product)} className="group cursor-pointer">
                  {/* Image Container */}
                  <div
                    className="relative overflow-hidden rounded-2xl bg-slate-100 mb-4 border border-transparent hover:border-slate-200 transition-all"
                    style={imageAspectRatioStyle}
                  >
                    {product.image ? (
                      <Image
                        mode="thumb"
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package size={48} className="text-slate-300" />
                      </div>
                    )}
                    <ProductImageFrameOverlay frame={frame} />
                    
                    {/* Discount / New Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {discount && (
                        <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                      )}
                    </div>

                    {/* View Details Button (Hover) */}
                    <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                      <span className="block w-full bg-white/95 hover:bg-white backdrop-blur-md shadow-lg font-bold py-2 px-4 rounded-lg text-sm text-center" style={{ color: brandColor }}>
                        Xem chi tiết
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-slate-900 text-base truncate group-hover:opacity-80 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-slate-900" style={{ color: brandColor }}>{priceDisplay.label}</span>
                      {priceDisplay.comparePrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatComparePrice(priceDisplay.comparePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Style 2: Commerce Card - Cards với button Xem chi tiết và hover effects
  if (style === 'commerce') {
    return (
      <section className="py-10 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader brandColor={brandColor} secondary={secondary} subTitle={subTitle} sectionTitle={sectionTitle} showViewAll={showViewAll} />
          
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.slice(0, 4).map((product) => {
              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
              const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
              return (
                <Link 
                  key={product._id} 
                  href={getProductDetailHref(product)}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative bg-slate-100 overflow-hidden" style={imageAspectRatioStyle}>
                    {product.image ? (
                      <Image
                        mode="thumb"
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package size={40} className="text-slate-300" />
                      </div>
                    )}
                    <ProductImageFrameOverlay frame={frame} />
                    {discount && (
                      <div className="absolute top-2 right-2">
                        <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:opacity-80 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-baseline gap-2 mb-4 mt-auto pt-2">
                      <span className="text-base font-bold text-slate-900 group-hover:opacity-80 transition-colors" style={{ color: brandColor }}>{priceDisplay.label}</span>
                      {priceDisplay.comparePrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatComparePrice(priceDisplay.comparePrice)}
                        </span>
                      )}
                    </div>

                    <span 
                      className="w-full gap-1.5 md:gap-2 border-2 py-1.5 md:py-2 px-2 md:px-4 rounded-lg font-medium flex items-center justify-center transition-colors hover:bg-opacity-10 whitespace-nowrap text-xs md:text-sm"
                      style={{ borderColor: `${brandColor}30`, color: brandColor }}
                    >
                      Xem chi tiết
                      <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Style 4: Carousel - Horizontal scrollable với arrows
  if (style === 'carousel') {
    const cardWidth = 260;
    const gap = 20;
    const displayedProducts = products.slice(0, 8);
    // Responsive: Desktop ~4 items (260px each), Tablet ~3 items, Mobile ~2 items
    const showArrowsDesktop = displayedProducts.length > 4;
    const showArrowsMobile = displayedProducts.length > 2;

    return (
      <section className="py-10 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header với navigation arrows */}
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-8">
            <div className="flex items-end justify-between w-full md:w-auto">
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
                      <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
                  {subTitle}
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
                  {sectionTitle}
                </h2>
              </div>
              {/* Mobile arrows - chỉ hiện khi có > 2 items */}
              {showArrowsMobile && (
                <div className="flex gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const container = document.querySelector(`#${carouselElementId}`);
                      if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                    }}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                  >
                    <ChevronLeft size={16} style={{ color: brandColor }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const container = document.querySelector(`#${carouselElementId}`);
                      if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                    }}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                  >
                    <ChevronRight size={16} style={{ color: brandColor }} />
                  </button>
                </div>
              )}
            </div>
            {/* Desktop arrows - chỉ hiện khi có > 4 items */}
            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselElementId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={18} style={{ color: brandColor }} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselElementId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Carousel Container */}
          <div className="relative overflow-hidden rounded-xl">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-r from-white/10 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-l from-white/10 to-transparent z-10 pointer-events-none" />

            {/* Scrollable area với Mouse Drag */}
            <div
              id={carouselElementId}
              className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:gap-5 py-4 px-2 cursor-grab active:cursor-grabbing select-none scrollbar-hide"
              style={{
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
              onMouseDown={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = 'true';
                el.dataset.startX = String(e.pageX - el.offsetLeft);
                el.dataset.scrollLeft = String(el.scrollLeft);
                el.style.scrollBehavior = 'auto';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.dataset.isDown = 'false';
                e.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseUp={(e) => {
                e.currentTarget.dataset.isDown = 'false';
                e.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                if (el.dataset.isDown !== 'true') {return;}
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
            >
              {displayedProducts.map((product) => {
                const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
                return (
                  <Link
                    key={product._id}
                    href={getProductDetailHref(product)}
                    className="flex-shrink-0 snap-start w-[160px] md:w-[220px] lg:w-[260px] group cursor-pointer"
                    draggable={false}
                  >
                    <div
                      className="relative overflow-hidden rounded-xl bg-slate-100 mb-3 border border-transparent hover:border-slate-200 transition-all"
                      style={imageAspectRatioStyle}
                    >
                      {product.image ? (
                        <Image
                          mode="thumb"
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 260px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          draggable={false}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Package size={40} className="text-slate-300" /></div>
                      )}
                      <ProductImageFrameOverlay frame={frame} />
                      {discount && (
                        <div className="absolute top-2 left-2">
                          <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm truncate group-hover:opacity-80 transition-colors">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-sm" style={{ color: brandColor }}>{priceDisplay.label}</span>
                    {priceDisplay.comparePrice && (
                      <span className="text-xs text-slate-400 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
              {/* End spacer */}
              <div className="flex-shrink-0 w-4" />
            </div>
          </div>

          {/* CSS để ẩn scrollbar */}
          <style>{`
            #${carouselElementId}::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </section>
    );
  }

  // Style 5: Compact - Dense grid với smaller cards, nhiều sản phẩm hơn
  if (style === 'compact') {
    return (
      <section className="py-10 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader brandColor={brandColor} secondary={secondary} subTitle={subTitle} sectionTitle={sectionTitle} showViewAll={showViewAll} />
          
          {/* Compact Grid - More items, smaller cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.slice(0, 6).map((product) => {
              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
              const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
              return (
                <Link key={product._id} href={getProductDetailHref(product)} className="group cursor-pointer bg-white rounded-lg border border-slate-100 p-2 hover:shadow-md hover:border-slate-200 transition-all">
                  <div className="relative overflow-hidden rounded-md bg-slate-50 mb-2" style={imageAspectRatioStyle}>
                    {product.image ? (
                      <Image
                        mode="thumb"
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 160px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>
                    )}
                    <ProductImageFrameOverlay frame={frame} />
                    {discount && (
                      <div className="absolute top-1 left-1">
                        <SaleBadge text={discount} className="text-[9px] px-1.5 py-0.5" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-xs text-slate-900 truncate group-hover:opacity-80 transition-colors">{product.name}</h3>
                  <span className="font-bold text-xs mt-0.5 block" style={{ color: brandColor }}>{priceDisplay.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Style 6: Showcase - Featured large item với grid nhỏ bên cạnh
  if (style === 'showcase') {
    const showcaseFeatured = products[0];
    const showcaseOthers = products.slice(1, 5);
    const showcasePriceDisplay = showcaseFeatured
      ? getPriceDisplay(showcaseFeatured.price, showcaseFeatured.salePrice, showcaseFeatured.hasVariants)
      : null;
    const showcaseDiscount = getDiscount(showcaseFeatured?.price, showcasePriceDisplay?.comparePrice, showcasePriceDisplay?.isContactPrice);

    return (
      <section className="py-10 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader brandColor={brandColor} secondary={secondary} subTitle={subTitle} sectionTitle={sectionTitle} showViewAll={showViewAll} />
          
          {/* Showcase Layout - Mobile */}
          <div className="grid md:hidden grid-cols-2 gap-3">
            {products.slice(0, 4).map((product) => {
              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
              const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
              return (
                <Link key={product._id} href={getProductDetailHref(product)} className="group bg-white border border-slate-200 rounded-xl p-2 flex flex-col cursor-pointer hover:shadow-md transition-all">
                  <div className="relative w-full rounded-lg bg-slate-100 overflow-hidden mb-2" style={imageAspectRatioStyle}>
                    {product.image ? (
                      <Image mode="thumb" src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 160px" className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>
                    )}
                    <ProductImageFrameOverlay frame={frame} />
                    {discount && (
                      <div className="absolute top-2 left-2">
                        <SaleBadge text={discount} className="text-[10px] px-1.5 py-0.5" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-slate-900 truncate">{product.name}</h4>
                  <span className="text-sm font-bold mt-1" style={{ color: brandColor }}>{priceDisplay.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Showcase Layout - Desktop */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            {/* Featured Large Item */}
            <Link
              href={getProductDetailHref(showcaseFeatured)}
              className="relative group rounded-2xl overflow-hidden cursor-pointer min-h-[400px] border border-slate-200 hover:border-slate-300 transition-colors"
              style={{ ...imageAspectRatioStyle, backgroundColor: `${secondary}05` }}
            >
              {showcaseFeatured?.image ? (
                <Image
                  mode="thumb"
                  src={showcaseFeatured.image}
                  alt={showcaseFeatured.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100"><Package size={64} className="text-slate-300" /></div>
              )}
              <ProductImageFrameOverlay frame={frame} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {showcaseDiscount && (
                <div className="absolute top-4 left-4">
                  <SaleBadge text={showcaseDiscount} className="text-sm px-3 py-1" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <BrandBadge text="Nổi bật" variant="solid" brandColor={brandColor} secondary={secondary} className="mb-2" />
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">{showcaseFeatured?.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white line-clamp-1">{showcasePriceDisplay?.label ?? ''}</span>
                  <span className="h-9 px-4 rounded-lg text-white text-sm font-medium shrink-0 inline-flex items-center" style={{ backgroundColor: brandColor }}>Xem chi tiết</span>
                </div>
              </div>
            </Link>

            {/* Right Grid - 2x2 */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              {showcaseOthers.map((product) => {
                const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
                return (
                  <Link key={product._id} href={getProductDetailHref(product)} className="group bg-white border border-slate-200 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="relative w-full rounded-lg bg-slate-50 overflow-hidden mb-3" style={imageAspectRatioStyle}>
                      {product.image ? (
                        <Image mode="thumb" src={product.image} alt={product.name} fill sizes="(max-width: 1024px) 50vw, 200px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Package size={32} className="text-slate-300" /></div>
                      )}
                      <ProductImageFrameOverlay frame={frame} />
                      {discount && (
                        <div className="absolute top-2 left-2">
                          <SaleBadge text={discount} className="text-[10px] px-1.5 py-0.5" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-slate-900 truncate group-hover:opacity-80 transition-colors">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold" style={{ color: brandColor }}>{priceDisplay.label}</span>
                    {priceDisplay.comparePrice && (
                      <span className="text-[10px] text-slate-400 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Style 3: Bento Grid - Asymmetric layout với hero card lớn (default)
  const featured = products.at(-1) ?? products[0];
  const others = products.slice(0, 4);
  const featuredPriceDisplay = featured
    ? getPriceDisplay(featured.price, featured.salePrice, featured.hasVariants)
    : null;
  const featuredDiscount = getDiscount(featured?.price, featuredPriceDisplay?.comparePrice, featuredPriceDisplay?.isContactPrice);

  return (
    <section className="py-10 md:py-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader brandColor={brandColor} secondary={secondary} subTitle={subTitle} sectionTitle={sectionTitle} showViewAll={showViewAll} />
        
        {/* Bento Grid - Desktop */}
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-4 h-auto">
          {/* Hero Item (Span 2x2) */}
          <Link 
            href={getProductDetailHref(featured)}
            className="col-span-2 row-span-2 relative group rounded-2xl overflow-hidden cursor-pointer min-h-[400px] border border-transparent hover:border-slate-300 transition-colors"
            style={{ ...imageAspectRatioStyle, backgroundColor: `${secondary}10` }}
          >
            {featured?.image ? (
              <Image
                mode="thumb"
                src={featured.image}
                alt={featured.name}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100">
                <Package size={64} className="text-slate-300" />
              </div>
            )}
            <ProductImageFrameOverlay frame={frame} />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            {/* Discount Badge */}
            {featuredDiscount && (
              <div className="absolute top-4 right-4">
                <SaleBadge text={featuredDiscount} className="text-sm px-3 py-1" />
              </div>
            )}

            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
              <h3 className="text-2xl md:text-4xl font-bold mb-3 leading-tight text-white">{featured?.name}</h3>
              
              <div className="flex flex-row items-center justify-between gap-4 mt-2">
                <span className="text-2xl font-bold text-white">{featuredPriceDisplay?.label ?? ''}</span>
                
                <span className="rounded-full px-6 py-2 text-white border-0 shadow-lg" style={{ backgroundColor: brandColor, boxShadow: `0 4px 6px ${brandColor}20` }}>
                  Xem chi tiết
                </span>
              </div>
            </div>
          </Link>

          {/* Small Grid Items */}
          {others.slice(0, 4).map((product) => {
            const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
            const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
            return (
              <Link 
                key={product._id}
                href={getProductDetailHref(product)}
                className="col-span-1 row-span-1 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col group hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Image Area */}
                <div className="relative w-full rounded-xl overflow-hidden mb-3" style={{ ...imageAspectRatioStyle, backgroundColor: `${secondary}08` }}>
                  {product.image ? (
                    <Image
                      mode="thumb"
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 200px"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package size={32} className="text-slate-300" />
                    </div>
                  )}
                  <ProductImageFrameOverlay frame={frame} />
                  
                  {/* Discount Badge */}
                  {discount && (
                    <div className="absolute top-2 left-2">
                      <SaleBadge text={discount} className="text-[10px] px-1.5 py-0.5" />
                    </div>
                  )}

                  {/* Hover Action Button */}
                  <div className="absolute bottom-2 right-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="text-white p-2 rounded-full shadow-lg" style={{ backgroundColor: brandColor }}>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>

                {/* Info Area */}
                <div className="mt-auto px-1">
                  <h4 className="font-medium text-sm text-slate-900 truncate group-hover:opacity-80 transition-colors">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold" style={{ color: brandColor }}>{priceDisplay.label}</span>
                    {priceDisplay.comparePrice && (
                      <span className="text-[10px] text-slate-400 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile: 2x2 simple grid */}
        <div className="grid md:hidden grid-cols-2 gap-3">
        {products.slice(0, 4).map((product) => {
          const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
          const discount = getDiscount(product.price, priceDisplay.comparePrice, priceDisplay.isContactPrice);
            return (
              <Link key={product._id} href={getProductDetailHref(product)} className="group bg-white border border-slate-200 rounded-xl p-2 flex flex-col cursor-pointer hover:shadow-md transition-all">
                <div className="relative w-full rounded-lg bg-slate-100 overflow-hidden mb-2" style={imageAspectRatioStyle}>
                  {product.image ? (
                    <Image mode="thumb" src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 160px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>
                  )}
                  <ProductImageFrameOverlay frame={frame} />
                  {discount && (
                    <div className="absolute top-2 left-2">
                      <SaleBadge text={discount} className="text-[10px] px-1.5 py-0.5" />
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm text-slate-900 truncate group-hover:opacity-80 transition-colors">{product.name}</h4>
                <span className="text-sm font-bold mt-1" style={{ color: brandColor }}>{priceDisplay.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
