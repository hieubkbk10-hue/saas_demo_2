'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, Plus, Shield, ZoomIn } from 'lucide-react';
import { BrandBadge } from '@/components/site/shared/BrandColorHelpers';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { TrustBadgesStyle } from '../_types';
import { getGalleryColorTokens } from '../_lib/colors';

// Best Practices: Grayscale-to-color hover, lightbox/zoom indicator, verification links, alt text accessibility
interface TrustBadgeItem { id: number; url: string; link: string; name?: string }
export interface TrustBadgesConfig { heading?: string; subHeading?: string; buttonText?: string; buttonLink?: string }

// Auto Scroll Slider cho Marquee style
const TrustBadgesAutoScroll = ({ children, speed = 0.6 }: { children: React.ReactNode; speed?: number }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const baseTrackRef = React.useRef<HTMLDivElement>(null);
  const [baseTrackWidth, setBaseTrackWidth] = React.useState(0);
  const [repeatCount, setRepeatCount] = React.useState(2);

  React.useEffect(() => {
    const scroller = scrollRef.current;
    const baseTrack = baseTrackRef.current;
    if (!scroller || !baseTrack) {return;}

    const updateMetrics = () => {
      const viewportWidth = scroller.clientWidth;
      const nextBaseWidth = baseTrack.scrollWidth;

      if (viewportWidth <= 1 || nextBaseWidth <= 1) {
        setBaseTrackWidth(0);
        setRepeatCount(2);
        return;
      }

      const nextRepeatCount = Math.max(2, Math.ceil(viewportWidth / nextBaseWidth) + 1);
      setRepeatCount(nextRepeatCount);
      setBaseTrackWidth(nextBaseWidth);
    };

    updateMetrics();

    const cleanupHandlers: Array<() => void> = [];

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateMetrics);
      observer.observe(scroller);
      observer.observe(baseTrack);
      cleanupHandlers.push(() =>{  observer.disconnect(); });
    }

    window.addEventListener('resize', updateMetrics);
    cleanupHandlers.push(() =>{  window.removeEventListener('resize', updateMetrics); });

    return () => {
      cleanupHandlers.forEach((cleanup) =>{  cleanup(); });
    };
  }, [children]);

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) {return;}

    let animationId: number;
    let position = scroller.scrollLeft;

    const step = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const resetPoint = Math.min(baseTrackWidth, maxScrollLeft);

      if (resetPoint > 1 && maxScrollLeft > 1) {
        position += speed;
        if (position >= resetPoint) {
          position -= resetPoint;
        }
        scroller.scrollLeft = position;
      } else {
        position = scroller.scrollLeft;
      }

      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () =>{  cancelAnimationFrame(animationId); };
  }, [baseTrackWidth, speed]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div
        ref={scrollRef}
        className="flex overflow-hidden select-none w-full cursor-grab active:cursor-grabbing"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
        }}
      >
        {Array.from({ length: repeatCount }).map((_, index) => (
          <div
            key={`trust-badge-track-${index}`}
            ref={index === 0 ? baseTrackRef : undefined}
            className="flex shrink-0 gap-16 md:gap-20 items-center px-4"
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};

export const TrustBadgesPreview = ({ 
  items, 
  brandColor, 
  secondary,
  mode,
  selectedStyle, 
  onStyleChange,
  config,
  fontStyle,
  fontClassName,
}: { 
  items: TrustBadgeItem[]; 
  brandColor: string;
  secondary: string; 
  mode: 'single' | 'dual';
  selectedStyle?: TrustBadgesStyle; 
  onStyleChange?: (style: TrustBadgesStyle) => void;
  config?: TrustBadgesConfig;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const colors = getGalleryColorTokens({ primary: brandColor, secondary, mode });
  const previewStyle = selectedStyle ?? 'cards';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as TrustBadgesStyle);
  
  const styles = [
    { id: 'grid', label: 'Grid' }, 
    { id: 'cards', label: 'Cards' }, 
    { id: 'marquee', label: 'Marquee' },
    { id: 'wall', label: 'Wall' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'featured', label: 'Featured' }
  ];

  // Config values with defaults
  const heading = config?.heading ?? 'Chứng nhận & Giải thưởng';
  const subHeading = config?.subHeading ?? 'Được công nhận bởi các tổ chức uy tín';

  // Max visible items pattern
  const MAX_VISIBLE = device === 'mobile' ? 4 : 8;
  const visibleItems = items.slice(0, MAX_VISIBLE);
  const remainingCount = items.length - MAX_VISIBLE;

  // Empty State Component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.placeholderBg }}>
        <Shield size={36} style={{ color: colors.placeholderIcon }} />
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Chưa có chứng nhận</h3>
      <p className="text-sm text-slate-500 max-w-xs">Thêm chứng nhận, giải thưởng hoặc badge để tăng độ tin cậy</p>
    </div>
  );

  // Section Header Component
  const SectionHeader = ({ centered = true }: { centered?: boolean }) => (
    <div className={cn("mb-8 md:mb-10", centered && "text-center")}>
      {subHeading && (
        <div className="mb-3">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: colors.neutralSurface,
              borderColor: colors.neutralBorder,
              color: colors.subheading,
            }}
          >
            {subHeading}
          </span>
        </div>
      )}
      <h2
        className={cn(
          "font-bold text-slate-900 dark:text-slate-100",
          device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
        )}
        style={{ color: colors.heading }}
      >
        <span
          className="inline-block rounded-md px-2 py-1"
          style={{ backgroundColor: colors.neutralSurface }}
        >
          {heading}
        </span>
      </h2>
      <div className={cn("mt-3 h-1 w-12 rounded-full", centered ? "mx-auto" : "")}
        style={{ backgroundColor: colors.sectionAccentBar }}
      />
    </div>
  );

  // +N More Items Badge
  const MoreItemsBadge = ({ count }: { count: number }) => count > 0 ? (
    <div className="flex items-center justify-center py-4 mt-4">
      <span className="text-sm font-medium px-4 py-2 rounded-full" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}>
        +{count} chứng nhận khác
      </span>
    </div>
  ) : null;

  // Style 1: Square Grid - Full color, with zoom icon
  const renderGridStyle = () => (
    <section className={cn("w-full bg-white dark:bg-slate-900", device === 'mobile' ? 'py-8 px-3' : 'py-12 px-6')}>
      <div className="container max-w-7xl mx-auto">
        <SectionHeader />
        {items.length === 0 ? <EmptyState /> : (
          <>
            <div className={cn(
              "grid gap-4 md:gap-5",
              device === 'mobile' ? 'grid-cols-2' : (device === 'tablet' ? 'grid-cols-3' : 'grid-cols-4')
            )}>
              {visibleItems.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200"
                  style={{ 
                    border: `1px solid ${colors.neutralBorder}`,
                    backgroundColor: colors.neutralSurface,
                    padding: device === 'mobile' ? '16px' : '20px'
                  }}
                >
                  {item.url ? (
                    <PreviewImage src={item.url} className="w-full h-full object-contain transition-transform duration-300" alt={item.name ?? 'Chứng nhận'} />
                  ) : (
                    <ImageIcon size={device === 'mobile' ? 32 : 40} className="text-slate-300" />
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.badgeBg }}>
                      <Maximize2 size={14} style={{ color: colors.badgeText }} />
                    </div>
                  </div>
                  {item.name && (
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate block">{item.name}</span>
                    </div>
                  )}
                </div>
              ))}
              {remainingCount > 0 && (
                <div 
                  className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer"
                  style={{ backgroundColor: colors.accentSurface, border: `1px dashed ${colors.accentBorder}` }}
                >
                  <Plus size={28} style={{ color: colors.subheading }} className="mb-1" />
                  <span className="text-lg font-bold" style={{ color: colors.subheading }}>+{remainingCount}</span>
                  <span className="text-[10px]" style={{ color: colors.mutedText }}>xem thêm</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );

  // Style 2: Feature Cards - Large cards with image and title, hover zoom effect
  const renderCardsStyle = () => {
    const cardItems = items.slice(0, device === 'mobile' ? 2 : 3);
    const cardRemaining = items.length - cardItems.length;
    return (
      <section className={cn("w-full bg-white dark:bg-slate-900", device === 'mobile' ? 'py-8 px-3' : 'py-12 px-6')}>
        <div className="container max-w-7xl mx-auto">
          <SectionHeader />
          {items.length === 0 ? <EmptyState /> : (
            <>
              <div className={cn(
                "grid gap-5 md:gap-6",
                device === 'mobile' ? 'grid-cols-1' : (device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')
              )}>
                {cardItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer h-full transition-colors duration-200"
                    style={{ border: `1px solid ${colors.neutralBorder}`, backgroundColor: colors.neutralSurface }}
                  >
                    <div className={cn("flex items-center justify-center relative overflow-hidden", device === 'mobile' ? 'aspect-[4/3] p-6' : 'aspect-[5/4] p-10')} style={{ backgroundColor: colors.neutralBackground }}>
                      {item.url ? (
                        <PreviewImage src={item.url} className="w-full h-full object-contain transition-transform duration-500 z-10" alt={item.name ?? 'Chứng nhận'} />
                      ) : (
                        <ImageIcon size={48} className="text-slate-300" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <span className="px-4 py-2 rounded-full font-medium flex items-center gap-2 text-sm" style={{ color: colors.subheading, backgroundColor: colors.neutralSurface, border: `1px solid ${colors.sectionAccentBar}` }}>
                          <ZoomIn size={16} /> Xem chi tiết
                        </span>
                      </div>
                    </div>
                    <div className={cn("border-t flex items-center justify-between transition-colors", device === 'mobile' ? 'py-3 px-4 min-h-[48px]' : 'py-4 px-5')} style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}>
                      <span className="font-semibold truncate text-sm" style={{ color: colors.subheading }}>
                        {item.name ?? 'Chứng nhận'}
                      </span>
                      <ArrowUpRight size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.subheading }} />
                    </div>
                  </div>
                ))}
              </div>
              <MoreItemsBadge count={cardRemaining} />
            </>
          )}
        </div>
      </section>
    );
  };

  // Style 3: Marquee - Auto scroll slider with tooltip
  const renderMarqueeStyle = () => (
    <section
      className={cn("w-full border-y", device === 'mobile' ? 'py-10' : 'py-14')}
      style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}
    >
      <div className="container max-w-7xl mx-auto px-4 mb-8 text-center">
        <SectionHeader />
      </div>
      {items.length === 0 ? <EmptyState /> : (
        <TrustBadgesAutoScroll speed={0.6}>
          {items.map((item) => (
            <div 
              key={item.id} 
              className={cn("w-auto flex items-center justify-center px-4 transition-colors duration-200 cursor-pointer relative group", device === 'mobile' ? 'h-20' : 'h-24 md:h-28')}
            >
              {item.url ? (
                <PreviewImage src={item.url} className="h-full w-auto object-contain max-w-[200px] transition-transform" alt={item.name ?? 'Chứng nhận'} />
              ) : (
                <div className="h-16 w-28 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                  <ImageIcon size={28} className="text-slate-400" />
                </div>
              )}
              {item.name && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <BrandBadge text={item.name} variant="solid" brandColor={brandColor} secondary={secondary} />
                </div>
              )}
            </div>
          ))}
        </TrustBadgesAutoScroll>
      )}
    </section>
  );

  // Style 4: Framed Wall - Certificate frames hanging on wall
  const renderWallStyle = () => {
    const wallItems = items.slice(0, device === 'mobile' ? 4 : 6);
    const wallRemaining = items.length - wallItems.length;
    return (
      <section className={cn("w-full", device === 'mobile' ? 'py-10 px-3' : 'py-12 px-6')} style={{ backgroundColor: colors.neutralBackground }}>
        <div className="container max-w-7xl mx-auto">
          <SectionHeader />
          {items.length === 0 ? <EmptyState /> : (
            <>
              <div className={cn(
                "grid gap-4 md:gap-6 justify-items-center",
                device === 'mobile' ? 'grid-cols-2' : 'grid-cols-3'
              )}>
                {wallItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "group relative rounded-sm flex flex-col cursor-pointer transition-colors duration-200",
                      device === 'mobile' ? 'w-[140px] h-[180px] p-2' : 'w-[160px] h-[210px] p-3'
                    )}
                    style={{ border: `1px solid ${colors.neutralBorder}`, backgroundColor: colors.neutralSurface }}
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-1 h-10 bg-slate-300"></div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }}></div>
                    <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden" style={{ backgroundColor: colors.neutralBackground, border: `1px solid ${colors.neutralBorder}` }}>
                      {item.url ? (
                        <PreviewImage src={item.url} className="w-full h-full object-contain" alt={item.name ?? 'Chứng nhận'} />
                      ) : (
                        <ImageIcon size={28} className="text-slate-300" />
                      )}
                    </div>
                    <div className={cn("flex items-center justify-center", device === 'mobile' ? 'h-7 mt-1' : 'h-8 mt-1')}>
                      <span className={cn("font-semibold uppercase tracking-wider text-center truncate px-1", device === 'mobile' ? 'text-[8px]' : 'text-[9px]')} style={{ color: colors.subheading }}>
                        {item.name ? (item.name.length > 18 ? item.name.slice(0, 16) + '...' : item.name) : 'Certificate'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <MoreItemsBadge count={wallRemaining} />
            </>
          )}
        </div>
      </section>
    );
  };

  // Style 5: Carousel - Horizontal scroll với navigation arrows
  const renderCarouselStyle = () => {
    const itemsPerView = device === 'mobile' ? 2 : (device === 'tablet' ? 3 : 4);
    const maxIndex = Math.max(0, items.length - itemsPerView);
    return (
      <section className={cn("w-full bg-white dark:bg-slate-900", device === 'mobile' ? 'py-8 px-3' : 'py-12 px-6')}>
        <div className="container max-w-7xl mx-auto">
          <SectionHeader />
          {items.length === 0 ? <EmptyState /> : (
            <div className="relative">
              {items.length > itemsPerView && (
                <>
                  <button
                    onClick={() =>{  setCarouselIndex(Math.max(0, carouselIndex - 1)); }}
                    disabled={carouselIndex === 0}
                    className={cn("absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors", carouselIndex === 0 ? 'opacity-40 cursor-not-allowed' : '')}
                    style={{ border: `1px solid ${colors.sectionAccentBar}`, left: device === 'mobile' ? '-4px' : '-16px', backgroundColor: colors.neutralSurface }}
                  >
                    <ChevronLeft size={20} style={{ color: colors.heading }} />
                  </button>
                  <button
                    onClick={() =>{  setCarouselIndex(Math.min(maxIndex, carouselIndex + 1)); }}
                    disabled={carouselIndex >= maxIndex}
                    className={cn("absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors", carouselIndex >= maxIndex ? 'opacity-40 cursor-not-allowed' : '')}
                    style={{ border: `1px solid ${colors.sectionAccentBar}`, right: device === 'mobile' ? '-4px' : '-16px', backgroundColor: colors.neutralSurface }}
                  >
                    <ChevronRight size={20} style={{ color: colors.heading }} />
                  </button>
                </>
              )}
              <div className={cn("overflow-hidden", device === 'mobile' ? 'mx-2' : 'mx-6')}>
                <div className="flex transition-transform duration-300 ease-out gap-4" style={{ transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)` }}>
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex-shrink-0 group cursor-pointer"
                      style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 16 / itemsPerView}px)` }}
                    >
                      <div 
                        className="aspect-square rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{ backgroundColor: colors.neutralBackground, border: `1px solid ${colors.neutralBorder}`, padding: device === 'mobile' ? '12px' : '16px' }}
                      >
                        {item.url ? (
                          <PreviewImage src={item.url} className="w-full h-full object-contain transition-transform duration-300" alt={item.name ?? 'Chứng nhận'} />
                        ) : (
                          <ImageIcon size={32} className="text-slate-300" />
                        )}
                      </div>
                      {item.name && (
                        <p className="text-center text-xs font-medium text-slate-500 mt-2 truncate px-1">{item.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {items.length > itemsPerView && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                    <button key={idx} onClick={() =>{  setCarouselIndex(idx); }} className={cn("h-2 rounded-full transition-all", carouselIndex === idx ? 'w-6' : 'w-2')} style={{ backgroundColor: carouselIndex === idx ? colors.subheading : colors.neutralBorder }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  // Style 6: Featured - 1 item nổi bật + grid nhỏ bên dưới
  const renderFeaturedStyle = () => {
    const featuredItem = items[0];
    const otherItems = items.slice(1, device === 'mobile' ? 5 : 7);
    const featuredRemaining = items.length - 1 - otherItems.length;
    return (
      <section className={cn("w-full bg-white dark:bg-slate-900", device === 'mobile' ? 'py-8 px-3' : 'py-12 px-6')}>
        <div className="container max-w-7xl mx-auto">
          <SectionHeader />
          {items.length === 0 ? <EmptyState /> : (
            <div className={cn("grid gap-5", device === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
              {featuredItem && (
                <div 
                  className="group cursor-pointer rounded-2xl overflow-hidden transition-colors duration-200"
                  style={{ backgroundColor: colors.iconBg, border: `1px solid ${colors.sectionAccentBar}` }}
                >
                  <div className={cn("flex items-center justify-center relative", device === 'mobile' ? 'aspect-[4/3] p-6' : 'aspect-[4/3] p-10')}>
                    {featuredItem.url ? (
                      <PreviewImage src={featuredItem.url} className="w-full h-full object-contain transition-transform duration-500" alt={featuredItem.name ?? 'Chứng nhận nổi bật'} />
                    ) : (
                      <ImageIcon size={64} className="text-slate-300" />
                    )}
                    <div className="absolute top-3 left-3">
                      <BrandBadge text="NỔI BẬT" variant="solid" brandColor={brandColor} secondary={secondary} />
                    </div>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ color: colors.subheading, backgroundColor: colors.neutralSurface, border: `1px solid ${colors.neutralBorder}` }}>
                        <ZoomIn size={20} />
                      </div>
                    </div>
                  </div>
                  <div className={cn("border-t flex items-center justify-center", device === 'mobile' ? 'py-3 min-h-[48px]' : 'py-4')} style={{ borderColor: colors.neutralBorder }}>
                    <span className="font-bold text-base" style={{ color: colors.heading }}>
                      {featuredItem.name ?? 'Chứng nhận nổi bật'}
                    </span>
                  </div>
                </div>
              )}
              <div className={cn("grid gap-3", device === 'mobile' ? 'grid-cols-2' : 'grid-cols-3')}>
                {otherItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="group aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200"
                    style={{ backgroundColor: colors.neutralBackground, border: `1px solid ${colors.neutralBorder}`, padding: device === 'mobile' ? '10px' : '12px' }}
                  >
                    {item.url ? (
                      <PreviewImage src={item.url} className="w-full h-full object-contain transition-transform duration-300" alt={item.name ?? 'Chứng nhận'} />
                    ) : (
                      <ImageIcon size={24} className="text-slate-300" />
                    )}
                  </div>
                ))}
                {featuredRemaining > 0 && (
                  <div 
                    className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer"
                    style={{ backgroundColor: colors.accentSurface, border: `1px dashed ${colors.accentBorder}` }}
                  >
                    <Plus size={24} style={{ color: colors.subheading }} />
                    <span className="text-sm font-bold mt-1" style={{ color: colors.subheading }}>+{featuredRemaining}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  // Image Guidelines Component
  const renderImageGuidelines = () => (
    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-2">
        <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {previewStyle === 'grid' && (
            <p><strong>300×300px</strong> (1:1) • Ảnh vuông, nền trong suốt PNG.</p>
          )}
          {previewStyle === 'cards' && (
            <p><strong>400×320px</strong> (5:4) • Ảnh chứng nhận rõ ràng.</p>
          )}
          {previewStyle === 'marquee' && (
            <p><strong>200×120px</strong> (5:3) • Logo/badge nhỏ gọn, auto scroll, hover pause.</p>
          )}
          {previewStyle === 'wall' && (
            <p><strong>250×300px</strong> (5:6) • Khung ảnh dọc như bằng khen treo tường.</p>
          )}
          {previewStyle === 'carousel' && (
            <p><strong>280×280px</strong> (1:1) • Grid vuông, navigation arrows, responsive.</p>
          )}
          {previewStyle === 'featured' && (
            <p><strong>Featured: 600×450px</strong> (4:3) • <strong>Others: 200×200px</strong> (1:1) • 1 nổi bật + grid nhỏ.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PreviewWrapper 
        title="Preview Chứng nhận" 
        device={device} 
        setDevice={setDevice} 
        previewStyle={previewStyle} 
        setPreviewStyle={setPreviewStyle} 
        styles={styles} 
        info={`${items.length} chứng nhận • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {previewStyle === 'grid' && renderGridStyle()}
          {previewStyle === 'cards' && renderCardsStyle()}
          {previewStyle === 'marquee' && renderMarqueeStyle()}
          {previewStyle === 'wall' && renderWallStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'featured' && renderFeaturedStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      {mode === 'dual' ? <ColorInfoPanel brandColor={brandColor} secondary={secondary} /> : null}
      {renderImageGuidelines()}
    </>
  );
};
