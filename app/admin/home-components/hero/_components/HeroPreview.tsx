'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { getBrandColors } from '@/lib/utils/colors';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  getBentoColors,
  getFadeColors,
  getFullscreenColors,
  getHeroColors,
  getParallaxColors,
  getSliderColors,
  getSplitColors,
} from '../_lib/colors';
import { HERO_STYLES } from '../_lib/constants';
import type { HeroContent, HeroStyle } from '../_types';

export const HeroPreview = ({ 
  slides, 
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'slider',
  onStyleChange,
  content,
  fontStyle,
  fontClassName,
}: { 
  slides: { id: number; image: string; link: string }[]; 
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual';
  selectedStyle?: HeroStyle;
  onStyleChange?: (style: HeroStyle) => void;
  content?: HeroContent;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const previewStyle = selectedStyle ?? 'slider';
  const setPreviewStyle = (style: string) => onStyleChange?.(style as HeroStyle);
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  const info = previewStyle !== 'bento'
    ? `Slide ${currentSlide + 1} / ${slides.length || 1} • ${modeLabel}`
    : modeLabel;
  const brandColors = getBrandColors({
    mode,
    primary: brandColor,
    secondary,
  });
  const placeholderColors = brandColors.getPlaceholder();
  const colors = getHeroColors(brandColors.primary, brandColors.secondary, brandColors.useDualBrand);
  const sliderColors = getSliderColors(brandColors.primary, brandColors.secondary, mode);
  const fadeColors = getFadeColors(brandColors.primary, brandColors.secondary, mode);
  const bentoColors = getBentoColors(brandColors.primary, brandColors.secondary, mode);
  const fullscreenColors = getFullscreenColors(brandColors.primary, brandColors.secondary, mode);
  const splitColors = getSplitColors(brandColors.primary, brandColors.secondary, mode);
  const parallaxColors = getParallaxColors(brandColors.primary, brandColors.secondary, mode);

  const nextSlide = () =>{  setCurrentSlide((prev) => (prev + 1) % slides.length); };
  const prevSlide = () =>{  setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length); };
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (device !== 'mobile' || slides.length <= 1 || startX == null || endX == null) {
      return;
    }

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) {
      return;
    }

    if (deltaX < 0) {
      nextSlide();
      return;
    }

    prevSlide();
  };

  const renderSlideWithBlur = (slide: { image: string }, idx: number) => (
    <div className="block w-full h-full relative">
      <div 
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${slide.image})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: 'blur(30px)',
        }}
      />
      <div className="absolute inset-0 bg-black/20" />
      <PreviewImage 
        src={slide.image} 
        alt={`Slide ${idx + 1}`}
        className="relative w-full h-full object-contain z-10"
      />
    </div>
  );

  const renderSlideWithContain = (
    slide: { image: string },
    options?: {
      blur?: number;
      overlay?: React.ReactNode;
      fit?: 'contain' | 'cover';
    }
  ) => (
    <div className="w-full h-full relative">
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${slide.image})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: `blur(${options?.blur ?? 25}px)`,
        }}
      />
      <PreviewImage
        src={slide.image}
        alt=""
        className={cn(
          "relative w-full h-full z-10",
          options?.fit === 'cover' ? 'object-cover' : 'object-contain'
        )}
      />
      {options?.overlay}
    </div>
  );

  const renderPlaceholder = (
    idx: number,
    options?: {
      useSliderColors?: boolean;
      backgroundColor?: string;
      iconColor?: string;
      textColor?: string;
    }
  ) => {
    const placeholderBg = options?.backgroundColor ?? (options?.useSliderColors ? sliderColors.placeholderBg : '#f1f5f9');
    const placeholderIconColor = options?.iconColor ?? (options?.useSliderColors ? sliderColors.placeholderIconColor : placeholderColors.icon);
    const placeholderTextColor = options?.textColor ?? '#64748b';
    return (
      <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: placeholderBg }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: placeholderBg }}>
          <ImageIcon size={24} style={{ color: placeholderIconColor }} />
        </div>
        <div className="text-sm font-medium" style={{ color: placeholderTextColor }}>Banner #{idx + 1}</div>
        <div className="text-xs mt-1" style={{ color: placeholderTextColor }}>Khuyến nghị: 1920x600px</div>
      </div>
    );
  };

  const renderSliderStyle = () => (
    <section className="relative w-full bg-slate-900 overflow-hidden">
      <div
        className={cn(
          "relative w-full",
          device === 'mobile' ? 'aspect-[16/9] max-h-[200px]' : (device === 'tablet' ? 'aspect-[16/9] max-h-[250px]' : 'aspect-[21/9] max-h-[280px]')
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.length > 0 ? (
          <>
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={cn("absolute inset-0 transition-opacity duration-700 hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-900", idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none")}
                style={{ '--tw-ring-color': sliderColors.hoverRingColor } as React.CSSProperties}
              >
                {slide.image ? renderSlideWithBlur(slide, idx) : renderPlaceholder(idx, { useSliderColors: true })}
              </div>
            ))}
            {slides.length > 1 && (
              <>
                {device !== 'mobile' && (
                  <>
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all z-20 border-2 hover:scale-105"
                      style={{
                        backgroundColor: sliderColors.navButtonBg,
                        borderColor: sliderColors.navButtonBorderColor,
                        boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`,
                      }}
                    >
                      <ChevronLeft size={14} style={{ color: sliderColors.navButtonIconColor }} />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all z-20 border-2 hover:scale-105"
                      style={{
                        backgroundColor: sliderColors.navButtonBgHover,
                        borderColor: sliderColors.navButtonBorderColor,
                        boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}`,
                      }}
                    >
                      <ChevronRight size={14} style={{ color: sliderColors.navButtonIconColor }} />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>{  setCurrentSlide(idx); }}
                      className={cn("w-2 h-2 rounded-full transition-all", idx === currentSlide ? "w-6" : "")}
                      style={{
                        backgroundColor: idx === currentSlide ? sliderColors.dotActive : sliderColors.dotInactive,
                      }}
                    />
                  ))}
                </div>
                <div className="absolute bottom-1 left-0 right-0 h-0.5 z-20" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      backgroundColor: sliderColors.progressBarActive,
                      width: `${((currentSlide + 1) / slides.length) * 100}%`,
                    }}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800"><span className="text-slate-400 text-sm">Chưa có banner</span></div>
        )}
      </div>
    </section>
  );

  const renderFadeStyle = () => (
    <section className="relative w-full bg-slate-900 overflow-hidden">
      <div className={cn(
        "relative w-full",
        device === 'mobile' ? 'aspect-[16/9] max-h-[220px]' : (device === 'tablet' ? 'aspect-[16/9] max-h-[270px]' : 'aspect-[21/9] max-h-[300px]')
      )}>
        {slides.length > 0 ? (
          <>
            {slides.map((slide, idx) => (
              <div key={slide.id} className={cn("absolute inset-0 transition-opacity duration-700", idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none")}>
                {slide.image ? renderSlideWithBlur(slide, idx) : renderPlaceholder(idx, { backgroundColor: fadeColors.placeholderBg, iconColor: fadeColors.placeholderIconColor })}
              </div>
            ))}
            {slides.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent z-20">
                {slides.map((slide, idx) => (
                  <button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }}
                    className={cn("rounded overflow-hidden transition-all border-2", idx === currentSlide ? "scale-105" : "border-transparent opacity-70 hover:opacity-100", device === 'mobile' ? 'w-10 h-7' : 'w-14 h-9')}
                    style={idx === currentSlide ? { borderColor: fadeColors.thumbnailBorderActive } : { borderColor: fadeColors.thumbnailBorderInactive }}>
                    {slide.image ? <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: fadeColors.placeholderBg }}></div>}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800"><span className="text-slate-400 text-sm">Chưa có banner</span></div>
        )}
      </div>
    </section>
  );

  const renderBentoStyle = () => {
    const bentoSlides = slides.slice(0, 4);
    const placeholderTints = ['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0'];
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden p-2">
        <div className={cn(
          "relative w-full",
          device === 'mobile' ? 'max-h-[240px]' : (device === 'tablet' ? 'max-h-[280px]' : 'max-h-[300px]')
        )}>
          {device === 'mobile' ? (
            <div className="grid grid-cols-2 gap-2 h-full">
              {bentoSlides.slice(0, 4).map((slide, idx) => (
                <div key={slide.id} className="relative rounded-xl overflow-hidden aspect-video">
                  {slide.image ? (
                    <div className="w-full h-full relative">
                      <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                      <div className="absolute inset-0 bg-black/20" />
                      <PreviewImage src={slide.image} alt="" className="relative w-full h-full object-contain z-10" />
                    </div>
                  ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[idx] ?? '#f1f5f9' }}>
                    <ImageIcon size={20} style={{ color: bentoColors.placeholderIcon }} />
                  </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-full" style={{ height: device === 'desktop' ? '280px' : '260px' }}>
              <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900" style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
                {bentoSlides[0]?.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[0].image} alt="" className="relative w-full h-full object-contain z-10" />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: placeholderTints[0] }}>
                    <ImageIcon size={28} style={{ color: bentoColors.placeholderIcon }} /><span className="text-xs text-slate-400 mt-1">Banner chính</span>
                  </div>
                )}
              </div>
              <div className="col-span-2 relative rounded-xl overflow-hidden">
                {bentoSlides[1]?.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[1].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[1].image} alt="" className="relative w-full h-full object-contain z-10" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[1] }}>
                    <ImageIcon size={20} style={{ color: bentoColors.placeholderIcon }} />
                  </div>
                )}
              </div>
              <div className="relative rounded-xl overflow-hidden">
                {bentoSlides[2]?.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[2].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[2].image} alt="" className="relative w-full h-full object-contain z-10" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[2] }}>
                    <ImageIcon size={16} style={{ color: bentoColors.placeholderIcon }} />
                  </div>
                )}
              </div>
              <div className="relative rounded-xl overflow-hidden">
                {bentoSlides[3]?.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[3].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <PreviewImage src={bentoSlides[3].image} alt="" className="relative w-full h-full object-contain z-10" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: placeholderTints[3] }}>
                    <ImageIcon size={16} style={{ color: bentoColors.placeholderIcon }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderFullscreenStyle = () => {
    const mainSlide = slides[currentSlide] || slides[0];
    const c = content ?? {};
    const primaryHref = c.primaryButtonLink || slides[currentSlide]?.link || '#';
    const secondaryHref = c.secondaryButtonLink || '#';
    const showFullscreenContent = c.showFullscreenContent !== false;
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className={cn(
          "relative w-full",
          device === 'mobile' ? 'h-[280px]' : (device === 'tablet' ? 'h-[350px]' : 'h-[400px]')
        )}>
          {slides.length > 0 && mainSlide ? (
            <>
              {slides.map((slide, idx) => (
                <div key={slide.id} className={cn("absolute inset-0 transition-opacity duration-1000", idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  {slide.image ? (
                    renderSlideWithContain(slide, {
                      fit: 'cover',
                      overlay: showFullscreenContent ? (
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20" />
                      ) : null,
                    })
                  ) : renderPlaceholder(idx, { backgroundColor: fullscreenColors.placeholderBg, iconColor: fullscreenColors.placeholderIcon })}
                </div>
              ))}
              {showFullscreenContent && (
                <div className={cn(
                  "absolute inset-0 z-30 flex flex-col justify-center",
                  device === 'mobile' ? 'px-4' : 'px-8 md:px-16'
                )}>
                  <div className={cn("max-w-xl", device === 'mobile' ? 'space-y-3' : 'space-y-4')}>
                    {c.badge && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: fullscreenColors.badgeBg, color: fullscreenColors.badgeText }}>
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: fullscreenColors.badgeDotPulse }} />
                        {c.badge}
                      </div>
                    )}
                    <h1 className={cn("font-bold text-white leading-tight", device === 'mobile' ? 'text-xl' : (device === 'tablet' ? 'text-2xl' : 'text-3xl md:text-4xl'))}>
                      {c.heading ?? 'Tiêu đề chính'}
                    </h1>
                    {c.description && (
                      <p className={cn("text-white/80", device === 'mobile' ? 'text-sm line-clamp-2' : 'text-base')}>
                        {c.description}
                      </p>
                    )}
                    <div className={cn("flex gap-3", device === 'mobile' ? 'flex-col' : 'flex-row')}>
                      {c.primaryButtonText && (
                        <a href={primaryHref} className={cn("font-medium rounded-lg text-white", device === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-2.5')} style={{ backgroundColor: fullscreenColors.primaryCTA, color: fullscreenColors.primaryCTAText }}>
                          {c.primaryButtonText}
                        </a>
                      )}
                      {c.secondaryButtonText && (
                        <a href={secondaryHref} className={cn("font-medium rounded-lg border border-white/30 text-white hover:bg-white/10", device === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-2.5')}>
                          {c.secondaryButtonText}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {slides.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2 z-40">
                  {slides.map((_, idx) => (
                    <button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }} 
                      className={cn("w-2 h-2 rounded-full transition-all", idx === currentSlide ? "w-6" : "")}
                      style={idx === currentSlide ? { backgroundColor: fullscreenColors.dotActive } : { backgroundColor: fullscreenColors.dotInactive }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <span className="text-slate-400 text-sm">Chưa có banner</span>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderSplitStyle = () => {
    const mainSlide = slides[currentSlide] || slides[0];
    const c = content ?? {};
    const primaryHref = c.primaryButtonLink || slides[currentSlide]?.link || '#';
    return (
      <section className="relative w-full bg-white dark:bg-slate-900 overflow-hidden">
        <div className={cn(
          "relative w-full flex",
          device === 'mobile' ? 'flex-col h-auto' : 'flex-row h-[320px]'
        )}>
          {slides.length > 0 && mainSlide ? (
            <>
              <div className={cn(
                "flex flex-col justify-center bg-slate-50 dark:bg-slate-800/50",
                device === 'mobile' ? 'p-4 order-2' : 'w-1/2 p-8 lg:p-12'
              )}>
                <div className={cn("space-y-3", device === 'mobile' ? '' : 'max-w-md')}>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: splitColors.badgeBg, color: splitColors.badgeText }}>
                    {c.badge ?? `Banner ${currentSlide + 1}/${slides.length}`}
                  </span>
                  <h2 className={cn("font-bold text-slate-900 dark:text-white leading-tight", device === 'mobile' ? 'text-lg' : 'text-2xl lg:text-3xl')}>
                    {c.heading ?? 'Tiêu đề nổi bật'}
                  </h2>
                  {c.description && (
                    <p className={cn("text-slate-600 dark:text-slate-300", device === 'mobile' ? 'text-sm' : 'text-base')}>
                      {c.description}
                    </p>
                  )}
                  {c.primaryButtonText && (
                    <div className="pt-2">
                      <a href={primaryHref} className={cn("font-medium rounded-lg text-white", device === 'mobile' ? 'px-4 py-2 text-sm' : 'px-6 py-2.5')} style={{ backgroundColor: splitColors.primaryCTA, color: splitColors.primaryCTAText }}>
                        {c.primaryButtonText}
                      </a>
                    </div>
                  )}
                </div>
                {slides.length > 1 && device !== 'mobile' && (
                  <div className="flex gap-2 mt-6">
                    {slides.map((_, idx) => (
                      <button key={idx} type="button" onClick={() =>{  setCurrentSlide(idx); }}
                        className={cn("h-1 rounded-full transition-all", idx === currentSlide ? "w-8" : "w-4")}
                        style={idx === currentSlide ? { backgroundColor: splitColors.progressDotActive } : { backgroundColor: splitColors.progressDotInactive }} />
                    ))}
                  </div>
                )}
              </div>
              <div className={cn(
                "relative overflow-hidden",
                device === 'mobile' ? 'w-full h-[200px] order-1' : 'w-1/2'
              )}>
                {slides.map((slide, idx) => (
                  <div key={slide.id} className={cn("absolute inset-0 transition-all duration-700", idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none")}>
                    {slide.image ? (
                      <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                        <ImageIcon size={40} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}
                {slides.length > 1 && (
                  <>
                    <button type="button" onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                      <ChevronLeft size={16} style={{ color: splitColors.navButtonIcon }} />
                    </button>
                    <button type="button" onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                      <ChevronRight size={16} style={{ color: splitColors.navButtonIcon }} />
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <span className="text-slate-400 text-sm">Chưa có banner</span>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderParallaxStyle = () => {
    const mainSlide = slides[currentSlide] || slides[0];
    const c = content ?? {};
    const primaryHref = c.primaryButtonLink || slides[currentSlide]?.link || '#';
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className={cn(
          "relative w-full",
          device === 'mobile' ? 'h-[260px]' : (device === 'tablet' ? 'h-[320px]' : 'h-[380px]')
        )}>
          {slides.length > 0 && mainSlide ? (
            <>
              {slides.map((slide, idx) => (
                <div key={slide.id} className={cn("absolute inset-0 transition-opacity duration-700", idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  {slide.image ? (
                    renderSlideWithContain(slide, {
                      overlay: (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-20" />
                      ),
                    })
                  ) : renderPlaceholder(idx, { backgroundColor: parallaxColors.placeholderBg, iconColor: parallaxColors.placeholderIcon })}
                </div>
              ))}
              <div className={cn(
                "absolute z-10 flex items-end",
                device === 'mobile' ? 'inset-x-3 bottom-3' : 'inset-x-6 bottom-6'
              )}>
                <div className={cn(
                  "bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl",
                  device === 'mobile' ? 'p-3 w-full' : 'p-5 max-w-lg'
                )}>
                  {c.badge && (
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} />
                      <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{c.badge}</span>
                    </div>
                  )}
                  <h3 className={cn("font-bold text-slate-900 dark:text-white", device === 'mobile' ? 'text-base' : 'text-xl')}>
                    {c.heading ?? 'Tiêu đề nổi bật'}
                  </h3>
                  {c.description && (
                    <p className={cn("text-slate-600 dark:text-slate-300 mt-1", device === 'mobile' ? 'text-xs' : 'text-sm')}>
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    {c.primaryButtonText && (
                      <a href={primaryHref} className={cn("font-medium rounded-lg text-white", device === 'mobile' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm')} style={{ backgroundColor: parallaxColors.primaryCTA, color: parallaxColors.primaryCTAText }}>
                        {c.primaryButtonText}
                      </a>
                    )}
                    {c.countdownText && (
                      <span className={cn("text-slate-500", device === 'mobile' ? 'text-xs' : 'text-sm')}>{c.countdownText}</span>
                    )}
                  </div>
                </div>
              </div>
              {slides.length > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  <button type="button" onClick={prevSlide} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                    <ChevronLeft size={16} style={{ color: parallaxColors.navButtonIcon }} />
                  </button>
                  <span className="text-white/80 text-xs font-medium px-2">{currentSlide + 1} / {slides.length}</span>
                  <button type="button" onClick={nextSlide} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                    <ChevronRight size={16} style={{ color: parallaxColors.navButtonIcon }} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <span className="text-slate-400 text-sm">Chưa có banner</span>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <PreviewWrapper
        title="Preview Hero"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={HERO_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com">
          <div className="relative px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: colors.primarySolid, opacity: 0.6 }} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colors.primarySolid }}></div>
              <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            {device !== 'mobile' && <div className="flex gap-4">{[1,2,3,4].map(i => (<div key={i} className="w-12 h-2 bg-slate-100 dark:bg-slate-800 rounded"></div>))}</div>}
          </div>
          {previewStyle === 'slider' && renderSliderStyle()}
          {previewStyle === 'fade' && renderFadeStyle()}
          {previewStyle === 'bento' && renderBentoStyle()}
          {previewStyle === 'fullscreen' && renderFullscreenStyle()}
          {previewStyle === 'split' && renderSplitStyle()}
          {previewStyle === 'parallax' && renderParallaxStyle()}
          <div className="p-4 space-y-3">
            <div className="flex gap-3">{[1,2,3,4].slice(0, device === 'mobile' ? 2 : 4).map(i => (<div key={i} className="flex-1 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>))}</div>
          </div>
        </BrowserFrame>
      </PreviewWrapper>
      {previewStyle === 'slider' && mode === 'dual' && sliderColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(sliderColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'fade' && mode === 'dual' && fadeColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(fadeColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'bento' && mode === 'dual' && bentoColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(bentoColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'fullscreen' && mode === 'dual' && fullscreenColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(fullscreenColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'split' && mode === 'dual' && splitColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(splitColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {previewStyle === 'parallax' && mode === 'dual' && parallaxColors.similarity > 0.9 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Hai màu quá giống nhau (similarity: {(parallaxColors.similarity * 100).toFixed(0)}%). Khuyến nghị chọn màu phụ khác biệt hơn.
        </div>
      )}
      {mode === 'dual' && (
        <ColorInfoPanel brandColor={brandColor} secondary={secondary} compact />
      )}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {previewStyle === 'slider' && (
              <p><strong>1920×600px</strong> (16:5) • Nhiều ảnh, auto slide</p>
            )}
            {previewStyle === 'fade' && (
              <p><strong>1920×600px</strong> (16:5) • Nhiều ảnh, thumbnail navigation</p>
            )}
            {previewStyle === 'bento' && (
              <p><strong>Slot 1:</strong> 800×500 • <strong>Slot 2:</strong> 800×250 • <strong>Slot 3-4:</strong> 400×250 • Tối đa 4 ảnh</p>
            )}
            {previewStyle === 'fullscreen' && (
              <p><strong>1920×1080px</strong> (16:9) • Subject đặt bên phải (trái có overlay text)</p>
            )}
            {previewStyle === 'split' && (
              <p><strong>960×600px</strong> (8:5) • Ảnh bên phải 50%, subject đặt giữa/trái</p>
            )}
            {previewStyle === 'parallax' && (
              <p><strong>1920×1080px</strong> (16:9) • Để trống góc dưới trái cho card nổi</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
