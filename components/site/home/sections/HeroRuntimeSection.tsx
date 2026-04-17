'use client';

import React from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { cn } from '@/app/admin/components/ui';
import { getBentoColors, getFadeColors, getFullscreenColors, getParallaxColors, getSliderColors, getSplitColors } from '@/app/admin/home-components/hero/_lib/colors';
import type { HeroContent, HeroStyle } from '@/app/admin/home-components/hero/_types';
import type { HomeComponentSectionProps } from '../types';
import { Image as ImageIcon, LayoutTemplate } from 'lucide-react';

type SiteImageProps = Omit<React.ComponentProps<typeof Image>, 'width' | 'height' | 'src'> & {
  src?: React.ComponentProps<typeof Image>['src'];
  width?: number | string;
  height?: number | string;
  sizes?: string;
};

const SiteImage = ({ src, alt = '', width = 1200, height = 800, sizes = '100vw', ...rest }: SiteImageProps) => {
  if (!src) {return null;}
  const normalizedWidth = typeof width === 'string' ? Number.parseInt(width, 10) || 1200 : width;
  const normalizedHeight = typeof height === 'string' ? Number.parseInt(height, 10) || 800 : height;
  const fetchPriority = rest.priority ? 'high' : rest.fetchPriority;

  return (
    <Image
      mode="hero"
      src={src}
      {...rest}
      fetchPriority={fetchPriority}
      alt={alt}
      width={normalizedWidth}
      height={normalizedHeight}
      sizes={sizes}
    />
  );
};

const isLikelyVisibleSlide = (index: number, currentIndex: number, total: number) => {
  if (total <= 1) {return true;}
  if (index === currentIndex) {return true;}
  if (index === (currentIndex + 1) % total) {return true;}
  return index === (currentIndex - 1 + total) % total;
};

