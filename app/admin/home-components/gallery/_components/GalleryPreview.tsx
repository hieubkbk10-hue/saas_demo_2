'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Plus, X } from 'lucide-react';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getGalleryMarqueeBaseItems } from '../_lib/constants';
import type { GalleryItem, GalleryStyle } from '../_types';
import { getGalleryColorTokens } from '../_lib/colors';
import type { GalleryColorTokens, GalleryHarmony } from '../_lib/colors';

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>{  setPrefersReducedMotion(mediaQuery.matches); };

    update();
    mediaQuery.addEventListener('change', update);
    return () =>{  mediaQuery.removeEventListener('change', update); };
  }, []);

  return prefersReducedMotion;
};

// Lightbox Component for Gallery - with Arrow Keys Navigation
const GalleryLightbox = ({ 
  photo, 
  onClose,
  photos,
  currentIndex,
  onNavigate,
  colors,
}: { 
  photo: { url: string } | null; 
  onClose: () => void;
  photos?: { url: string }[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
  colors: GalleryColorTokens;
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
      if (e.key === 'ArrowLeft' && onNavigate) {onNavigate('prev');}
      if (e.key === 'ArrowRight' && onNavigate) {onNavigate('next');}
    };
    if (photo) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [photo, onClose, onNavigate]);

  if (!photo || !photo.url) {return null;}

  const hasMultiple = photos && photos.length > 1 && onNavigate;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950" onClick={onClose} />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full border transition-colors z-[70] hover:opacity-90"
        style={{
          backgroundColor: colors.lightboxControlBg,
          borderColor: colors.lightboxControlBorder,
          color: colors.lightboxControlIcon,
        }}
        aria-label="Đóng"
      >
        <X size={24} />
      </button>
      
      {/* Navigation Arrows */}
      {hasMultiple && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border flex items-center justify-center transition-all z-[70] hover:opacity-90"
            style={{
              backgroundColor: colors.lightboxControlBg,
              borderColor: colors.lightboxControlBorder,
              color: colors.lightboxControlIcon,
            }}
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border flex items-center justify-center transition-all z-[70] hover:opacity-90"
            style={{
              backgroundColor: colors.lightboxControlBg,
              borderColor: colors.lightboxControlBorder,
              color: colors.lightboxControlIcon,
            }}
            aria-label="Ảnh sau"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      
      {/* Counter with brand colors */}
      {hasMultiple && typeof currentIndex === 'number' && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium z-[70] px-3 py-1.5 rounded-full border"
          style={{
            backgroundColor: colors.lightboxCounterBg,
            color: colors.lightboxCounterText,
            borderColor: colors.lightboxControlBorder,
          }}
        >
          {currentIndex + 1} / {photos.length}
        </div>
      )}
      
      <div className="relative z-[70] max-w-5xl w-full max-h-[90vh] p-4 flex flex-col items-center justify-center" onClick={e =>{  e.stopPropagation(); }}>
        <PreviewImage 
          src={photo.url} 
          alt="Lightbox" 
          className="max-h-[90vh] max-w-full object-contain shadow-sm animate-in zoom-in-95 duration-300" 
        />
      </div>
    </div>
  );
};

