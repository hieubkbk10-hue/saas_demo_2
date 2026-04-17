'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { BrandBadge, SaleBadge } from '@/components/site/shared/BrandColorHelpers';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { PRODUCT_LIST_STYLES } from '../_lib/constants';
import type { ProductListPreviewItem, ProductListStyle } from '../_types';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';

export const ProductListPreview = ({
  brandColor,
  secondary,
  itemCount,
  componentType,
  selectedStyle,
  onStyleChange,
  items,
  subTitle = 'Bộ sưu tập',
  sectionTitle,
  fontStyle,
  fontClassName,
}: {
  brandColor: string;
  secondary: string;
  itemCount: number;
  componentType: 'ProductList' | 'ServiceList' | 'ProductGrid';
  selectedStyle?: ProductListStyle;
  onStyleChange?: (style: ProductListStyle) => void;
  items?: ProductListPreviewItem[];
  subTitle?: string;
  sectionTitle?: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const displayTitle = sectionTitle ?? (componentType === 'ServiceList' ? 'Dịch vụ nổi bật' : 'Sản phẩm nổi bật');
  const buttonText = 'Xem tất cả';
  const { device, setDevice } = usePreviewDevice();
  const previewStyle = selectedStyle ?? 'commerce';
  const setPreviewStyle = (style: string) => onStyleChange?.(style as ProductListStyle);
  const isProduct = componentType !== 'ServiceList';
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const imageAspectRatio = React.useMemo(
    () => resolveProductImageAspectRatio(aspectRatioSetting?.value),
    [aspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = React.useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );

  const mockProducts: ProductListPreviewItem[] = [
    { category: 'Smartphone', id: 1, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop&q=80', name: 'iPhone 15 Pro Max', originalPrice: '36.990.000đ', price: '34.990.000đ', tag: 'new' },
    { category: 'Laptop', id: 2, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&h=500&fit=crop&q=80', name: 'MacBook Pro M3', price: '45.990.000đ' },
    { category: 'Audio', id: 3, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&h=500&fit=crop&q=80', name: 'Sony WH-1000XM5', originalPrice: '9.290.000đ', price: '8.490.000đ', tag: 'sale' },
    { category: 'Wearable', id: 4, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop&q=80', name: 'Apple Watch Ultra 2', price: '21.990.000đ', tag: 'new' },
    { category: 'Tablet', id: 5, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&q=80', name: 'iPad Air 5 M1', originalPrice: '16.500.000đ', price: '14.990.000đ', tag: 'sale' },
    { category: 'Audio', id: 6, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&h=500&fit=crop&q=80', name: 'Marshall Stanmore III', price: '9.890.000đ' },
    { category: 'Accessories', id: 7, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&h=500&fit=crop&q=80', name: 'Logitech MX Master 3S', price: '2.490.000đ' },
    { category: 'Camera', id: 8, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop&q=80', name: 'Fujifilm X-T5', originalPrice: '45.000.000đ', price: '42.990.000đ', tag: 'hot' }
  ];

  const displayItems: ProductListPreviewItem[] = items && items.length > 0
    ? items
    : mockProducts.slice(0, Math.max(itemCount, 8));

  const getDiscount = (price?: string, originalPrice?: string) => {
    if (!price || !originalPrice) {return null;}
    const parsedPrice = Number.parseInt(price.replaceAll(/\D/g, ''));
    const parsedOriginal = Number.parseInt(originalPrice.replaceAll(/\D/g, ''));
    if (parsedOriginal <= parsedPrice) {return null;}
    return `-${Math.round(((parsedOriginal - parsedPrice) / parsedOriginal) * 100)}%`;
  };

  const renderMinimalStyle = () => (
    <section className={cn("py-8 md:py-10", device === 'mobile' ? 'px-3' : 'px-4 md:px-6')}>
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-10">
        <div className="flex items-end justify-between w-full md:w-auto">
          <div className="space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
              <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
              {subTitle}
            </div>
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-2xl md:text-4xl')} style={{ color: brandColor }}>
              {displayTitle}
            </h2>
          </div>
          <button className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center" style={{ color: brandColor }}>
            {buttonText} <ArrowRight size={16} />
          </button>
        </div>
        <button className="hidden md:flex gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 pl-6 border-l border-slate-200 dark:border-slate-700 transition-colors items-center" style={{ color: brandColor }}>
          {buttonText} <ArrowRight size={16} />
        </button>
      </div>

      <div className={cn(
        "grid gap-x-6 gap-y-10",
        device === 'mobile' ? 'grid-cols-2 gap-x-3 gap-y-6' : (device === 'tablet' ? 'grid-cols-3' : 'grid-cols-4')
      )}>
        {displayItems.slice(0, device === 'mobile' ? 4 : 4).map((item) => {
          const discount = getDiscount(item.price, item.originalPrice);
          return (
            <div key={item.id} className="group cursor-pointer">
              <div
                className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4 border border-transparent transition-all"
                style={{ ...imageAspectRatioStyle, '--hover-border': `${secondary}20` } as React.CSSProperties}
              >
                {item.image ? (
                  <PreviewImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package size={48} className="text-slate-300" />
                  </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {discount && (
                    <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                  )}
                  {item.tag === 'new' && !discount && (
                    <BrandBadge text="NEW" variant="outline" brandColor={secondary} secondary={secondary} className="text-[10px] px-2 py-1" />
                  )}
                  {item.tag === 'hot' && !discount && (
                    <BrandBadge text="HOT" variant="solid" brandColor={brandColor} secondary={secondary} className="text-[10px] px-2 py-1" />
                  )}
                </div>

                <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                  <button className="w-full bg-white/95 hover:bg-white backdrop-blur-md shadow-lg border-0 font-bold py-2 px-4 rounded-lg text-sm" style={{ color: brandColor }}>
                    Xem chi tiết
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 text-base truncate group-hover:opacity-80 transition-colors">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100" style={{ color: brandColor }}>{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {item.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderCommerceStyle = () => (
    <section className={cn("py-8 md:py-10", device === 'mobile' ? 'px-3' : 'px-4 md:px-6')}>
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-10">
        <div className="flex items-end justify-between w-full md:w-auto">
          <div className="space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
              <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
              {subTitle}
            </div>
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-2xl md:text-4xl')} style={{ color: brandColor }}>
              {displayTitle}
            </h2>
          </div>
          <button className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center" style={{ color: brandColor }}>
            {buttonText} <ArrowRight size={16} />
          </button>
        </div>
        <button className="hidden md:flex gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 pl-6 border-l border-slate-200 dark:border-slate-700 transition-colors items-center" style={{ color: brandColor }}>
          {buttonText} <ArrowRight size={16} />
        </button>
      </div>

      <div className={cn(
        "grid gap-6",
        device === 'mobile' ? 'grid-cols-1 sm:grid-cols-2 gap-4' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-4')
      )}>
        {displayItems.slice(0, device === 'mobile' ? 4 : 4).map((item) => {
          const discount = getDiscount(item.price, item.originalPrice);
          return (
            <div
              key={item.id}
              className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              style={{ '--hover-border': `${secondary}30`, '--hover-shadow': `0 10px 15px -3px ${secondary}10` } as React.CSSProperties}
            >
              <div className="relative bg-slate-100 dark:bg-slate-700 overflow-hidden" style={imageAspectRatioStyle}>
                {item.image ? (
                  <PreviewImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package size={40} className="text-slate-300" />
                  </div>
                )}
                {discount && (
                  <div className="absolute top-2 right-2">
                    <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1 group-hover:opacity-80 transition-colors cursor-pointer">
                  {item.name}
                </h3>

                <div className="flex items-baseline gap-2 mb-4 mt-auto pt-2">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:opacity-80 transition-colors" style={{ color: brandColor }}>{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {item.originalPrice}
                    </span>
                  )}
                </div>

                <button
                  className="w-full gap-1.5 md:gap-2 border-2 py-1.5 md:py-2 px-2 md:px-4 rounded-lg font-medium flex items-center justify-center transition-colors whitespace-nowrap text-xs md:text-sm"
                  style={{ borderColor: `${brandColor}20`, color: brandColor }}
                  onMouseEnter={(event) => { event.currentTarget.style.borderColor = brandColor; event.currentTarget.style.backgroundColor = `${brandColor}08`; }}
                  onMouseLeave={(event) => { event.currentTarget.style.borderColor = `${brandColor}20`; event.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Xem chi tiết
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderBentoStyle = () => {
    const featured = displayItems[displayItems.length > 7 ? 7 : displayItems.length - 1] || displayItems[0];
    const others = displayItems.slice(0, 4);
    const discount = getDiscount(featured?.price, featured?.originalPrice);

    return (
      <section className={cn("py-8 md:py-10", device === 'mobile' ? 'px-3' : 'px-4 md:px-6')}>
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-10">
          <div className="flex items-end justify-between w-full md:w-auto">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
                <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
                {subTitle}
              </div>
              <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-2xl md:text-4xl')}>
                {displayTitle}
              </h2>
            </div>
            <button className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center" style={{ color: brandColor }}>
              {buttonText} <ArrowRight size={16} />
            </button>
          </div>
          <button className="hidden md:flex gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 pl-6 border-l border-slate-200 dark:border-slate-700 transition-colors items-center" style={{ color: brandColor }}>
            {buttonText} <ArrowRight size={16} />
          </button>
        </div>

        {device === 'mobile' ? (
          <div className="grid grid-cols-2 gap-3">
            {others.slice(0, 4).map((item) => {
              const itemDiscount = getDiscount(item.price, item.originalPrice);
              return (
                <div key={item.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col cursor-pointer hover:shadow-md transition-all">
                  <div className="relative w-full rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden mb-2" style={imageAspectRatioStyle}>
                    {item.image ? (
                      <PreviewImage src={item.image} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" alt={item.name} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>
                    )}
                    {itemDiscount && (
                      <div className="absolute top-2 left-2">
                        <SaleBadge text={itemDiscount} className="text-[10px] px-1.5 py-0.5" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate group-hover:opacity-80 transition-colors">{item.name}</h4>
                  <span className="text-sm font-bold mt-1" style={{ color: brandColor }}>{item.price}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cn(
            "grid gap-4 h-auto",
            device === 'tablet' ? 'grid-cols-3 grid-rows-2' : 'grid-cols-4 grid-rows-2'
          )}>
            <div className="col-span-2 row-span-2 relative group rounded-2xl overflow-hidden cursor-pointer min-h-[400px] border border-transparent transition-colors" style={{ '--hover-border': `${secondary}50`, backgroundColor: `${secondary}10` } as React.CSSProperties}>
              {featured?.image ? (
                <PreviewImage
                  src={featured.image}
                  alt={featured.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Package size={64} className="text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {discount && (
                <div className="absolute top-4 right-4">
                  <SaleBadge text={discount} className="text-sm px-3 py-1" />
                </div>
              )}

              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <h3 className="text-2xl md:text-4xl font-bold mb-3 leading-tight text-white">{featured?.name}</h3>

                <div className="flex flex-row items-center justify-between gap-4 mt-2">
                  <span className="text-2xl font-bold text-white">{featured?.price}</span>

                  <button className="rounded-full px-6 py-2 text-white border-0 shadow-lg transition-all hover:scale-105" style={{ backgroundColor: brandColor, boxShadow: `0 4px 6px ${brandColor}20` }}>
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>

            {others.slice(0, 4).map((item) => {
              const itemDiscount = getDiscount(item.price, item.originalPrice);
              return (
                <div
                  key={item.id}
                  className="col-span-1 row-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex flex-col group hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                  style={{ '--hover-border': `${secondary}40` } as React.CSSProperties}
                >
                  <div className="relative w-full rounded-xl overflow-hidden mb-3" style={{ ...imageAspectRatioStyle, backgroundColor: `${secondary}08` }}>
                    {item.image ? (
                      <PreviewImage
                        src={item.image}
                        className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                        alt={item.name}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package size={32} className="text-slate-300" />
                      </div>
                    )}

                    {itemDiscount && (
                      <div className="absolute top-2 left-2">
                        <SaleBadge text={itemDiscount} className="text-[10px] px-1.5 py-0.5" />
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="text-white p-2 rounded-full shadow-lg" style={{ backgroundColor: secondary }}>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto px-1">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate group-hover:opacity-80 transition-colors">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold" style={{ color: brandColor }}>
                        {item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through opacity-70">
                          {item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const renderCarouselStyle = () => (
    <section className={cn("py-8 md:py-10", device === 'mobile' ? 'px-3' : 'px-4 md:px-6')}>
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-8">
        <div className="flex items-end justify-between w-full md:w-auto">
          <div className="space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
              <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
              {subTitle}
            </div>
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-2xl md:text-4xl')}>
              {displayTitle}
            </h2>
          </div>
          <div className="flex gap-2 md:hidden">
            <button className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronLeft size={16} style={{ color: brandColor }} />
            </button>
            <button className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronRight size={16} style={{ color: brandColor }} />
            </button>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={18} style={{ color: brandColor }} />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors" style={{ backgroundColor: brandColor }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden -mx-3 md:-mx-4 px-3 md:px-4">
        <div className={cn("flex gap-4", device === 'mobile' ? 'gap-3' : 'gap-5')}>
          {displayItems.slice(0, 6).map((item) => {
            const discount = getDiscount(item.price, item.originalPrice);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex-shrink-0 group cursor-pointer",
                  device === 'mobile' ? 'w-[160px]' : (device === 'tablet' ? 'w-[220px]' : 'w-[260px]')
                )}
              >
              <div
                  className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 mb-3 border border-transparent transition-all"
                  onMouseEnter={(event) => { event.currentTarget.style.borderColor = `${secondary}20`; }}
                  onMouseLeave={(event) => { event.currentTarget.style.borderColor = 'transparent'; }}
                  style={imageAspectRatioStyle}
                >
                  {item.image ? (
                    <PreviewImage src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Package size={40} className="text-slate-300" /></div>
                  )}
                  {discount && (
                    <div className="absolute top-2 left-2">
                      <SaleBadge text={discount} className="text-[10px] px-2 py-1" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate group-hover:opacity-80 transition-colors">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-sm" style={{ color: brandColor }}>{item.price}</span>
                  {item.originalPrice && <span className="text-xs text-slate-400 line-through">{item.originalPrice}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <button key={i} className={cn("h-2 rounded-full transition-all", i === 0 ? "w-6" : "w-2 bg-slate-200 dark:bg-slate-700")} style={i === 0 ? { backgroundColor: brandColor } : {}} />
        ))}
      </div>
    </section>
  );

  const renderCompactStyle = () => (
    <section className={cn("py-8 md:py-10", device === 'mobile' ? 'px-3' : 'px-4 md:px-6')}>
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-8">
        <div className="flex items-end justify-between w-full md:w-auto">
          <div className="space-y-1 md:space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
              <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
              {subTitle}
            </div>
            <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-2xl md:text-4xl')}>
              {displayTitle}
            </h2>
          </div>
          <button className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center" style={{ color: brandColor }}>
            {buttonText} <ArrowRight size={16} />
          </button>
        </div>
        <button className="hidden md:flex gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 pl-6 border-l border-slate-200 dark:border-slate-700 transition-colors items-center" style={{ color: brandColor }}>
          {buttonText} <ArrowRight size={16} />
        </button>
      </div>

      <div className={cn(
        "grid gap-3",
        device === 'mobile' ? 'grid-cols-2' : (device === 'tablet' ? 'grid-cols-4' : 'grid-cols-6')
      )}>
        {displayItems.slice(0, device === 'mobile' ? 6 : 6).map((item) => {
          const discount = getDiscount(item.price, item.originalPrice);
          return (
            <div
              key={item.id}
              className="group cursor-pointer bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 p-2 hover:shadow-md transition-all"
              onMouseEnter={(event) => { event.currentTarget.style.borderColor = `${secondary}20`; }}
              onMouseLeave={(event) => { event.currentTarget.style.borderColor = ''; }}
            >
              <div className="relative overflow-hidden rounded-md bg-slate-50 dark:bg-slate-700 mb-2" style={imageAspectRatioStyle}>
                {item.image ? (
                  <PreviewImage src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>
                )}
                {discount && (
                  <div className="absolute top-1 left-1">
                    <SaleBadge text={discount} className="text-[9px] px-1.5 py-0.5" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate group-hover:opacity-80 transition-colors">{item.name}</h3>
              <span className="font-bold text-xs mt-0.5 block" style={{ color: brandColor }}>{item.price}</span>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderShowcaseStyle = () => {
    const showcaseFeatured = displayItems[0];
    const showcaseOthers = displayItems.slice(1, 5);
    const featuredDiscount = getDiscount(showcaseFeatured?.price, showcaseFeatured?.originalPrice);

    return (
      <section className={cn("py-8 md:py-10", device === 'mobile' ? 'px-3' : 'px-4 md:px-6')}>
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between md:mb-8">
          <div className="flex items-end justify-between w-full md:w-auto">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-widest" style={{ color: secondary }}>
                <span className="w-6 h-[2px] md:w-8" style={{ backgroundColor: secondary }}></span>
                {subTitle}
              </div>
              <h2 className={cn("font-bold tracking-tight text-slate-900 dark:text-slate-100", device === 'mobile' ? 'text-2xl' : 'text-2xl md:text-4xl')}>
                {displayTitle}
              </h2>
            </div>
            <button className="md:hidden p-0 h-auto font-semibold mb-1 gap-1 flex items-center" style={{ color: brandColor }}>
              {buttonText} <ArrowRight size={16} />
            </button>
          </div>
          <button className="hidden md:flex gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 pl-6 border-l border-slate-200 dark:border-slate-700 transition-colors items-center" style={{ color: brandColor }}>
            {buttonText} <ArrowRight size={16} />
          </button>
        </div>

        {device === 'mobile' ? (
          <div className="grid grid-cols-2 gap-3">
            {displayItems.slice(0, 4).map((item) => {
              const discount = getDiscount(item.price, item.originalPrice);
              return (
                <div key={item.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col cursor-pointer hover:shadow-md transition-all">
                  <div className="relative w-full rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden mb-2" style={imageAspectRatioStyle}>
                    {item.image ? <PreviewImage src={item.image} className="h-full w-full object-cover" alt={item.name} /> : <div className="h-full w-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>}
                    {discount && (
                      <div className="absolute top-2 left-2">
                        <SaleBadge text={discount} className="text-[10px] px-1.5 py-0.5" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</h4>
                  <span className="text-sm font-bold mt-1" style={{ color: brandColor }}>{item.price}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cn("grid gap-4", device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')}>
            <div className="relative group rounded-2xl overflow-hidden cursor-pointer min-h-[400px] border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors" style={{ backgroundColor: `${secondary}05` }}>
              {showcaseFeatured?.image ? (
                <PreviewImage src={showcaseFeatured.image} alt={showcaseFeatured.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800"><Package size={64} className="text-slate-300" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {featuredDiscount && (
                <div className="absolute top-4 left-4">
                  <SaleBadge text={featuredDiscount} className="text-sm px-3 py-1" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <BrandBadge text="Nổi bật" variant="solid" brandColor={brandColor} secondary={secondary} className="mb-2" />
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">{showcaseFeatured?.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">{showcaseFeatured?.price}</span>
                  <button className="h-9 px-4 rounded-lg text-white text-sm font-medium shrink-0" style={{ backgroundColor: brandColor }}>Xem chi tiết</button>
                </div>
              </div>
            </div>

            <div className={cn("grid grid-cols-2 gap-3", device === 'desktop' && 'col-span-2')}>
              {showcaseOthers.map((item) => {
                const discount = getDiscount(item.price, item.originalPrice);
                return (
                  <div key={item.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                    <div className="relative w-full rounded-lg bg-slate-50 dark:bg-slate-700 overflow-hidden mb-3" style={imageAspectRatioStyle}>
                      {item.image ? <PreviewImage src={item.image} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" alt={item.name} /> : <div className="h-full w-full flex items-center justify-center"><Package size={32} className="text-slate-300" /></div>}
                      {discount && (
                        <div className="absolute top-2 left-2">
                          <SaleBadge text={discount} className="text-[10px] px-1.5 py-0.5" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate group-hover:opacity-80 transition-colors">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold" style={{ color: brandColor }}>{item.price}</span>
                      {item.originalPrice && <span className="text-[10px] text-slate-400 line-through">{item.originalPrice}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      <PreviewWrapper
        title={`Preview ${isProduct ? 'Sản phẩm' : 'Dịch vụ'}`}
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={PRODUCT_LIST_STYLES}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url={`yoursite.com/${isProduct ? 'products' : 'services'}`}>
          {previewStyle === 'minimal' && renderMinimalStyle()}
          {previewStyle === 'commerce' && renderCommerceStyle()}
          {previewStyle === 'bento' && renderBentoStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'compact' && renderCompactStyle()}
          {previewStyle === 'showcase' && renderShowcaseStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
    </>
  );
};