export function HeroRuntimeSection({ config, brandColor, secondary, mode }: HomeComponentSectionProps) {
  const slides = (config.slides as { image: string; link: string }[]) || [];
  const style = (config.style as HeroStyle) || 'slider';
  const content = (config.content as HeroContent) || {};
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const primaryHref = content.primaryButtonLink || slides[currentSlide]?.link || '#';
  const secondaryHref = content.secondaryButtonLink || '#';
  const sliderColors = getSliderColors(brandColor, secondary, mode);
  const fadeColors = getFadeColors(brandColor, secondary, mode);
  const bentoColors = getBentoColors(brandColor, secondary, mode);
  const fullscreenColors = getFullscreenColors(brandColor, secondary, mode);
  const splitColors = getSplitColors(brandColor, secondary, mode);
  const parallaxColors = getParallaxColors(brandColor, secondary, mode);

  React.useEffect(() => {
    if (slides.length <= 1 || style === 'bento') {return;}
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => { clearInterval(timer); };
  }, [slides.length, style]);

  if (slides.length === 0) {
    return (
      <section className="relative h-[500px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Chào mừng đến với chúng tôi</h1>
          <p className="text-slate-300">Khám phá sản phẩm và dịch vụ tuyệt vời</p>
        </div>
      </section>
    );
  }

  const renderSlideWithBlur = (slide: { image: string; link: string }, options?: { priority?: boolean; loading?: 'eager' | 'lazy' }) => (
    <a href={slide.link || '#'} className="block w-full h-full relative">
      <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(30px)' }} />
      <div className="absolute inset-0 bg-black/20" />
      <SiteImage src={slide.image} alt="" className="relative w-full h-full object-contain z-10" priority={options?.priority} loading={options?.loading} />
    </a>
  );

  const renderPlaceholder = (backgroundColor: string, iconColor: string, size = 32) => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor }}>
      <ImageIcon size={size} style={{ color: iconColor }} />
    </div>
  );

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (slides.length <= 1 || startX == null || endX == null) {
      return;
    }

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) {
      return;
    }

    if (deltaX < 0) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      return;
    }

    setCurrentSlide((prev) => prev === 0 ? slides.length - 1 : prev - 1);
  };

  if (style === 'slider') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[400px] md:max-h-[550px]" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {slides.map((slide, idx) => {
            const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
            return (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-700 hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-900 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ '--tw-ring-color': sliderColors.hoverRingColor } as React.CSSProperties}>
                {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0, loading: shouldLoad ? 'eager' : 'lazy' }) : renderPlaceholder(sliderColors.placeholderBg, sliderColors.placeholderIconColor)}
              </div>
            );
          })}
          {slides.length > 1 && (
            <>
              <button onClick={() => { setCurrentSlide((prev) => prev === 0 ? slides.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg hidden md:flex items-center justify-center transition-all z-20 border-2" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}` }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: sliderColors.navButtonIconColor }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg hidden md:flex items-center justify-center transition-all z-20 border-2" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}` }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: sliderColors.navButtonIconColor }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, idx) => (
                  <button key={idx} onClick={() => { setCurrentSlide(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === currentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                ))}
              </div>
              <div className="absolute bottom-2 left-0 right-0 h-0.5 z-20" style={{ backgroundColor: sliderColors.progressBarInactive }}>
                <div className="h-full transition-all duration-700" style={{ backgroundColor: sliderColors.progressBarActive, width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  if (style === 'fade') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[450px] md:max-h-[600px]">
          {slides.map((slide, idx) => {
            const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
            return (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0, loading: shouldLoad ? 'eager' : 'lazy' }) : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor)}
              </div>
            );
          })}
          {slides.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent z-20">
              {slides.map((slide, idx) => (
                <button key={idx} onClick={() => { setCurrentSlide(idx); }} className={`rounded overflow-hidden transition-all border-2 w-16 h-10 md:w-20 md:h-12 ${idx === currentSlide ? 'scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} style={idx === currentSlide ? { borderColor: fadeColors.thumbnailBorderActive } : { borderColor: fadeColors.thumbnailBorderInactive }}>
                  {slide.image ? <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" loading="lazy" /> : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor, 18)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'bento') {
    const bentoSlides = slides.slice(0, 4);
    const bentoPlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0'];
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden p-2 md:p-4">
        <div className="max-h-[400px] md:max-h-[550px]">
          <div className="grid grid-cols-2 gap-2 md:hidden" style={{ height: '320px' }}>
            {bentoSlides.slice(0, 4).map((slide, idx) => (
              <a key={idx} href={slide.link || '#'} className="relative rounded-xl overflow-hidden">
                {slide.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <SiteImage src={slide.image} alt="" className="relative w-full h-full object-contain z-10" priority={idx === 0} loading={idx === 0 ? 'eager' : 'lazy'} />
                  </div>
                ) : renderPlaceholder(bentoPlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)}
              </a>
            ))}
          </div>
          <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3" style={{ height: '500px' }}>
            <a href={bentoSlides[0]?.link || '#'} className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900" style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
              {bentoSlides[0]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[0].image} alt="" className="relative w-full h-full object-contain z-10" priority loading="eager" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[0], bentoColors.placeholderIcon, 24)}
            </a>
            <a href={bentoSlides[1]?.link || '#'} className="col-span-2 relative rounded-2xl overflow-hidden">
              {bentoSlides[1]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[1].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[1].image} alt="" className="relative w-full h-full object-contain z-10" loading="lazy" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[1], bentoColors.placeholderIcon, 22)}
            </a>
            <a href={bentoSlides[2]?.link || '#'} className="relative rounded-2xl overflow-hidden">
              {bentoSlides[2]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[2].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[2].image} alt="" className="relative w-full h-full object-contain z-10" loading="lazy" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[2], bentoColors.placeholderIcon, 20)}
            </a>
            <a href={bentoSlides[3]?.link || '#'} className="relative rounded-2xl overflow-hidden">
              {bentoSlides[3]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[3].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[3].image} alt="" className="relative w-full h-full object-contain z-10" loading="lazy" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[3], bentoColors.placeholderIcon, 20)}
            </a>
          </div>
        </div>
      </section>
    );
  }

  const renderHeroSlideContain = (slide: { image?: string }, options?: { overlay?: React.ReactNode; blur?: number; fit?: 'contain' | 'cover'; priority?: boolean; loading?: 'eager' | 'lazy' }) => (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: `blur(${options?.blur ?? 25}px)` }} />
      <SiteImage src={slide.image ?? ''} alt="" className={cn('relative w-full h-full z-10', options?.fit === 'cover' ? 'object-cover' : 'object-contain')} priority={options?.priority} loading={options?.loading} />
      {options?.overlay}
    </div>
  );

  if (style === 'fullscreen') {
    const showFullscreenContent = content.showFullscreenContent !== false;
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full h-[400px] md:h-[550px] lg:h-[650px]">
          {slides.map((slide, idx) => {
            const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
            return (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {slide.image ? renderHeroSlideContain(slide, { fit: 'cover', priority: idx === currentSlide, loading: shouldLoad ? 'eager' : 'lazy', overlay: showFullscreenContent ? <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20" /> : null }) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
              </div>
            );
          })}
          {showFullscreenContent && (
            <div className="absolute inset-0 z-30 flex flex-col justify-center px-4 md:px-8 lg:px-16">
              <div className="max-w-xl space-y-4 md:space-y-6">
                {content.badge && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: fullscreenColors.badgeBg, color: fullscreenColors.badgeText }}><span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: fullscreenColors.badgeDotPulse }} />{content.badge}</div>}
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">{content.heading ?? 'Tiêu đề chính'}</h1>
                {content.description && <p className="text-white/80 text-sm md:text-lg">{content.description}</p>}
                <div className="flex flex-col sm:flex-row gap-3">
                  {content.primaryButtonText && <a href={primaryHref} className="px-6 py-3 font-medium rounded-lg text-center" style={{ backgroundColor: fullscreenColors.primaryCTA, color: fullscreenColors.primaryCTAText }}>{content.primaryButtonText}</a>}
                  {content.secondaryButtonText && <a href={secondaryHref} className="px-6 py-3 font-medium rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors text-center">{content.secondaryButtonText}</a>}
                </div>
              </div>
            </div>
          )}
          {slides.length > 1 && <div className="absolute bottom-6 right-6 flex gap-2 z-40">{slides.map((_, idx) => <button key={idx} onClick={() => { setCurrentSlide(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === currentSlide ? fullscreenColors.dotActive : fullscreenColors.dotInactive }} />)}</div>}
        </div>
      </section>
    );
  }

  if (style === 'split') {
    return (
      <section className="relative w-full bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row md:h-[450px] lg:h-[550px]">
          <div className="w-full md:w-1/2 flex flex-col justify-center bg-slate-50 p-6 md:p-10 lg:p-16 order-2 md:order-1">
            <div className="max-w-md space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: splitColors.badgeBg, color: splitColors.badgeText }}>{content.badge ?? `Banner ${currentSlide + 1}/${slides.length}`}</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">{content.heading ?? 'Tiêu đề nổi bật'}</h2>
              {content.description && <p className="text-slate-600 text-base md:text-lg">{content.description}</p>}
              {content.primaryButtonText && <div className="pt-2"><a href={primaryHref} className="inline-block px-6 py-3 font-medium rounded-lg" style={{ backgroundColor: splitColors.primaryCTA, color: splitColors.primaryCTAText }}>{content.primaryButtonText}</a></div>}
            </div>
            {slides.length > 1 && <div className="flex gap-2 mt-8">{slides.map((_, idx) => <button key={idx} onClick={() => { setCurrentSlide(idx); }} className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'w-10' : 'w-6'}`} style={{ backgroundColor: idx === currentSlide ? splitColors.progressDotActive : splitColors.progressDotInactive }} />)}</div>}
          </div>
          <div className="w-full md:w-1/2 h-[280px] md:h-full relative overflow-hidden order-1 md:order-2">
            {slides.map((slide, idx) => {
              const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
              return (
                <div key={idx} className={`absolute inset-0 transition-all duration-700 ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                  {slide.image ? <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === currentSlide} loading={shouldLoad ? 'eager' : 'lazy'} /> : <div className="w-full h-full flex items-center justify-center bg-slate-200"><LayoutTemplate size={48} className="text-slate-400" /></div>}
                </div>
              );
            })}
            {slides.length > 1 && <><button onClick={() => { setCurrentSlide((prev) => prev === 0 ? slides.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}><svg className="w-5 h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button><button onClick={() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}><svg className="w-5 h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button></>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-slate-900 overflow-hidden">
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px]">
        {slides.map((slide, idx) => {
          const shouldLoad = isLikelyVisibleSlide(idx, currentSlide, slides.length);
          return (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? renderHeroSlideContain(slide, { priority: idx === currentSlide, loading: shouldLoad ? 'eager' : 'lazy', overlay: <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-20" /> }) : renderPlaceholder(parallaxColors.placeholderBg, parallaxColors.placeholderIcon)}
            </div>
          );
        })}
        <div className="absolute z-10 inset-x-4 md:inset-x-8 bottom-4 md:bottom-8 flex items-end">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 md:p-6 max-w-lg">
            {content.badge && <div className="flex items-center gap-3 mb-2"><div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} /><span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{content.badge}</span></div>}
            <h3 className="text-lg md:text-xl font-bold text-slate-900">{content.heading ?? 'Tiêu đề nổi bật'}</h3>
            {content.description && <p className="text-slate-600 text-sm mt-1">{content.description}</p>}
            <div className="flex items-center gap-3 mt-4">
              {content.primaryButtonText && <a href={primaryHref} className="px-5 py-2 font-medium rounded-lg text-sm" style={{ backgroundColor: parallaxColors.primaryCTA, color: parallaxColors.primaryCTAText }}>{content.primaryButtonText}</a>}
              {content.countdownText && <span className="text-slate-500 text-sm">{content.countdownText}</span>}
            </div>
          </div>
        </div>
        {slides.length > 1 && <div className="absolute top-4 right-4 flex items-center gap-2 z-20"><button onClick={() => { setCurrentSlide((prev) => prev === 0 ? slides.length - 1 : prev - 1); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}><svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button><span className="text-white/80 text-xs font-medium px-2">{currentSlide + 1} / {slides.length}</span><button onClick={() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}><svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button></div>}
      </div>
    </section>
  );
}