export const GalleryPreview = ({ items, brandColor, secondary, mode, harmony, selectedStyle, onStyleChange, title, fontStyle, fontClassName }: {
  items: GalleryItem[];
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  harmony?: GalleryHarmony;
  selectedStyle?: GalleryStyle;
  onStyleChange?: (style: GalleryStyle) => void;
  title?: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}): React.ReactElement => {
  const { device, setDevice } = usePreviewDevice();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [isMarqueeInteractionPaused, setIsMarqueeInteractionPaused] = useState(false);
  const [marqueeRepeatCount, setMarqueeRepeatCount] = useState(2);
  const [marqueeBaseTrackWidth, setMarqueeBaseTrackWidth] = useState(0);
  const marqueeScrollRef = React.useRef<HTMLDivElement>(null);
  const marqueeBaseTrackRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const colors = getGalleryColorTokens({ primary: brandColor, secondary, mode, harmony });
  const ONE = 1;
  const NEGATIVE_ONE = -1;
  let previewStyle = selectedStyle;
  if (!previewStyle) {
    previewStyle = 'spotlight';
  }
  const layoutAccent = colors.sectionAccentBarByStyle[previewStyle] ?? colors.sectionAccentBar;
  const marqueeBaseItems = React.useMemo(() => getGalleryMarqueeBaseItems(items), [items]);
  const lightboxItems = previewStyle === 'marquee' ? marqueeBaseItems : items;

  React.useEffect(() => {
    if (previewStyle !== 'marquee') {return;}
    const scroller = marqueeScrollRef.current;
    const baseTrack = marqueeBaseTrackRef.current;
    if (!scroller || !baseTrack) {return;}

    const updateMetrics = () => {
      const nextBaseWidth = baseTrack.scrollWidth;
      const viewportWidth = scroller.clientWidth;
      if (nextBaseWidth <= 0 || viewportWidth <= 0) {return;}
      const nextRepeatCount = Math.max(2, Math.ceil(viewportWidth / nextBaseWidth) + 1);
      setMarqueeRepeatCount(nextRepeatCount);
      setMarqueeBaseTrackWidth(nextBaseWidth);
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
  }, [previewStyle, marqueeBaseItems]);

  React.useEffect(() => {
    if (previewStyle !== 'marquee') {return;}
    const scroller = marqueeScrollRef.current;
    if (!scroller) {return;}

    let animationId = 0;
    let position = scroller.scrollLeft;

    const step = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const resetPoint = Math.min(marqueeBaseTrackWidth, maxScrollLeft);

      if (!isMarqueeInteractionPaused && !prefersReducedMotion && resetPoint > 1 && maxScrollLeft > 1) {
        position += Math.max(0.5, marqueeBaseItems.length * 0.02);
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
  }, [previewStyle, isMarqueeInteractionPaused, prefersReducedMotion, marqueeBaseTrackWidth, marqueeBaseItems.length]);

  const setPreviewStyle = (styleKey: string): void => {
    if (onStyleChange) {
      onStyleChange(styleKey as GalleryStyle);
    }
  };

  // Lightbox navigation handler
  const handleLightboxNavigate = (direction: 'prev' | 'next'): void => {
    if (!selectedPhoto || lightboxItems.length === 0) {return;}
    const currentIdx = lightboxItems.findIndex(item => item.id === selectedPhoto.id);
    if (currentIdx === NEGATIVE_ONE) {return;}
    let newIdx = currentIdx + ONE;
    if (direction === 'prev') {
      newIdx = currentIdx - ONE + lightboxItems.length;
    }
    setSelectedPhoto(lightboxItems[newIdx % lightboxItems.length]);
  };

  // Get current photo index for lightbox
  let currentPhotoIndex = NEGATIVE_ONE;
  if (selectedPhoto) {
    currentPhotoIndex = lightboxItems.findIndex(item => item.id === selectedPhoto.id);
  }

  const styles: { id: string; label: string }[] = [
    { id: 'spotlight', label: 'Tiêu điểm' }, 
    { id: 'explore', label: 'Khám phá' },
    { id: 'stories', label: 'Câu chuyện' },
    { id: 'grid', label: 'Grid' },
    { id: 'marquee', label: 'Marquee' },
    { id: 'masonry', label: 'Masonry' }
  ];

  // Gallery Empty State with brandColor
  const renderGalleryEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.placeholderBg }}>
        <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
      </div>
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có hình ảnh nào</h3>
      <p className="text-sm text-slate-500">Thêm ảnh đầu tiên để bắt đầu</p>
    </div>
  );

  // ============ GALLERY STYLES (Spotlight, Explore, Stories) ============
  
  // Style 1: Tiêu điểm (Spotlight) - Featured image with 3 smaller
  const renderSpotlightStyle = () => {
    if (items.length === 0) {return renderGalleryEmptyState();}
    const featured = items[0];
    const sub = items.slice(1, 4);
    const showCounters = items.length > 4;

    return (
      <div
        className={cn(
          'grid gap-1 border',
          device === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3',
        )}
        style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}
      >
        <div
          className={cn(
            'relative group cursor-pointer overflow-hidden border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            device === 'mobile' ? 'aspect-[4/3]' : 'md:col-span-2 aspect-[4/3] md:aspect-auto md:row-span-1',
          )}
          style={{
            ...(device !== 'mobile' ? { minHeight: '300px' } : {}),
            backgroundColor: colors.neutralSurface,
            borderColor: colors.neutralBorder,
            '--tw-ring-color': colors.focusRing,
          } as React.CSSProperties}
          onClick={() =>{  setSelectedPhoto(featured); }}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(featured); } }}
        >
          {featured.url ? (
            <PreviewImage src={featured.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
              <ImageIcon size={48} style={{ color: colors.placeholderIcon }} />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
          <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
        </div>
        <div className={cn('grid gap-1 p-1.5 rounded border-2', device === 'mobile' ? 'grid-cols-3' : 'grid-cols-1')} style={{ borderColor: colors.secondary, backgroundColor: colors.neutralBackground }}>
          {sub.map((photo, idx) => (
            <div
              key={photo.id}
              className="aspect-square relative group cursor-pointer overflow-hidden border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ 
                backgroundColor: colors.neutralSurface, 
                borderColor: colors.neutralBorder,
                '--tw-ring-color': colors.focusRing,
              } as React.CSSProperties}
              onClick={() =>{  setSelectedPhoto(photo); }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
            >
              {photo.url ? (
                <PreviewImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                  <ImageIcon size={24} style={{ color: colors.placeholderIcon }} />
                </div>
              )}
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
              <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
              {showCounters && (
                <div 
                  className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full border"
                  style={{ 
                    backgroundColor: colors.counterBg, 
                    color: colors.counterText,
                    borderColor: colors.counterBorder,
                  }}
                >
                  {idx + 2}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Style 2: Khám phá (Explore) - Instagram-like grid
  const renderExploreStyle = () => {
    if (items.length === 0) {return renderGalleryEmptyState();}
    const showCounters = items.length > 6;

    return (
      <div
        className={cn('grid gap-0.5 border', device === 'mobile' ? 'grid-cols-3' : (device === 'tablet' ? 'grid-cols-4' : 'grid-cols-5'))}
        style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}
      >
        {items.map((photo, idx) => (
          <div
            key={photo.id}
            className="aspect-square relative group cursor-pointer overflow-hidden border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ 
              backgroundColor: colors.neutralSurface, 
              borderColor: colors.neutralBorder,
              '--tw-ring-color': colors.focusRing,
            } as React.CSSProperties}
            onClick={() =>{  setSelectedPhoto(photo); }}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
          >
            {photo.url ? (
              <PreviewImage
                src={photo.url}
                alt=""
                className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                <ImageIcon size={24} style={{ color: colors.placeholderIcon }} />
              </div>
            )}
            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
            <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
            {showCounters && (
              <div 
                className="absolute top-1.5 right-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: colors.counterBg, 
                  color: colors.counterText,
                  borderColor: colors.counterBorder,
                }}
              >
                {idx + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Style 3: Câu chuyện (Stories) - Masonry-like with varying sizes
  const renderStoriesStyle = () => {
    if (items.length === 0) {return renderGalleryEmptyState();}
    const showCounters = items.length > 4;

    return (
      <div
        className={cn(
          'grid gap-4 rounded-lg border p-2',
          device === 'mobile' ? 'grid-cols-3 auto-rows-[110px]' : 'grid-cols-1 md:grid-cols-3 auto-rows-[250px] md:auto-rows-[300px]',
        )}
        style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}
      >
        {items.map((photo, i) => {
          const isLarge = i % 4 === 0 || i % 4 === 3;
          const colSpan = isLarge ? 'col-span-2 md:col-span-2' : 'col-span-1 md:col-span-1';

          return (
            <div
              key={photo.id}
              className={`${colSpan} relative group cursor-pointer overflow-hidden rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
              style={{ 
                backgroundColor: colors.neutralSurface, 
                borderColor: colors.neutralBorder,
                '--tw-ring-color': colors.focusRing,
              } as React.CSSProperties}
              onClick={() =>{  setSelectedPhoto(photo); }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
            >
              {photo.url ? (
                <PreviewImage
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                  <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
                </div>
              )}
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
              <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
              {showCounters && isLarge && (
                <div 
                  className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full border"
                  style={{ 
                    backgroundColor: colors.counterBg, 
                    color: colors.counterText,
                    borderColor: colors.counterBorder,
                  }}
                >
                  {i + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ============ GALLERY STYLES 4-6 (Grid, Marquee, Masonry) ============

  // Style 4: Gallery Grid - Clean equal squares grid
  const renderGalleryGridStyle = () => {
    if (items.length === 0) {return renderGalleryEmptyState();}

    const MAX_VISIBLE = device === 'mobile' ? 6 : (device === 'tablet' ? 9 : 12);
    const visibleItems = items.slice(0, MAX_VISIBLE);
    const remainingCount = items.length - MAX_VISIBLE;

    // Centered layout for 1-2 items
    if (items.length <= 2) {
      return (
        <div className="py-8 px-4">
        <div className={cn('mx-auto flex items-center justify-center gap-4', items.length === 1 ? 'max-w-sm' : 'max-w-xl')}>
            {items.map((photo) => (
              <div
                key={photo.id}
                className="flex-1 aspect-square rounded-xl overflow-hidden cursor-pointer group border relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ 
                  backgroundColor: colors.neutralSurface, 
                  borderColor: colors.neutralBorder,
                  '--tw-ring-color': colors.focusRing,
                } as React.CSSProperties}
                onClick={() =>{  setSelectedPhoto(photo); }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
              >
                {photo.url ? (
                  <PreviewImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                    <ImageIcon size={40} style={{ color: colors.placeholderIcon }} />
                  </div>
                )}
                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="py-8 px-4">
        <div className={cn(
          'grid gap-2 rounded-lg border-2 p-2 relative',
          device === 'mobile' ? 'grid-cols-2' : (device === 'tablet' ? 'grid-cols-3' : 'grid-cols-4'),
        )} style={{ backgroundColor: colors.neutralBackground, borderColor: colors.secondary }}>
          {/* Corner decorations with secondary color */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: colors.secondary }} />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: colors.secondary }} />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: colors.secondary }} />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: colors.secondary }} />
          {visibleItems.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ 
                backgroundColor: colors.neutralSurface, 
                borderColor: colors.neutralBorder,
                '--tw-ring-color': colors.focusRing,
              } as React.CSSProperties}
              onClick={() =>{  setSelectedPhoto(photo); }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
            >
              {photo.url ? (
                <PreviewImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                  <ImageIcon size={28} style={{ color: colors.placeholderIcon }} />
                </div>
              )}
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
              <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
            </div>
          ))}
          {/* +N remaining badge with secondary color */}
          {remainingCount > 0 && (
            <div
              className="aspect-square rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer border"
              style={{ backgroundColor: colors.badgeBg, borderColor: colors.counterBorder }}
            >
              <Plus size={28} style={{ color: colors.secondary }} className="mb-1" />
              <span className="text-lg font-bold" style={{ color: colors.badgeText }}>+{remainingCount}</span>
              <span className="text-xs" style={{ color: colors.mutedText }}>ảnh khác</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Style 5: Gallery Marquee - Auto scroll horizontal
  const renderGalleryMarqueeStyle = () => {
    if (items.length === 0) {return renderGalleryEmptyState();}
    if (marqueeBaseItems.length === 0) {return renderGalleryEmptyState();}

    const visualGapClass = 'gap-6 md:gap-8';

    return (
      <div className="py-8">
      <div className="w-full max-w-7xl mx-auto relative overflow-hidden rounded-2xl border p-4 md:p-6" style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-20 z-10"
            style={{ background: `linear-gradient(to right, ${colors.neutralBackground} 0%, transparent 100%)` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-20 z-10"
            style={{ background: `linear-gradient(to left, ${colors.neutralBackground} 0%, transparent 100%)` }}
          />
          <div
            ref={marqueeScrollRef}
            className="flex overflow-x-auto select-none w-full cursor-grab active:cursor-grabbing touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            onMouseEnter={() =>{  setIsMarqueeInteractionPaused(true); }}
            onMouseLeave={(e) => {
              setIsMarqueeInteractionPaused(false);
              e.currentTarget.dataset.isDown = 'false';
              e.currentTarget.style.scrollBehavior = 'smooth';
            }}
            onFocusCapture={() =>{  setIsMarqueeInteractionPaused(true); }}
            onBlurCapture={() =>{  setIsMarqueeInteractionPaused(false); }}
            onTouchStart={() =>{  setIsMarqueeInteractionPaused(true); }}
            onTouchEnd={() =>{  setIsMarqueeInteractionPaused(false); }}
            onTouchCancel={() =>{  setIsMarqueeInteractionPaused(false); }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.dataset.isDown = 'true';
              el.dataset.startX = String(e.pageX - el.offsetLeft);
              el.dataset.scrollLeft = String(el.scrollLeft);
              el.style.scrollBehavior = 'auto';
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
              const walk = (x - Number(el.dataset.startX ?? '0')) * 1.2;
              el.scrollLeft = Number(el.dataset.scrollLeft ?? '0') - walk;
            }}
          >
            {Array.from({ length: marqueeRepeatCount }).map((_, loopIdx) => (
              <div
                key={`gallery-marquee-track-${loopIdx}`}
                ref={loopIdx === 0 ? marqueeBaseTrackRef : undefined}
                className={cn('flex shrink-0 items-center px-1 py-1', visualGapClass)}
              >
                {marqueeBaseItems.map((photo, idx) => {
                  const displayIndex = idx + ONE;
                  const imageLabel = photo.name?.trim() || `Ảnh ${displayIndex} trong thư viện ảnh`;
                  return (
                    <button
                      type="button"
                      key={`gallery-marquee-${loopIdx}-${photo.id}-${idx}`}
                      className="shrink-0 h-40 md:h-56 lg:h-64 aspect-[4/3] rounded-xl overflow-hidden group relative border text-left appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        backgroundColor: colors.neutralSurface,
                        borderColor: colors.neutralBorder,
                        boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                        '--tw-ring-color': colors.focusRing,
                      } as React.CSSProperties}
                      onClick={() =>{  setSelectedPhoto(photo); }}
                      aria-label={`Mở ${imageLabel}`}
                    >
                      {photo.url ? (
                        <PreviewImage src={photo.url} alt={imageLabel} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                          <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
                        </div>
                      )}
                      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
                      <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Style 6: Gallery Masonry - Pinterest-like varying heights
  const renderGalleryMasonryStyle = () => {
    if (items.length === 0) {return renderGalleryEmptyState();}

    const MAX_VISIBLE = device === 'mobile' ? 6 : 10;
    const visibleItems = items.slice(0, MAX_VISIBLE);
    const remainingCount = items.length - MAX_VISIBLE;

    // Centered layout for 1-2 items
    if (items.length <= 2) {
      return (
        <div className="py-8 px-4">
        <div className={cn('mx-auto flex items-center justify-center gap-4', items.length === 1 ? 'max-w-md' : 'max-w-2xl')}>
            {items.map((photo, idx) => (
              <div
                key={photo.id}
                className={cn('flex-1 rounded-xl overflow-hidden cursor-pointer group border relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', idx % 2 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]')}
                style={{ 
                  backgroundColor: colors.neutralSurface, 
                  borderColor: colors.neutralBorder,
                  '--tw-ring-color': colors.focusRing,
                } as React.CSSProperties}
                onClick={() =>{  setSelectedPhoto(photo); }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
              >
                {photo.url ? (
                  <PreviewImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                    <ImageIcon size={40} style={{ color: colors.placeholderIcon }} />
                  </div>
                )}
                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Masonry layout with CSS columns
    return (
      <div className="py-8 px-4">
      <div className={cn(
        'gap-3 rounded-lg border-2 p-2 relative',
        device === 'mobile' ? 'columns-2' : (device === 'tablet' ? 'columns-3' : 'columns-4'),
      )} style={{ backgroundColor: colors.neutralBackground, borderColor: colors.secondary }}>
          {/* Corner decorations with secondary color */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg z-10" style={{ borderColor: colors.secondary }} />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg z-10" style={{ borderColor: colors.secondary }} />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg z-10" style={{ borderColor: colors.secondary }} />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg z-10" style={{ borderColor: colors.secondary }} />
          {visibleItems.map((photo, idx) => {
            // Varying heights for masonry effect
            const heights = ['h-48', 'h-64', 'h-56', 'h-72', 'h-52', 'h-60'];
            const heightClass = heights[idx % heights.length];

            return (
              <div
                key={photo.id}
                className={cn('mb-3 break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', heightClass)}
                style={{ 
                  backgroundColor: colors.neutralSurface, 
                  borderColor: colors.neutralBorder,
                  '--tw-ring-color': colors.focusRing,
                } as React.CSSProperties}
                onClick={() =>{  setSelectedPhoto(photo); }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPhoto(photo); } }}
              >
                {photo.url ? (
                  <PreviewImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                    <ImageIcon size={28} style={{ color: colors.placeholderIcon }} />
                  </div>
                )}
                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
                <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
              </div>
            );
          })}
        </div>
        {/* +N remaining badge with secondary color */}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center mt-4">
            <span className="text-sm font-medium px-4 py-2 rounded-full border" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, borderColor: colors.counterBorder }}>
              +{remainingCount} ảnh khác
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render Gallery styles with container and Lightbox (with keyboard navigation)
  const renderGalleryContent = () => (
    <section className="w-full" style={{ backgroundColor: colors.neutralSurface }}>
      <div className={cn(
        'container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12',
        previewStyle === 'marquee' ? 'max-w-7xl' : 'max-w-[1600px]',
      )}>
        {title && (
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-3" style={{ color: colors.heading }}>{title}</h2>
            <div className="mx-auto h-1 w-16 rounded-full" style={{ backgroundColor: layoutAccent }} />
          </div>
        )}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
          {previewStyle === 'spotlight' && renderSpotlightStyle()}
          {previewStyle === 'explore' && renderExploreStyle()}
          {previewStyle === 'stories' && renderStoriesStyle()}
          {previewStyle === 'grid' && renderGalleryGridStyle()}
          {previewStyle === 'marquee' && renderGalleryMarqueeStyle()}
          {previewStyle === 'masonry' && renderGalleryMasonryStyle()}
        </div>
      </div>
      <GalleryLightbox
        photo={selectedPhoto}
        onClose={() =>{  setSelectedPhoto(null); }}
        photos={lightboxItems}
        currentIndex={currentPhotoIndex}
        onNavigate={handleLightboxNavigate}
        colors={colors}
      />
    </section>
  );

  // Generate image size info based on style and item count
  const getGalleryImageSizeInfo = () => {
    const count = items.length;
    switch (previewStyle) {
      case 'spotlight': {
        if (count === 0) {return 'Chưa có ảnh';}
        if (count === 1) {return 'Ảnh 1: 1200×800px (3:2)';}
        if (count <= 4) {return `Ảnh 1: 1200×800px • Ảnh 2-${count}: 600×600px`;}
        return `Ảnh 1: 1200×800px • Ảnh 2-4: 600×600px (+${count - 4} ảnh)`;
      }
      case 'explore': {
        return `${count} ảnh • Tất cả: 600×600px (1:1)`;
      }
      case 'stories': {
        if (count === 0) {return 'Chưa có ảnh';}
        const largeCount = Math.ceil(count / 4) * 2;
        const smallCount = count - largeCount;
        return `${largeCount} ảnh lớn: 1200×600px • ${smallCount} ảnh nhỏ: 800×600px`;
      }
      case 'grid': {
        return `${count} ảnh • Tất cả: 800×800px (1:1)`;
      }
      case 'marquee': {
        return `${count} ảnh • Tất cả: 800×600px (4:3)`;
      }
      case 'masonry': {
        return `${count} ảnh • Ngang: 600×400px • Dọc: 600×900px • Vuông: 600×600px`;
      }
      default: {
        return `${count} ảnh`;
      }
    }
  };

  return (
    <>
      <PreviewWrapper 
        title="Preview Thư viện ảnh" 
        device={device} 
        setDevice={setDevice} 
        previewStyle={previewStyle} 
        setPreviewStyle={setPreviewStyle} 
        styles={styles} 
        info={`${getGalleryImageSizeInfo()} • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {renderGalleryContent()}
        </BrowserFrame>
      </PreviewWrapper>
      {mode === 'dual' ? <ColorInfoPanel brandColor={brandColor} secondary={secondary} /> : null}
    </>
  );
};
