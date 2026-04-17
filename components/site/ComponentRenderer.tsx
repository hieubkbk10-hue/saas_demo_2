'use client';

import React from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from './hooks';
import { cn } from '@/app/admin/components/ui';
import { resolveTypeOverrideColors } from '@/app/admin/home-components/_shared/lib/typeColorOverride';
import { resolveTypeOverrideFont } from '@/app/admin/home-components/_shared/lib/typeFontOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '@/app/admin/home-components/_shared/lib/productPrice';
import { getProductImageAspectRatioCssValue, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import {
  getBentoColors,
  getFadeColors,
  getFullscreenColors,
  getParallaxColors,
  getSliderColors,
  getSplitColors,
} from '@/app/admin/home-components/hero/_lib/colors';
import {
  getCardsColors,
  getCounterColors,
  getGradientColors,
  getHorizontalColors,
  getIconsColors,
  getMinimalColors,
} from '@/app/admin/home-components/stats/_lib/colors';
import { getCategoryProductsColors } from '@/app/admin/home-components/category-products/_lib/colors';
import { getProductCategoriesColors } from '@/app/admin/home-components/product-categories/_lib/colors';
import { getCTAColors } from '@/app/admin/home-components/cta/_lib/colors';
import { CTASectionShared } from '@/app/admin/home-components/cta/_components/CTASectionShared';
import { BenefitsSectionShared } from '@/app/admin/home-components/benefits/_components/BenefitsSectionShared';
import { getBenefitsSectionColors, normalizeBenefitsHarmony } from '@/app/admin/home-components/benefits/_lib/colors';
import { FaqSectionShared } from '@/app/admin/home-components/faq/_components/FaqSectionShared';
import { getFaqColors } from '@/app/admin/home-components/faq/_lib/colors';
import { getTestimonialsSectionColors } from '@/app/admin/home-components/testimonials/_lib/colors';
import { getGalleryColorTokens, normalizeGalleryHarmony, type GalleryColorTokens } from '@/app/admin/home-components/gallery/_lib/colors';
import { getFooterLayoutColors, type FooterLayoutColors } from '@/app/admin/home-components/footer/_lib/colors';
import type { ProcessBrandMode } from '@/app/admin/home-components/process/_types';
import { normalizeProcessRenderSteps, normalizeProcessStyle } from '@/app/admin/home-components/process/_lib/normalize';
import { ProcessSectionShared } from '@/app/admin/home-components/process/_components/ProcessSectionShared';
import { FeaturesSectionShared } from '@/app/admin/home-components/features/_components/FeaturesSectionShared';
import { ClientsSectionShared, normalizeClientItems, normalizeClientsStyleSafe } from '@/app/admin/home-components/clients/_components/ClientsSectionShared';
import { getClientsColorTokens } from '@/app/admin/home-components/clients/_lib/colors';
import { getGalleryMarqueeBaseItems } from '@/app/admin/home-components/gallery/_lib/constants';
import { ServicesSectionCore } from './ServicesSectionCore';
import type { ServiceItem, ServicesStyle } from '@/app/admin/home-components/services/_types';
import { getServicesColors } from '@/app/admin/home-components/services/_lib/colors';
import type { BenefitsStyle as BenefitsSharedStyle } from '@/app/admin/home-components/benefits/_types';
import { PartnersMarqueeShared } from '@/app/admin/home-components/partners/_components/PartnersMarqueeShared';
import { PartnersBadgeShared } from '@/app/admin/home-components/partners/_components/PartnersBadgeShared';
import { PartnersCarouselShared } from '@/app/admin/home-components/partners/_components/PartnersCarouselShared';
import { PartnersFeaturedShared } from '@/app/admin/home-components/partners/_components/PartnersFeaturedShared';
import { PartnersGridShared } from '@/app/admin/home-components/partners/_components/PartnersGridShared';
import type { FooterBrandMode, FooterStyle } from '@/app/admin/home-components/footer/_types';
import type { ClientsBrandMode } from '@/app/admin/home-components/clients/_types';
import type { CTAStyle } from '@/app/admin/home-components/cta/_types';
import type { BenefitItem, BenefitsBrandMode, BenefitsConfig } from '@/app/admin/home-components/benefits/_types';
import type { FaqConfig, FaqItem, FaqStyle } from '@/app/admin/home-components/faq/_types';
import { BrandBadge } from './shared/BrandColorHelpers';
const BlogSection = dynamic(
  () => import('./BlogSection').then((mod) => ({ default: mod.BlogSection })),
  { ssr: false, loading: () => null }
);
const ProductListSection = dynamic(
  () => import('./ProductListSection').then((mod) => ({ default: mod.ProductListSection })),
  { ssr: false, loading: () => null }
);
const ServiceListSection = dynamic(
  () => import('./ServiceListSection').then((mod) => ({ default: mod.ServiceListSection })),
  { ssr: false, loading: () => null }
);
import { HomepageCategoryHeroSection } from './HomepageCategoryHeroSection';
import { getHomepageCategoryHeroColors } from '@/app/admin/home-components/homepage-category-hero/_lib/colors';
import { PricingSection as PricingSectionRuntime } from './PricingSection';
import { CareerSection as CareerSectionRuntime } from './CareerSection';
import { VoucherPromotionsSection as VoucherPromotionsSectionRuntime } from './VoucherPromotionsSection';
import { AboutSection } from './AboutSection';
import { TeamSection as TeamSectionRuntime } from './TeamSection';
import { VideoSectionShared } from '@/app/admin/home-components/video/_components/VideoSectionShared';
import { getVideoColorTokens } from '@/app/admin/home-components/video/_lib/colors';
import {
  normalizeVideoConfig,
  normalizeVideoStyle,
} from '@/app/admin/home-components/video/_lib/constants';
import type { VideoBrandMode } from '@/app/admin/home-components/video/_types';
import { ContactSection as ContactSectionRuntime } from './ContactSection';
import { CaseStudySection } from './CaseStudySection';
import { SpeedDialSection } from './SpeedDialSection';
import { CountdownSectionWrapper } from './CountdownSectionWrapper';
import type { HomepageCategoryHeroConfig } from '@/app/admin/home-components/homepage-category-hero/_types';
import { ProductImageFrameOverlay, useProductFrameConfig } from '@/components/shared/ProductImageFrameBox';
import {
  ArrowRight, ArrowUpRight,
  ChevronLeft, ChevronRight, Globe,
  Image as ImageIcon, LayoutTemplate, Maximize2, Package, Plus,
  Star, X, ZoomIn
} from 'lucide-react';

type SiteImageProps = Omit<React.ComponentProps<typeof Image>, 'width' | 'height' | 'src'> & {
  src?: React.ComponentProps<typeof Image>['src'];
  width?: number | string;
  height?: number | string;
  sizes?: string;
};

const SiteImage = ({ src, alt = '', width = 1200, height = 800, sizes = '100vw', mode = 'primary', ...rest }: SiteImageProps) => {
  if (!src) {return null;}
  const normalizedWidth = typeof width === 'string' ? Number.parseInt(width, 10) || 1200 : width;
  const normalizedHeight = typeof height === 'string' ? Number.parseInt(height, 10) || 800 : height;
  const fetchPriority = rest.priority ? 'high' : rest.fetchPriority;

  return (
    <Image
      src={src}
      {...rest}
      fetchPriority={fetchPriority}
      alt={alt}
      width={normalizedWidth}
      height={normalizedHeight}
      sizes={sizes}
      mode={mode}
    />
  );
};

const useSafeId = (prefix: string) => {
  const id = React.useId();
  return `${prefix}-${id.replaceAll(':', '')}`;
};

const DEFAULT_COUNTDOWN_END_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

interface HomeComponent {
  _id: string;
  type: string;
  title: string;
  active: boolean;
  order: number;
  config: Record<string, unknown>;
}

interface ComponentRendererProps {
  component: HomeComponent;
}

export function ComponentRenderer({ component }: ComponentRendererProps) {
  const systemColors = useBrandColors();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const { type, title, config } = component;
  const resolvedColors = resolveTypeOverrideColors({
    type,
    systemColors,
    overrides: systemConfig?.typeColorOverrides ?? null,
  });
  const resolvedFont = resolveTypeOverrideFont({
    type,
    overrides: systemConfig?.typeFontOverrides ?? null,
    globalOverride: systemConfig?.globalFontOverride ?? null,
  });
  const fontStyle = { '--font-active': `var(${resolvedFont.fontVariable})` } as React.CSSProperties;
  const wrapWithFont = (node: React.ReactNode) => (
    <div className="font-active" style={fontStyle}>{node}</div>
  );

  // Render component dựa vào type
  switch (type) {
    case 'Hero': {
      return wrapWithFont(
        <HeroSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} />
      );
    }
    case 'HomepageCategoryHero': {
      const heroTokens = getHomepageCategoryHeroColors(
        resolvedColors.primary,
        resolvedColors.secondary,
        resolvedColors.mode,
      );
      return wrapWithFont(
        <HomepageCategoryHeroSection
          config={config as unknown as HomepageCategoryHeroConfig}
          brandColor={resolvedColors.primary}
          secondary={resolvedColors.secondary}
          mode={resolvedColors.mode}
          tokens={heroTokens}
        />
      );
    }
    case 'Stats': {
      return wrapWithFont(
        <StatsSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'About': {
      return wrapWithFont(
        <AboutSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Services': {
      return wrapWithFont(
        <ServicesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Benefits': {
      return wrapWithFont(
        <BenefitsSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'FAQ': {
      return wrapWithFont(
        <FAQSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'CTA': {
      return wrapWithFont(
        <CTASection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} />
      );
    }
    case 'Testimonials': {
      return wrapWithFont(
        <TestimonialsSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Contact': {
      return wrapWithFont(
        <ContactSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Gallery':
    case 'Partners': {
      return wrapWithFont(
        <GallerySection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} type={type} />
      );
    }
    case 'TrustBadges': {
      return wrapWithFont(
        <TrustBadgesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Pricing': {
      return wrapWithFont(
        <PricingSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'ProductList': {
      return wrapWithFont(
        <ProductListSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'ProductGrid': {
      return wrapWithFont(
        <ProductListSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'ServiceList': {
      return wrapWithFont(
        <ServiceListSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Blog': {
      return wrapWithFont(
        <BlogSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Career': {
      return wrapWithFont(
        <CareerSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'CaseStudy': {
      return wrapWithFont(
        <CaseStudySection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'SpeedDial': {
      return wrapWithFont(
        <SpeedDialSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'ProductCategories': {
      return wrapWithFont(
        <ProductCategoriesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'CategoryProducts': {
      return wrapWithFont(
        <CategoryProductsSection
          config={config}
          brandColor={resolvedColors.primary}
          secondary={resolvedColors.secondary}
          mode={resolvedColors.mode}
          title={title}
        />
      );
    }
    case 'Team': {
      return wrapWithFont(
        <TeamSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Features': {
      return wrapWithFont(
        <FeaturesSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Process': {
      return wrapWithFont(
        <ProcessSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Clients': {
      return wrapWithFont(
        <ClientsSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Video': {
      return wrapWithFont(
        <VideoSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Countdown': {
      return wrapWithFont(
        <CountdownSectionWrapper config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} title={title} />
      );
    }
    case 'VoucherPromotions': {
      return wrapWithFont(
        <VoucherPromotionsSectionRuntime config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} title={title} />
      );
    }
    case 'Footer': {
      return wrapWithFont(
        <FooterSection config={config} brandColor={resolvedColors.primary} secondary={resolvedColors.secondary} mode={resolvedColors.mode} />
      );
    }
    default: {
      return wrapWithFont(<PlaceholderSection type={type} title={title} />);
    }
  }
}

// ============ HERO SECTION ============
// Best Practice: Blurred Background Fill - fills letterbox gaps with blurred version of same image
// Supports 6 styles: slider, fade, bento, fullscreen, split, parallax
type HeroStyle = 'slider' | 'fade' | 'bento' | 'fullscreen' | 'split' | 'parallax';

interface HeroContent {
  badge?: string;
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  countdownText?: string;
  showFullscreenContent?: boolean;
}

function HeroSection({
  config,
  brandColor,
  secondary,
  mode,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
}) {
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
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () =>{  clearInterval(timer); };
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

  // Helper: Render slide với blurred background
  const renderSlideWithBlur = (slide: { image: string; link: string }, options?: { priority?: boolean }) => (
    <a href={slide.link || '#'} className="block w-full h-full relative">
      <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(30px)' }} />
      <div className="absolute inset-0 bg-black/20" />
      <SiteImage src={slide.image} alt="" className="relative w-full h-full object-contain z-10" priority={options?.priority} />
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
      setCurrentSlide(prev => (prev + 1) % slides.length);
      return;
    }

    setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1);
  };

  // Style 1: Slider
  if (style === 'slider') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div
          className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[400px] md:max-h-[550px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-900 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{ '--tw-ring-color': sliderColors.hoverRingColor } as React.CSSProperties}
            >
              {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0 }) : renderPlaceholder(sliderColors.placeholderBg, sliderColors.placeholderIconColor)}
            </div>
          ))}
          {slides.length > 1 && (
            <>
              <button onClick={() =>{  setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg hidden md:flex items-center justify-center transition-all z-20 border-2" style={{ backgroundColor: sliderColors.navButtonBg, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}` }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: sliderColors.navButtonIconColor }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() =>{  setCurrentSlide(prev => (prev + 1) % slides.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg hidden md:flex items-center justify-center transition-all z-20 border-2" style={{ backgroundColor: sliderColors.navButtonBgHover, borderColor: sliderColors.navButtonBorderColor, boxShadow: `0 0 0 2px ${sliderColors.navButtonOuterRing}` }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: sliderColors.navButtonIconColor }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, idx) => (
                  <button key={idx} onClick={() =>{  setCurrentSlide(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === currentSlide ? sliderColors.dotActive : sliderColors.dotInactive }} />
                ))}
              </div>
              <div className="absolute bottom-2 left-0 right-0 h-0.5 z-20" style={{ backgroundColor: sliderColors.progressBarInactive }}>
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
        </div>
      </section>
    );
  }

  // Style 2: Fade with Thumbnails
  if (style === 'fade') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[450px] md:max-h-[600px]">
          {slides.map((slide, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? renderSlideWithBlur(slide, { priority: idx === 0 }) : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor)}
            </div>
          ))}
          {slides.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent z-20">
              {slides.map((slide, idx) => (
                <button key={idx} onClick={() =>{  setCurrentSlide(idx); }} className={`rounded overflow-hidden transition-all border-2 w-16 h-10 md:w-20 md:h-12 ${idx === currentSlide ? 'scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} style={idx === currentSlide ? { borderColor: fadeColors.thumbnailBorderActive } : { borderColor: fadeColors.thumbnailBorderInactive }}>
                  {slide.image ? <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" /> : renderPlaceholder(fadeColors.placeholderBg, fadeColors.placeholderIconColor, 18)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Style 3: Bento Grid
  if (style === 'bento') {
    const bentoSlides = slides.slice(0, 4);
    const bentoPlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0'];
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden p-2 md:p-4">
        <div className="max-h-[400px] md:max-h-[550px]">
          {/* Mobile: 2x2 grid */}
          <div className="grid grid-cols-2 gap-2 md:hidden" style={{ height: '320px' }}>
            {bentoSlides.slice(0, 4).map((slide, idx) => (
              <a key={idx} href={slide.link || '#'} className="relative rounded-xl overflow-hidden">
                {slide.image ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${slide.image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                    <div className="absolute inset-0 bg-black/20" />
                    <SiteImage src={slide.image} alt="" className="relative w-full h-full object-contain z-10" priority={idx === 0} />
                  </div>
                ) : (
                  renderPlaceholder(bentoPlaceholders[idx] ?? bentoColors.gridTint1, bentoColors.placeholderIcon, 20)
                )}
              </a>
            ))}
          </div>
          {/* Desktop: Bento layout */}
          <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3" style={{ height: '500px' }}>
            <a href={bentoSlides[0]?.link || '#'} className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden ring-2 ring-offset-1 ring-offset-slate-900" style={{ '--tw-ring-color': bentoColors.mainImageRing } as React.CSSProperties}>
              {bentoSlides[0]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[0].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(25px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[0].image} alt="" className="relative w-full h-full object-contain z-10" priority />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[0], bentoColors.placeholderIcon, 24)}
            </a>
            <a href={bentoSlides[1]?.link || '#'} className="col-span-2 relative rounded-2xl overflow-hidden">
              {bentoSlides[1]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[1].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(20px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[1].image} alt="" className="relative w-full h-full object-contain z-10" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[1], bentoColors.placeholderIcon, 22)}
            </a>
            <a href={bentoSlides[2]?.link || '#'} className="relative rounded-2xl overflow-hidden">
              {bentoSlides[2]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[2].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[2].image} alt="" className="relative w-full h-full object-contain z-10" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[2], bentoColors.placeholderIcon, 20)}
            </a>
            <a href={bentoSlides[3]?.link || '#'} className="relative rounded-2xl overflow-hidden">
              {bentoSlides[3]?.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bentoSlides[3].image})`, backgroundPosition: 'center', backgroundSize: 'cover', filter: 'blur(15px)' }} />
                  <div className="absolute inset-0 bg-black/20" />
                  <SiteImage src={bentoSlides[3].image} alt="" className="relative w-full h-full object-contain z-10" />
                </div>
              ) : renderPlaceholder(bentoPlaceholders[3], bentoColors.placeholderIcon, 20)}
            </a>
          </div>
        </div>
      </section>
    );
  }

  const renderHeroSlideContain = (
    slide: { image?: string },
    options?: { overlay?: React.ReactNode; blur?: number; fit?: 'contain' | 'cover'; priority?: boolean }
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
      <SiteImage
        src={slide.image ?? ''}
        alt=""
        className={cn(
          'relative w-full h-full z-10',
          options?.fit === 'cover' ? 'object-cover' : 'object-contain'
        )}
        priority={options?.priority}
      />
      {options?.overlay}
    </div>
  );

  // Style 4: Fullscreen - Hero toàn màn hình với CTA overlay
  if (style === 'fullscreen') {
    const showFullscreenContent = content.showFullscreenContent !== false;
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full h-[400px] md:h-[550px] lg:h-[650px]">
          {slides.map((slide, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? (
                renderHeroSlideContain(slide, {
                  fit: 'cover',
                  priority: idx === 0,
                  overlay: showFullscreenContent ? (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20" />
                  ) : null,
                })
              ) : renderPlaceholder(fullscreenColors.placeholderBg, fullscreenColors.placeholderIcon)}
            </div>
          ))}
          {/* CTA Overlay Content */}
          {showFullscreenContent && (
            <div className="absolute inset-0 z-30 flex flex-col justify-center px-4 md:px-8 lg:px-16">
              <div className="max-w-xl space-y-4 md:space-y-6">
                {content.badge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: fullscreenColors.badgeBg, color: fullscreenColors.badgeText }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: fullscreenColors.badgeDotPulse }} />
                    {content.badge}
                  </div>
                )}
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {content.heading ?? 'Tiêu đề chính'}
                </h1>
                {content.description && (
                  <p className="text-white/80 text-sm md:text-lg">
                    {content.description}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  {content.primaryButtonText && (
                    <a href={primaryHref} className="px-6 py-3 font-medium rounded-lg text-center" style={{ backgroundColor: fullscreenColors.primaryCTA, color: fullscreenColors.primaryCTAText }}>
                      {content.primaryButtonText}
                    </a>
                  )}
                  {content.secondaryButtonText && (
                    <a href={secondaryHref} className="px-6 py-3 font-medium rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors text-center">
                      {content.secondaryButtonText}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Navigation dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-2 z-40">
              {slides.map((_, idx) => (
                <button key={idx} onClick={() =>{  setCurrentSlide(idx); }} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'w-8' : ''}`} style={{ backgroundColor: idx === currentSlide ? fullscreenColors.dotActive : fullscreenColors.dotInactive }} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Style 5: Split - Layout chia đôi (Content + Image)
  if (style === 'split') {
    return (
      <section className="relative w-full bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row md:h-[450px] lg:h-[550px]">
          {/* Content Side */}
          <div className="w-full md:w-1/2 flex flex-col justify-center bg-slate-50 p-6 md:p-10 lg:p-16 order-2 md:order-1">
            <div className="max-w-md space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: splitColors.badgeBg, color: splitColors.badgeText }}>
                {content.badge ?? `Banner ${currentSlide + 1}/${slides.length}`}
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                {content.heading ?? 'Tiêu đề nổi bật'}
              </h2>
              {content.description && (
                <p className="text-slate-600 text-base md:text-lg">
                  {content.description}
                </p>
              )}
              {content.primaryButtonText && (
                <div className="pt-2">
                  <a href={primaryHref} className="inline-block px-6 py-3 font-medium rounded-lg" style={{ backgroundColor: splitColors.primaryCTA, color: splitColors.primaryCTAText }}>
                    {content.primaryButtonText}
                  </a>
                </div>
              )}
            </div>
            {/* Slide indicators */}
            {slides.length > 1 && (
              <div className="flex gap-2 mt-8">
                {slides.map((_, idx) => (
                  <button key={idx} onClick={() =>{  setCurrentSlide(idx); }} className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'w-10' : 'w-6'}`} style={{ backgroundColor: idx === currentSlide ? splitColors.progressDotActive : splitColors.progressDotInactive }} />
                ))}
              </div>
            )}
          </div>
          {/* Image Side */}
          <div className="w-full md:w-1/2 h-[280px] md:h-full relative overflow-hidden order-1 md:order-2">
            {slides.map((slide, idx) => (
              <div key={idx} className={`absolute inset-0 transition-all duration-700 ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                {slide.image ? (
                  <SiteImage src={slide.image} alt="" className="w-full h-full object-cover" priority={idx === 0} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <LayoutTemplate size={48} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            {/* Navigation arrows */}
            {slides.length > 1 && (
              <>
                <button onClick={() =>{  setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                  <svg className="w-5 h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() =>{  setCurrentSlide(prev => (prev + 1) % slides.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-10" style={{ backgroundColor: splitColors.navButtonBg, boxShadow: `0 0 0 2px ${splitColors.navButtonOuterRing}` }}>
                  <svg className="w-5 h-5" style={{ color: splitColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Style 6: Parallax - Hiệu ứng layer với floating card
  if (style === 'parallax') {
    return (
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full h-[350px] md:h-[450px] lg:h-[550px]">
          {slides.map((slide, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {slide.image ? (
                renderHeroSlideContain(slide, {
                  priority: idx === 0,
                  overlay: (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-20" />
                  ),
                })
              ) : renderPlaceholder(parallaxColors.placeholderBg, parallaxColors.placeholderIcon)}
            </div>
          ))}
          {/* Floating content card */}
          <div className="absolute z-10 inset-x-4 md:inset-x-8 bottom-4 md:bottom-8 flex items-end">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 md:p-6 max-w-lg">
              {content.badge && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: parallaxColors.cardBadgeDot }} />
                  <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full" style={{ backgroundColor: parallaxColors.cardBadgeBg, color: parallaxColors.cardBadgeText }}>{content.badge}</span>
                </div>
              )}
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                {content.heading ?? 'Tiêu đề nổi bật'}
              </h3>
              {content.description && (
                <p className="text-slate-600 text-sm mt-1">
                  {content.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-4">
                {content.primaryButtonText && (
                  <a href={primaryHref} className="px-5 py-2 font-medium rounded-lg text-sm" style={{ backgroundColor: parallaxColors.primaryCTA, color: parallaxColors.primaryCTAText }}>
                    {content.primaryButtonText}
                  </a>
                )}
                {content.countdownText && (
                  <span className="text-slate-500 text-sm">{content.countdownText}</span>
                )}
              </div>
            </div>
          </div>
          {/* Top navigation bar */}
          {slides.length > 1 && (
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button onClick={() =>{  setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                <svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-white/80 text-xs font-medium px-2">{currentSlide + 1} / {slides.length}</span>
              <button onClick={() =>{  setCurrentSlide(prev => (prev + 1) % slides.length); }} className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" style={{ backgroundColor: parallaxColors.navButtonBg, boxShadow: `0 0 0 2px ${parallaxColors.navButtonOuterRing}` }}>
                <svg className="w-4 h-4" style={{ color: parallaxColors.navButtonIcon }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}

// ============ STATS SECTION ============
// Professional Stats UI/UX - 6 Variants
type StatsStyle = 'horizontal' | 'cards' | 'icons' | 'gradient' | 'minimal' | 'counter';
function StatsSection({ config, brandColor, secondary, mode, title: _title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string }) {
  void _title;
  const items = (config.items as { value: string; label: string }[]) || [];
  const style = (config.style as StatsStyle) || 'horizontal';

  // Style 1: Thanh ngang - Full width bar với dividers
  if (style === 'horizontal') {
    const colors = getHorizontalColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div 
            className="w-full rounded-lg shadow-sm overflow-hidden border"
            style={{ backgroundColor: 'white', borderColor: colors.border }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex-1 w-full py-6 px-4 flex flex-col items-center justify-center text-center cursor-default"
                >
                  <span className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums leading-none mb-1" style={{ color: brandColor }}>
                    {item.value}
                  </span>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    {item.label}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Style 2: Cards - Grid cards với hover effects và accent line
  if (style === 'cards') {
    const colors = getCardsColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white border rounded-xl p-5 flex flex-col items-center text-center shadow-sm"
                style={{ borderColor: colors.border }}
              >
                <span 
                  className="text-3xl font-bold mb-1 tracking-tight tabular-nums"
                  style={{ color: brandColor }}
                >
                  {item.value}
                </span>
                <h3 className="text-sm font-semibold text-slate-700">
                  {item.label}
                </h3>
                {/* Minimal accent line */}
                <div 
                  className="w-8 h-0.5 rounded-full mt-3"
                  style={{ backgroundColor: colors.accent }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Style 3: Icon Grid - Circle containers với shadow và hover scale
  if (style === 'icons') {
    const colors = getIconsColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {/* Circle Container with shadow and border */}
                <div
                  className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-3 border shadow-sm"
                  style={{
                    backgroundColor: colors.circleBg,
                    borderColor: colors.ring,
                  }}
                >
                  <span className="text-2xl md:text-3xl font-bold tracking-tight z-10 tabular-nums" style={{ color: colors.textOnCircle }}>
                    {item.value}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-800" style={{ color: colors.label }}>
                  {item.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Style 4: Gradient - Glass morphism với gradient background
  if (style === 'gradient') {
    const colors = getGradientColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div 
            className="rounded-2xl overflow-hidden border"
            style={{ 
              background: colors.background,
              borderColor: colors.border
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4">
              {items.map((item, idx) => (
                <div 
                  key={idx}
                  className={`relative flex flex-col items-center justify-center text-center p-6 md:p-8 ${
                    idx !== items.length - 1 ? 'md:border-r md:border-white/10' : ''
                  }`}
                >
                  <span className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums leading-none mb-2" style={{ color: colors.text }}>
                    {item.value}
                  </span>
                  <h3 className="text-sm font-medium opacity-90 relative z-10" style={{ color: colors.label }}>
                    {item.label}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Style 5: Minimal - Clean, simple với typography focus
  if (style === 'minimal') {
    const colors = getMinimalColors(brandColor, secondary, mode);
    return (
      <section className="py-12 md:py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-start">
                {/* Accent line */}
                <div 
                  className="w-12 h-1 rounded-full mb-4"
                  style={{ backgroundColor: colors.accent }}
                />
                <span className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums leading-none" style={{ color: colors.value }}>
                  {item.value}
                </span>
                <h3 className="text-base font-medium text-slate-500 mt-2">
                  {item.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Style 6: Counter - Big numbers với animated feel & progress indicator
  const colors = getCounterColors(brandColor, secondary, mode);
  return (
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, idx) => (
            <div 
              key={idx}
              className="relative bg-white rounded-2xl border overflow-hidden shadow-sm"
              style={{ borderColor: colors.border }}
            >
              {/* Top progress bar */}
              <div className="h-1 w-full bg-slate-100">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    backgroundColor: colors.progress,
                    width: `${Math.min(100, (idx + 1) * 25)}%`
                  }}
                />
              </div>
              
              <div className="flex flex-col items-center justify-center text-center p-6">
                <span 
                  className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums leading-none"
                style={{ color: colors.value }}
                >
                  {item.value}
                </span>
                <h3 className="text-sm font-semibold text-slate-600 mt-2">
                  {item.label}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ SERVICES SECTION ============
function ServicesSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
}) {
  const items = (config.items as ServiceItem[]) || [];
  const style = (config.style as ServicesStyle) || 'elegantGrid';
  const colors = getServicesColors(brandColor, secondary, mode);

  return (
    <ServicesSectionCore
      items={items}
      style={style}
      title={title}
      colors={colors}
      isPreview={false}
    />
  );
}

// ============ BENEFITS SECTION ============
function BenefitsSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
}) {
  const benefitsConfig = config as {
    items?: Array<{ icon?: string; title?: string; description?: string }>;
    style?: BenefitsSharedStyle;
    subHeading?: string;
    heading?: string;
    headerAlign?: 'left' | 'center' | 'right';
    gridColumnsDesktop?: 3 | 4;
    gridColumnsMobile?: 1 | 2;
    buttonText?: string;
    buttonLink?: string;
    harmony?: unknown;
  };

  const items: BenefitItem[] = (benefitsConfig.items ?? []).map((item, idx) => ({
    description: item.description ?? '',
    icon: item.icon ?? 'Check',
    id: `benefits-site-${idx}`,
    title: item.title ?? '',
  }));

  const style: BenefitsSharedStyle = (
    benefitsConfig.style === 'cards'
    || benefitsConfig.style === 'list'
    || benefitsConfig.style === 'bento'
    || benefitsConfig.style === 'row'
    || benefitsConfig.style === 'carousel'
    || benefitsConfig.style === 'timeline'
  )
    ? benefitsConfig.style
    : 'cards';

  const harmony = normalizeBenefitsHarmony(benefitsConfig.harmony);

  const tokens = getBenefitsSectionColors({
    harmony,
    mode,
    primary: brandColor,
    secondary,
  });

  const sectionConfig: Pick<BenefitsConfig, 'subHeading' | 'heading' | 'buttonText' | 'buttonLink' | 'headerAlign' | 'gridColumnsDesktop' | 'gridColumnsMobile'> = {
    buttonLink: benefitsConfig.buttonLink,
    buttonText: benefitsConfig.buttonText,
    gridColumnsDesktop: benefitsConfig.gridColumnsDesktop,
    gridColumnsMobile: benefitsConfig.gridColumnsMobile,
    heading: benefitsConfig.heading,
    headerAlign: benefitsConfig.headerAlign,
    subHeading: benefitsConfig.subHeading,
  };

  return (
    <BenefitsSectionShared
      context="site"
      style={style}
      title={title}
      config={sectionConfig}
      items={items}
      tokens={tokens}
      mode={mode as BenefitsBrandMode}
    />
  );
}

// ============ FAQ SECTION ============
function FAQSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
}) {
  const faqConfig = config as {
    items?: Array<{ question?: string; answer?: string }>;
    style?: FaqStyle;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
  };

  const items: FaqItem[] = (faqConfig.items ?? []).map((item, idx) => ({
    id: idx,
    question: item.question ?? '',
    answer: item.answer ?? '',
  }));

  const style: FaqStyle = faqConfig.style ?? 'accordion';
  const sectionConfig: FaqConfig = {
    description: faqConfig.description,
    buttonText: faqConfig.buttonText,
    buttonLink: faqConfig.buttonLink,
  };

  const tokens = getFaqColors({
    primary: brandColor,
    secondary,
    mode,
    style,
  });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <FaqSectionShared
        items={items}
        title={title}
        style={style}
        config={sectionConfig}
        tokens={tokens}
        context="site"
      />
    </>
  );
}

// ============ CTA SECTION ============
function CTASection({
  config,
  brandColor,
  secondary,
  mode,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
}) {
  const ctaConfig = config as {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    badge?: string;
    style?: CTAStyle;
  };

  const style = ctaConfig.style ?? 'banner';

  const tokens = getCTAColors({
    primary: brandColor,
    secondary,
    mode,
    style,
  });

  return (
    <CTASectionShared
      config={{
        title: ctaConfig.title ?? '',
        description: ctaConfig.description ?? '',
        buttonText: ctaConfig.buttonText ?? '',
        buttonLink: ctaConfig.buttonLink ?? '',
        secondaryButtonText: ctaConfig.secondaryButtonText ?? '',
        secondaryButtonLink: ctaConfig.secondaryButtonLink ?? '',
        badge: ctaConfig.badge ?? '',
      }}
      style={style}
      tokens={tokens}
      context="site"
    />
  );
}

// ============ TESTIMONIALS SECTION ============
// 6 Professional Styles: Cards, Slider, Masonry, Quote, Carousel, Minimal
// Best Practices: Authenticity, Credibility indicators, Diverse formats, Mobile responsive
type TestimonialsStyle = 'cards' | 'slider' | 'masonry' | 'quote' | 'carousel' | 'minimal';

type TestimonialsRuntimeItem = {
  id?: string;
  avatar?: string;
  content?: string;
  name?: string;
  rating?: number;
  role?: string;
};
function TestimonialsSection({ config, brandColor, secondary, mode, title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string }) {
  const items = Array.isArray(config.items) ? (config.items as TestimonialsRuntimeItem[]) : [];
  const normalizedItems = React.useMemo(() => items.map((item, idx) => ({
    avatar: item.avatar ?? '',
    content: item.content ?? '',
    id: item.id ?? `testimonial-${idx + 1}`,
    name: item.name ?? '',
    rating: typeof item.rating === 'number' && Number.isFinite(item.rating)
      ? Math.max(1, Math.min(5, item.rating))
      : 5,
    role: item.role ?? '',
  })), [items]);
  const style = (config.style as TestimonialsStyle) || 'cards';
  const colors = getTestimonialsSectionColors({
    primary: brandColor,
    secondary,
    mode,
  });
  const carouselId = useSafeId('testimonials-carousel');
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const heading = title || 'Khách hàng nói gì về chúng tôi';
  const buildFallbackKey = (item: { id: string; name: string; role: string }, idx: number) => `${item.id}-${item.name}-${item.role}-${idx}`;

  // Auto slide for slider/quote styles
  React.useEffect(() => {
    if ((style !== 'slider' && style !== 'quote') || normalizedItems.length <= 1) {return;}
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % normalizedItems.length);
    }, 5000);
    return () =>{  clearInterval(timer); };
  }, [normalizedItems.length, style]);

  const renderStars = (rating: number, size: number = 16) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={`star-${star}`}
          size={size}
          className={star <= rating ? 'fill-current' : 'text-slate-300'}
          style={star <= rating ? { color: colors.ratingSecondary } : undefined}
        />
      ))}
    </div>
  );

  // Empty state
  if (normalizedItems.length === 0) {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: colors.neutralBackground }}>
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center rounded-xl border p-10 text-center" style={{ backgroundColor: colors.neutralSurface, borderColor: colors.cardBorder }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: colors.iconSurface }}>
            <Star size={28} style={{ color: colors.quoteSecondary }} />
          </div>
          <p className="font-semibold" style={{ color: colors.headingPrimary }}>Chưa có đánh giá nào</p>
          <p className="text-sm mt-1" style={{ color: colors.neutralMuted }}>Thêm đánh giá đầu tiên để xem preview</p>
        </div>
      </section>
    );
  }

  // Style 1: Cards - Grid layout with equal height
  if (style === 'cards') {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: colors.neutralBackground }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: colors.headingPrimary }}>{heading}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalizedItems.map((item, idx) => (
              <article
                key={buildFallbackKey(item, idx)}
                className="rounded-xl border p-5 flex flex-col h-full"
                style={{
                  backgroundColor: colors.cardSurface,
                  borderTopColor: colors.cardBorder,
                  borderRightColor: colors.cardBorder,
                  borderBottomColor: colors.cardBorder,
                  borderLeftColor: colors.cardBorder,
                }}
              >
                {renderStars(item.rating, 14)}
                <p className="mt-3 text-sm leading-relaxed flex-1 min-h-[64px]" style={{ color: colors.neutralMuted }}>
                  “{item.content || 'Nội dung đánh giá...'}”
                </p>
                <div className="mt-4 pt-4 border-t flex items-center gap-3" style={{ borderColor: colors.cardBorder }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: colors.primary, color: colors.avatarTextOnPrimary }}>
                    {(item.name || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: colors.headingPrimary }}>{item.name || 'Tên khách hàng'}</p>
                    <p className="text-xs truncate" style={{ color: colors.subtitleSecondary }}>{item.role || 'Chức vụ'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Style 2: Slider - Single testimonial with navigation
  if (style === 'slider') {
    const current = normalizedItems[currentSlide] || normalizedItems[0];
    if (!current) {return null;}

    return (
      <section className="py-12 md:py-16 px-4 relative overflow-hidden" style={{ backgroundColor: colors.neutralBackground }}>
        <div className="max-w-5xl mx-auto relative">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10" style={{ color: colors.headingPrimary }}>{heading}</h2>

          <div className="absolute right-2 top-10 text-[56px] md:text-[72px] leading-none font-serif pointer-events-none select-none opacity-60" style={{ color: colors.quoteSecondary }}>
            “
          </div>

          <article
            className="rounded-2xl border px-5 py-6 md:px-10 md:py-9 text-center"
            style={{
              backgroundColor: colors.cardSurface,
              borderTopColor: colors.cardBorderStrong,
              borderRightColor: colors.cardBorderStrong,
              borderBottomColor: colors.cardBorderStrong,
              borderLeftColor: colors.cardBorderStrong,
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-5">
              {renderStars(current.rating, 15)}
              <span
                className="text-xs font-medium rounded-full px-2.5 py-1 border"
                style={{ borderColor: colors.cardBorder, color: colors.subtitleSecondary }}
              >
                {currentSlide + 1}/{normalizedItems.length}
              </span>
            </div>

            <p className="mx-auto max-w-3xl text-base md:text-xl leading-8 md:leading-9 mb-7 md:mb-8" style={{ color: colors.neutralMuted }}>
              “{current.content || 'Nội dung đánh giá...'}”
            </p>

            <div className="mx-auto h-px w-20 mb-6" style={{ backgroundColor: colors.cardBorder }} />

            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: colors.primary, color: colors.avatarTextOnPrimary }}>
                {(current.name || 'U').charAt(0)}
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-sm md:text-base truncate" style={{ color: colors.headingPrimary }}>{current.name || 'Tên khách hàng'}</p>
                <p className="text-xs md:text-sm truncate" style={{ color: colors.subtitleSecondary }}>{current.role || 'Chức vụ'}</p>
              </div>
            </div>
          </article>

          {normalizedItems.length > 1 && (
            <div className="mt-7 flex items-center justify-center gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => { setCurrentSlide((prev) => (prev === 0 ? normalizedItems.length - 1 : prev - 1)); }}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                style={{ backgroundColor: colors.neutralSurface, borderColor: colors.buttonSecondaryBorder, color: colors.buttonSecondaryText }}
                aria-label="Slide trước"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center rounded-full border px-1 py-0.5" style={{ borderColor: colors.cardBorder, backgroundColor: colors.neutralSurface }}>
                {normalizedItems.map((_, idx) => (
                  <button
                    key={`slider-dot-${idx}`}
                    type="button"
                    onClick={() => { setCurrentSlide(idx); }}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    aria-label={`Đi tới slide ${idx + 1}`}
                  >
                    <span
                      className="block h-2.5 rounded-full transition-all"
                      style={{
                        backgroundColor: idx === currentSlide ? colors.dotActive : colors.dotInactive,
                        width: idx === currentSlide ? 24 : 10,
                      }}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setCurrentSlide((prev) => (prev + 1) % normalizedItems.length); }}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                style={{ backgroundColor: colors.neutralSurface, borderColor: colors.buttonSecondaryBorder, color: colors.buttonSecondaryText }}
                aria-label="Slide sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Style 3: Masonry - Pinterest-like layout
  if (style === 'masonry') {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: colors.neutralBackground }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: colors.headingPrimary }}>{heading}</h2>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {normalizedItems.map((item, idx) => (
              <article
                key={buildFallbackKey(item, idx)}
                className="break-inside-avoid mb-4 rounded-xl border p-5"
                style={{
                  backgroundColor: colors.cardSurface,
                  borderTopColor: colors.cardBorder,
                  borderRightColor: colors.cardBorder,
                  borderBottomColor: colors.cardBorder,
                  borderLeftColor: colors.cardBorder,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: colors.primary, color: colors.avatarTextOnPrimary }}>
                    {(item.name || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: colors.headingPrimary }}>{item.name || 'Tên khách hàng'}</p>
                    <p className="text-xs truncate" style={{ color: colors.subtitleSecondary }}>{item.role || 'Chức vụ'}</p>
                  </div>
                </div>
                {renderStars(item.rating, 13)}
                <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.neutralMuted }}>“{item.content || 'Nội dung đánh giá...'}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Style 4: Quote - Big quote focused, elegant typography
  if (style === 'quote') {
    const current = normalizedItems[currentSlide] || normalizedItems[0];
    if (!current) {return null;}

    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: colors.cardAltSurface }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-10" style={{ color: colors.headingPrimary }}>{heading}</h2>

          <article
            className="rounded-2xl border px-5 py-7 md:px-10 md:py-10"
            style={{
              backgroundColor: colors.cardSurface,
              borderTopColor: colors.cardBorder,
              borderRightColor: colors.cardBorder,
              borderBottomColor: colors.cardBorder,
              borderLeftColor: colors.cardBorder,
            }}
          >
            <div className="text-[44px] md:text-[56px] leading-none font-serif mb-3 md:mb-4 select-none opacity-70" style={{ color: colors.quoteSecondary }}>“</div>

            <blockquote className="mx-auto max-w-3xl text-lg md:text-2xl leading-8 md:leading-10" style={{ color: colors.headingPrimary }}>
              {current.content || 'Nội dung đánh giá...'}
            </blockquote>

            <div className="mt-7 md:mt-8 flex flex-col items-center gap-4">
              <div className="flex justify-center">{renderStars(current.rating, 16)}</div>
              <div className="h-px w-16" style={{ backgroundColor: colors.cardBorder }} />
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: colors.primary, color: colors.avatarTextOnPrimary }}>
                  {(current.name || 'U').charAt(0)}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate" style={{ color: colors.headingPrimary }}>{current.name || 'Tên khách hàng'}</p>
                  <p className="text-xs md:text-sm truncate" style={{ color: colors.subtitleSecondary }}>{current.role || 'Chức vụ'}</p>
                </div>
              </div>
            </div>
          </article>

          {normalizedItems.length > 1 && (
            <div className="mt-7 flex justify-center">
              <div className="flex items-center rounded-full border px-1 py-0.5" style={{ borderColor: colors.cardBorder, backgroundColor: colors.neutralSurface }}>
                {normalizedItems.map((_, idx) => (
                  <button
                    key={`quote-dot-${idx}`}
                    type="button"
                    onClick={() => { setCurrentSlide(idx); }}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    aria-label={`Đi tới quote ${idx + 1}`}
                  >
                    <span
                      className="block h-2.5 rounded-full transition-all"
                      style={{
                        backgroundColor: idx === currentSlide ? colors.dotActive : colors.dotInactive,
                        width: idx === currentSlide ? 22 : 10,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Style 5: Carousel - Horizontal scroll cards với navigation và drag
  if (style === 'carousel') {
    const cardWidth = 360;
    const gap = 24;
    const showArrowsDesktop = normalizedItems.length > 3;

    return (
      <section className="py-12 px-4" style={{ backgroundColor: colors.neutralBackground }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: colors.headingPrimary }}>{heading}</h2>
            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector<HTMLElement>(`#${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="w-10 h-10 rounded-full border flex items-center justify-center"
                  style={{ backgroundColor: colors.neutralSurface, borderColor: colors.buttonSecondaryBorder, color: colors.buttonSecondaryText }}
                  aria-label="Scroll testimonials trước"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector<HTMLElement>(`#${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="w-10 h-10 rounded-full border flex items-center justify-center"
                  style={{ backgroundColor: colors.neutralSurface, borderColor: colors.buttonSecondaryBorder, color: colors.buttonSecondaryText }}
                  aria-label="Scroll testimonials sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-4 md:w-6 z-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, ${colors.neutralBackground}, transparent)` }} />
            <div className="absolute right-0 top-0 bottom-0 w-4 md:w-6 z-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(to left, ${colors.neutralBackground}, transparent)` }} />

            <div
              id={carouselId}
              className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {normalizedItems.map((item, idx) => (
                <article
                  key={buildFallbackKey(item, idx)}
                  className="flex-shrink-0 snap-start w-[300px] rounded-xl border p-5"
                  style={{
                    backgroundColor: colors.cardSurface,
                    borderTopColor: colors.cardBorderStrong,
                    borderRightColor: colors.cardBorderStrong,
                    borderBottomColor: colors.cardBorderStrong,
                    borderLeftColor: colors.cardBorderStrong,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: colors.primary, color: colors.avatarTextOnPrimary }}>
                      {(item.name || 'U').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: colors.headingPrimary }}>{item.name || 'Tên khách hàng'}</p>
                      <p className="text-xs truncate" style={{ color: colors.subtitleSecondary }}>{item.role || 'Chức vụ'}</p>
                    </div>
                  </div>

                  {renderStars(item.rating, 13)}
                  <p className="mt-3 text-sm leading-relaxed line-clamp-4" style={{ color: colors.neutralMuted }}>
                    “{item.content || 'Nội dung đánh giá...'}”
                  </p>
                </article>
              ))}
            </div>
          </div>

          <style>{`#${carouselId}::-webkit-scrollbar { display: none; }`}</style>
        </div>
      </section>
    );
  }

  // Style 6: Minimal - Clean list with accent line
  return (
    <section className="py-12 px-4" style={{ backgroundColor: colors.neutralBackground }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: colors.headingPrimary }}>{heading}</h2>
        <div className="space-y-4">
          {normalizedItems.map((item, idx) => (
            <article
              key={buildFallbackKey(item, idx)}
              className="rounded-lg border-l-4 border p-4 flex gap-3"
              style={{
                backgroundColor: colors.cardSurface,
                borderLeftColor: colors.quoteSecondary,
                borderTopColor: colors.cardBorder,
                borderRightColor: colors.cardBorder,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{ backgroundColor: colors.primary, color: colors.avatarTextOnPrimary }}>
                {(item.name || 'U').charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-sm truncate" style={{ color: colors.headingPrimary }}>{item.name || 'Tên khách hàng'}</span>
                  <span className="text-xs" style={{ color: colors.neutralMuted }}>•</span>
                  <span className="text-xs truncate" style={{ color: colors.subtitleSecondary }}>{item.role || 'Chức vụ'}</span>
                  <div className="ml-auto">{renderStars(item.rating, 11)}</div>
                </div>
                <p className="text-sm line-clamp-2" style={{ color: colors.neutralMuted }}>“{item.content || 'Nội dung đánh giá...'}”</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: colors.buttonSecondaryHoverBg,
              borderColor: colors.buttonSecondaryBorder,
              color: colors.buttonSecondaryText,
            }}
          >
            Xem thêm đánh giá
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ============ GALLERY/PARTNERS SECTION ============
// Gallery: 6 Professional Styles (Spotlight, Explore, Stories, Grid, Marquee, Masonry)
// Partners: 6 Professional Styles (Grid, Marquee, Mono, Badge, Carousel, Featured)
type GalleryStyle = 'spotlight' | 'explore' | 'stories' | 'grid' | 'marquee' | 'masonry' | 'mono' | 'badge' | 'carousel' | 'featured';

// Auto Scroll Slider Component for Marquee/Mono styles
const _AutoScrollSlider = ({ children, speed = 0.5, isPaused }: { children: React.ReactNode; speed?: number; isPaused?: boolean }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const paused = isPaused ?? isHovered;

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) {return;}

    let animationId: number;
    let position = scroller.scrollLeft;

    const step = () => {
      if (!paused && scroller) {
        position += speed;
        if (position >= scroller.scrollWidth / 3) {
          position = 0;
        }
        scroller.scrollLeft = position;
      } else if (scroller) {
        position = scroller.scrollLeft;
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () =>{  cancelAnimationFrame(animationId); };
  }, [paused, speed]);

  return (
    <div 
      ref={scrollRef}
      className="flex overflow-x-auto cursor-grab active:cursor-grabbing touch-pan-x"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      onMouseEnter={() =>{  setIsHovered(true); }}
      onMouseLeave={() =>{  setIsHovered(false); }}
      onTouchStart={() =>{  setIsHovered(true); }}
      onTouchEnd={() =>{  setIsHovered(false); }}
    >
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="flex shrink-0 gap-16 items-center px-4">{children}</div>
      <div className="flex shrink-0 gap-16 items-center px-4">{children}</div>
      <div className="flex shrink-0 gap-16 items-center px-4">{children}</div>
    </div>
  );
};

// Lightbox Component for Gallery
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
        className="absolute top-4 right-4 p-2 rounded-full border transition-colors z-[70]"
        style={{
          backgroundColor: colors.lightboxControlBg,
          borderColor: colors.lightboxControlBorder,
          color: colors.lightboxControlIcon,
        }}
        aria-label="Đóng"
      >
        <X size={24} />
      </button>
      {hasMultiple && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border flex items-center justify-center transition-colors z-[70]"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border flex items-center justify-center transition-colors z-[70]"
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
      {hasMultiple && typeof currentIndex === 'number' && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm z-[70] px-3 py-1 rounded-full border"
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
        <SiteImage 
          src={photo.url} 
          alt="Lightbox" 
          className="max-h-[90vh] max-w-full object-contain shadow-sm animate-in zoom-in-95 duration-300" 
        />
      </div>
    </div>
  );
};

// ============ TRUST BADGES / CERTIFICATIONS SECTION ============
// 6 Styles: grid, cards, marquee, wall, carousel, featured

type TrustBadgesStyle = 'grid' | 'cards' | 'marquee' | 'wall' | 'carousel' | 'featured';
interface TrustBadgeItem { url: string; link?: string; name?: string }

// Auto Scroll component for TrustBadges Marquee
const TrustBadgesAutoScroll = ({ children, speed = 0.6 }: { children: React.ReactNode; speed?: number }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) {return;}

    let animationId: number;
    let position = scroller.scrollLeft;

    const step = () => {
      if (!isPaused && scroller) {
        position += speed;
        if (position >= scroller.scrollWidth / 2) {
          position = 0;
        }
        scroller.scrollLeft = position;
      } else if (scroller) {
        position = scroller.scrollLeft;
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () =>{  cancelAnimationFrame(animationId); };
  }, [isPaused, speed]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div
        ref={scrollRef}
        className="flex overflow-hidden select-none w-full cursor-grab active:cursor-grabbing"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
        }}
        onMouseEnter={() =>{  setIsPaused(true); }}
        onMouseLeave={() =>{  setIsPaused(false); }}
      >
        <div className="flex shrink-0 gap-16 md:gap-20 items-center px-4">{children}</div>
        <div className="flex shrink-0 gap-16 md:gap-20 items-center px-4">{children}</div>
      </div>
    </div>
  );
};

// Modal Lightbox for viewing certificates
const CertificateModal = ({ 
  item, 
  isOpen, 
  onClose 
}: { 
  item: TrustBadgeItem | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item || !item.url) {return null;}

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all focus:outline-none z-50"
        aria-label="Close modal"
      >
        <X size={32} />
      </button>
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] p-4 flex flex-col items-center justify-center"
        onClick={(e) =>{  e.stopPropagation(); }}
      >
        <div className="relative w-auto h-auto flex flex-col items-center">
          <SiteImage 
            src={item.url} 
            alt={item.name ?? ''} 
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white p-2 md:p-4 animate-in zoom-in-95 duration-300" 
          />
          {item.name && (
            <p className="mt-4 text-white/90 text-lg md:text-xl font-medium tracking-wide text-center">
              {item.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

function TrustBadgesSection({
  config,
  brandColor,
  secondary,
  mode,
  title: _title,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
}) {
  const items = (config.items as TrustBadgeItem[]) || [];
  const style = (config.style as TrustBadgesStyle) || 'cards';
  const carouselId = useSafeId('trustbadges-carousel');
  const [selectedCert, setSelectedCert] = React.useState<TrustBadgeItem | null>(null);
  const colors = getGalleryColorTokens({ primary: brandColor, secondary, mode });
  const heading = (config.heading as string) || 'Chứng nhận & Giải thưởng';
  const subHeading = (config.subHeading as string) || 'Được công nhận bởi các tổ chức uy tín';

  const renderHeader = (centered = true) => (
    <div className={cn("mb-10", centered ? 'text-center' : '')}>
      {subHeading ? (
        <div className={cn('mb-3', centered ? 'flex justify-center' : '')}>
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
      ) : null}
      <h2 className="text-2xl md:text-3xl font-bold" style={{ color: colors.heading }}>
        <span className="inline-block rounded-md px-2 py-1" style={{ backgroundColor: colors.neutralSurface }}>
          {heading}
        </span>
      </h2>
      <div className={cn("mt-3 h-1 w-12 rounded-full", centered ? 'mx-auto' : '')} style={{ backgroundColor: colors.sectionAccentBar }} />
    </div>
  );

  // Style 1: Square Grid - Full color, clickable to lightbox
  if (style === 'grid') {
    return (
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          {renderHeader(true)}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() =>{  setSelectedCert(item); }}
                className="group relative aspect-square rounded-xl flex items-center justify-center p-5 md:p-6 cursor-zoom-in transition-all duration-300 hover:-translate-y-1"
                style={{ border: `1px solid ${colors.neutralBorder}`, backgroundColor: colors.neutralSurface }}
              >
                {item.url ? (
                  <SiteImage src={item.url} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" alt={item.name ?? ''} />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.badgeBg }}>
                    <Maximize2 size={14} style={{ color: colors.badgeText }} />
                  </div>
                </div>
                {item.name && (
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <span className="text-[10px] font-medium text-slate-500 truncate block">{item.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 2: Feature Cards - Large cards with title, hover zoom
  if (style === 'cards') {
    return (
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          {renderHeader(true)}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() =>{  setSelectedCert(item); }}
                className="group relative flex flex-col rounded-2xl overflow-hidden cursor-zoom-in h-full transition-all duration-300"
                style={{ border: `1px solid ${colors.neutralBorder}`, backgroundColor: colors.neutralSurface }}
              >
                <div className="aspect-[5/4] flex items-center justify-center p-6 md:p-8 relative overflow-hidden" style={{ backgroundColor: colors.neutralBackground }}>
                  {item.url ? (
                    <SiteImage src={item.url} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 z-10" alt={item.name ?? ''} />
                  ) : (
                    <ImageIcon size={48} className="text-slate-300" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <span className="px-4 py-2 rounded-full font-medium flex items-center gap-2 text-sm" style={{ color: colors.subheading, backgroundColor: colors.neutralSurface, border: `1px solid ${colors.sectionAccentBar}` }}>
                      <ZoomIn size={16} /> Xem chi tiết
                    </span>
                  </div>
                </div>
                <div className="py-4 px-5 border-t flex items-center justify-between transition-colors" style={{ borderColor: colors.neutralBorder, backgroundColor: colors.neutralSurface }}>
                  <span className="font-semibold truncate text-sm" style={{ color: colors.subheading }}>
                    {item.name ?? 'Chứng nhận'}
                  </span>
                  <ArrowUpRight size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.subheading }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 3: Marquee - Auto scroll slider with tooltip, full color
  if (style === 'marquee') {
    return (
      <section className="w-full py-14 md:py-20 border-y" style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}>
        <div className="container max-w-7xl mx-auto px-4">
          {renderHeader(true)}
        </div>
        <TrustBadgesAutoScroll speed={0.6}>
          {items.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() =>{  setSelectedCert(item); }}
              className="h-24 md:h-32 w-auto flex items-center justify-center px-4 hover:scale-110 transition-all duration-300 cursor-zoom-in relative group"
            >
              {item.url ? (
                <SiteImage src={item.url} className="h-full w-auto object-contain max-w-[200px]" alt={item.name ?? ''} />
              ) : (
                <div className="h-16 w-28 bg-slate-200 rounded flex items-center justify-center">
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
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 4: Framed Wall - Certificate frames hanging on wall
  if (style === 'wall') {
    return (
      <section className="w-full py-12 md:py-16" style={{ backgroundColor: colors.neutralBackground }}>
        <div className="container max-w-7xl mx-auto px-4">
          {renderHeader(true)}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 justify-items-center">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() =>{  setSelectedCert(item); }}
                className="group relative p-2 md:p-3 rounded-sm flex flex-col cursor-zoom-in w-[140px] h-[180px] md:w-[160px] md:h-[210px] transition-all duration-300"
                style={{ border: `1px solid ${colors.neutralBorder}`, backgroundColor: colors.neutralSurface }}
              >
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-1 h-10 bg-gradient-to-b from-slate-400 to-transparent opacity-40"></div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.sectionAccentBar }}></div>
                <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden" style={{ backgroundColor: colors.neutralBackground, border: `1px solid ${colors.neutralBorder}` }}>
                  {item.url ? (
                    <SiteImage src={item.url} className="w-full h-full object-contain" alt={item.name ?? ''} />
                  ) : (
                    <ImageIcon size={28} className="text-slate-300" />
                  )}
                </div>
                <div className="h-7 md:h-8 flex items-center justify-center mt-1">
                  <span className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-center truncate px-1" style={{ color: colors.subheading }}>
                    {item.name ? (item.name.length > 18 ? item.name.slice(0, 16) + '...' : item.name) : 'Certificate'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 5: Carousel - Horizontal scroll với navigation và drag
  if (style === 'carousel') {
    const cardWidth = 180;
    const gap = 16;
    // Responsive: Desktop ~6 items (180px each), chỉ hiện arrows khi có > 5 items
    const showArrowsDesktop = items.length > 5;

    return (
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            {renderHeader(false)}
            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ border: `1px solid ${colors.sectionAccentBar}`, backgroundColor: colors.neutralSurface }}
                >
                  <ChevronLeft size={20} style={{ color: colors.heading }} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector(`#${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                  style={{ backgroundColor: colors.heading }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <div
              id={carouselId}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 py-4 px-2 cursor-grab active:cursor-grabbing select-none"
              style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              onMouseDown={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = 'true';
                el.dataset.startX = String(e.pageX - el.offsetLeft);
                el.dataset.scrollLeft = String(el.scrollLeft);
                el.style.scrollBehavior = 'auto';
              }}
              onMouseLeave={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
              onMouseUp={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                if (el.dataset.isDown !== 'true') {return;}
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
            >
              {items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() =>{  setSelectedCert(item); }}
                  className="snap-start flex-shrink-0 w-[140px] md:w-[180px] group cursor-zoom-in"
                  draggable={false}
                >
                  <div
                    className="aspect-square rounded-xl flex items-center justify-center p-4 md:p-5 transition-all duration-300"
                    style={{ backgroundColor: colors.neutralBackground, border: `1px solid ${colors.neutralBorder}` }}
                  >
                    {item.url ? (
                      <SiteImage src={item.url} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" alt={item.name ?? ''} draggable={false} />
                    ) : (
                      <ImageIcon size={32} className="text-slate-300" />
                    )}
                  </div>
                  {item.name && (
                    <p className="text-center text-xs font-medium text-slate-500 mt-2 truncate px-1">{item.name}</p>
                  )}
                </div>
              ))}
              <div className="flex-shrink-0 w-4" />
            </div>
          </div>

          <style>{`#${carouselId}::-webkit-scrollbar { display: none; }`}</style>
        </div>
        <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
      </section>
    );
  }

  // Style 6: Featured - 1 featured + grid (default fallback), full color
  const featuredItem = items[0];
  const otherItems = items.slice(1, 7);
  return (
    <section className="w-full py-12 md:py-16 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          {renderHeader(true)}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {featuredItem && (
            <div 
              onClick={() =>{  setSelectedCert(featuredItem); }}
              className="group cursor-zoom-in rounded-2xl overflow-hidden transition-all duration-300"
              style={{ backgroundColor: colors.iconBg, border: `1px solid ${colors.sectionAccentBar}` }}
            >
              <div className="aspect-[4/3] flex items-center justify-center p-6 md:p-8 relative">
                {featuredItem.url ? (
                  <SiteImage src={featuredItem.url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" alt={featuredItem.name ?? ''} />
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
              <div className="py-3 md:py-4 text-center border-t" style={{ borderColor: colors.neutralBorder }}>
                <span className="font-bold text-sm md:text-base" style={{ color: colors.heading }}>
                  {featuredItem.name ?? 'Chứng nhận nổi bật'}
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {otherItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() =>{  setSelectedCert(item); }}
                className="group aspect-square rounded-xl flex items-center justify-center p-3 md:p-4 cursor-zoom-in transition-all duration-300"
                style={{ backgroundColor: colors.neutralBackground, border: `1px solid ${colors.neutralBorder}` }}
              >
                {item.url ? (
                  <SiteImage src={item.url} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" alt={item.name ?? ''} />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <CertificateModal item={selectedCert} isOpen={Boolean(selectedCert)} onClose={() =>{  setSelectedCert(null); }} />
    </section>
  );
}

function GallerySection({ config, brandColor, secondary, mode, title, type }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string; type: string }) {
  const items = (config.items as { url: string; link?: string; name?: string }[]) || [];
  const style = (config.style as GalleryStyle) || (type === 'Gallery' ? 'spotlight' : 'grid');
  const harmony = normalizeGalleryHarmony((config.harmony as string | undefined));
  const [selectedPhoto, setSelectedPhoto] = React.useState<{ id: string; url: string; link?: string; name?: string } | null>(null);
  const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMarqueeInteractionPaused, setIsMarqueeInteractionPaused] = React.useState(false);
  const [marqueeRepeatCount, setMarqueeRepeatCount] = React.useState(2);
  const [marqueeBaseTrackWidth, setMarqueeBaseTrackWidth] = React.useState(0);
  const marqueeScrollRef = React.useRef<HTMLDivElement>(null);
  const marqueeBaseTrackRef = React.useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const colors = getGalleryColorTokens({ primary: brandColor, secondary, mode, harmony });
  const layoutAccent = colors.sectionAccentBarByStyle[style as keyof typeof colors.sectionAccentBarByStyle] ?? colors.sectionAccentBar;
  const normalizedItems = items.map((item, idx) => ({ ...item, id: item.url ? `${item.url}-${idx}` : `gallery-${idx}` }));
  const marqueeBaseItems = React.useMemo(() => getGalleryMarqueeBaseItems(normalizedItems), [normalizedItems]);
  const lightboxItems = style === 'marquee' ? marqueeBaseItems : normalizedItems;

  React.useEffect(() => {
    if (style !== 'marquee') {return;}
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
  }, [style, marqueeBaseItems]);

  React.useEffect(() => {
    if (style !== 'marquee') {return;}
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
  }, [style, isMarqueeInteractionPaused, prefersReducedMotion, marqueeBaseTrackWidth, marqueeBaseItems.length]);

  React.useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDevice('mobile');
        return;
      }
      if (width < 1024) {
        setDevice('tablet');
        return;
      }
      setDevice('desktop');
    };
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotion();
    mediaQuery.addEventListener('change', updateMotion);
    return () => {
      mediaQuery.removeEventListener('change', updateMotion);
    };
  }, []);

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    if (!selectedPhoto || lightboxItems.length === 0) {return;}
    const currentIdx = lightboxItems.findIndex(item => item.id === selectedPhoto.id);
    if (currentIdx === -1) {return;}
    const nextIdx = direction === 'prev'
      ? (currentIdx - 1 + lightboxItems.length) % lightboxItems.length
      : (currentIdx + 1) % lightboxItems.length;
    setSelectedPhoto(lightboxItems[nextIdx]);
  };

  const currentPhotoIndex = selectedPhoto
    ? lightboxItems.findIndex(item => item.id === selectedPhoto.id)
    : -1;

  // ============ GALLERY STYLES (Spotlight, Explore, Stories) - Only for type === 'Gallery' ============

  const renderGalleryEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.placeholderBg }}>
        <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
      </div>
      <h3 className="font-medium text-slate-900 mb-1">Chưa có hình ảnh nào</h3>
      <p className="text-sm text-slate-500">Thêm ảnh đầu tiên để bắt đầu</p>
    </div>
  );

  const renderSpotlightStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}
    const featured = normalizedItems[0];
    const sub = normalizedItems.slice(1, 4);

    return (
      <div
        className="grid gap-1 border grid-cols-1 md:grid-cols-3"
        style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}
      >
        <div
          className="relative group cursor-pointer overflow-hidden border aspect-[4/3] md:col-span-2 md:aspect-auto md:row-span-1 md:min-h-[300px]"
          style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
          onClick={() =>{  setSelectedPhoto(featured); }}
        >
          {featured.url ? (
            <SiteImage src={featured.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={48} style={{ color: colors.placeholderIcon }} /></div>
          )}
          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
          <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
        </div>
        <div className="grid gap-1 grid-cols-3 md:grid-cols-1">
          {sub.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square relative group cursor-pointer overflow-hidden border"
              style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
              onClick={() =>{  setSelectedPhoto(photo); }}
            >
              {photo.url ? (
                <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={24} style={{ color: colors.placeholderIcon }} /></div>
              )}
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
              <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExploreStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    return (
      <div className="grid gap-0.5 border grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}>
        {normalizedItems.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square relative group cursor-pointer overflow-hidden border"
            style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
            onClick={() =>{  setSelectedPhoto(photo); }}
          >
            {photo.url ? (
              <SiteImage
                src={photo.url}
                alt=""
                className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={24} style={{ color: colors.placeholderIcon }} /></div>
            )}
            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
            <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
          </div>
        ))}
      </div>
    );
  };

  const renderStoriesStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    return (
      <div
        className="grid gap-4 grid-cols-3 auto-rows-[110px] sm:auto-rows-[250px] md:grid-cols-3 md:auto-rows-[300px] rounded-lg border p-2"
        style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}
      >
        {normalizedItems.map((photo, i) => {
          const isLarge = i % 4 === 0 || i % 4 === 3;
          const colSpan = isLarge ? 'col-span-2 md:col-span-2' : 'col-span-1 md:col-span-1';

          return (
            <div
              key={photo.id}
              className={`${colSpan} relative group cursor-pointer overflow-hidden rounded-sm border`}
              style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
              onClick={() =>{  setSelectedPhoto(photo); }}
            >
              {photo.url ? (
                <SiteImage
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
            </div>
          );
        })}
      </div>
    );
  };

  const renderGalleryGridStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    const maxVisible = device === 'mobile' ? 6 : (device === 'tablet' ? 9 : 12);
    const visibleItems = normalizedItems.slice(0, maxVisible);
    const remainingCount = normalizedItems.length - maxVisible;

    if (normalizedItems.length <= 2) {
      return (
        <div className="py-8 px-4">
          <div className={cn('mx-auto flex items-center justify-center gap-4', normalizedItems.length === 1 ? 'max-w-sm' : 'max-w-xl')}>
            {normalizedItems.map((photo) => (
              <div
                key={photo.id}
                className="flex-1 aspect-square rounded-xl overflow-hidden cursor-pointer group border relative"
                style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
                onClick={() =>{  setSelectedPhoto(photo); }}
              >
                {photo.url ? (
                  <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={40} style={{ color: colors.placeholderIcon }} /></div>
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
          'grid gap-2 rounded-lg border p-2',
          device === 'mobile' ? 'grid-cols-2' : (device === 'tablet' ? 'grid-cols-3' : 'grid-cols-4'),
        )} style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}>
          {visibleItems.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative border"
              style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
              onClick={() =>{  setSelectedPhoto(photo); }}
            >
              {photo.url ? (
                <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={28} style={{ color: colors.placeholderIcon }} /></div>
              )}
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
              <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className="aspect-square rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer border"
              style={{ backgroundColor: colors.badgeBg, borderColor: colors.neutralBorder }}
            >
              <Plus size={28} style={{ color: colors.iconColor }} className="mb-1" />
              <span className="text-lg font-bold" style={{ color: colors.badgeText }}>+{remainingCount}</span>
              <span className="text-xs" style={{ color: colors.mutedText }}>ảnh khác</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGalleryMarqueeStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}
    if (marqueeBaseItems.length === 0) {return renderGalleryEmptyState();}

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
            onMouseEnter={() => { setIsMarqueeInteractionPaused(true); }}
            onMouseLeave={(e) => {
              setIsMarqueeInteractionPaused(false);
              e.currentTarget.dataset.isDown = 'false';
              e.currentTarget.style.scrollBehavior = 'smooth';
            }}
            onFocusCapture={() => { setIsMarqueeInteractionPaused(true); }}
            onBlurCapture={() => { setIsMarqueeInteractionPaused(false); }}
            onTouchStart={() => { setIsMarqueeInteractionPaused(true); }}
            onTouchEnd={() => { setIsMarqueeInteractionPaused(false); }}
            onTouchCancel={() => { setIsMarqueeInteractionPaused(false); }}
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
                className="flex shrink-0 items-center gap-6 md:gap-8 px-1 py-1"
              >
                {marqueeBaseItems.map((photo, idx) => (
                  <button
                    type="button"
                    key={`gallery-marquee-${loopIdx}-${photo.id}-${idx}`}
                    className="shrink-0 h-40 md:h-56 lg:h-64 aspect-[4/3] rounded-xl overflow-hidden group relative border text-left appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      backgroundColor: colors.neutralSurface,
                      borderColor: colors.neutralBorder,
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                      '--tw-ring-color': layoutAccent,
                    } as React.CSSProperties}
                    onClick={() => { setSelectedPhoto(photo); }}
                    aria-label={`Mở ảnh ${idx + 1}`}
                  >
                    {photo.url ? (
                      <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}>
                        <ImageIcon size={32} style={{ color: colors.placeholderIcon }} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
                    <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGalleryMasonryStyle = () => {
    if (normalizedItems.length === 0) {return renderGalleryEmptyState();}

    const maxVisible = device === 'mobile' ? 6 : 10;
    const visibleItems = normalizedItems.slice(0, maxVisible);
    const remainingCount = normalizedItems.length - maxVisible;

    if (normalizedItems.length <= 2) {
      return (
        <div className="py-8 px-4">
          <div className={cn('mx-auto flex items-center justify-center gap-4', normalizedItems.length === 1 ? 'max-w-md' : 'max-w-2xl')}>
            {normalizedItems.map((photo, idx) => (
              <div
                key={photo.id}
                className={cn('flex-1 rounded-xl overflow-hidden cursor-pointer group border relative', idx % 2 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]')}
                style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
                onClick={() =>{  setSelectedPhoto(photo); }}
              >
                {photo.url ? (
                  <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={40} style={{ color: colors.placeholderIcon }} /></div>
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
          'gap-3 rounded-lg border p-2',
          device === 'mobile' ? 'columns-2' : (device === 'tablet' ? 'columns-3' : 'columns-4')
        )} style={{ backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}>
          {visibleItems.map((photo, idx) => {
            const heights = ['h-48', 'h-64', 'h-56', 'h-72', 'h-52', 'h-60'];
            const heightClass = heights[idx % heights.length];

            return (
              <div
                key={photo.id}
                className={cn('mb-3 break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative border', heightClass)}
                style={{ backgroundColor: colors.neutralSurface, borderColor: colors.neutralBorder }}
                onClick={() =>{  setSelectedPhoto(photo); }}
              >
                {photo.url ? (
                  <SiteImage src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.placeholderBg }}><ImageIcon size={28} style={{ color: colors.placeholderIcon }} /></div>
                )}
                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: layoutAccent }} />
                <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: layoutAccent }} />
              </div>
            );
          })}
        </div>
        {remainingCount > 0 && (
          <div className="flex items-center justify-center mt-4">
            <span className="text-sm font-medium px-4 py-2 rounded-full border" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, borderColor: colors.neutralBorder }}>
              +{remainingCount} ảnh khác
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderGalleryContent = () => (
    <section className="w-full" style={{ backgroundColor: colors.neutralSurface }}>
      <div className={cn(
        'container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12',
        style === 'marquee' ? 'max-w-7xl' : 'max-w-[1600px]',
      )}>
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4 text-center" style={{ color: colors.primary }}>
            {title}
          </h2>
        )}
        <div className="mx-auto mb-6 h-1 w-12 rounded-full" style={{ backgroundColor: layoutAccent }} />
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
          {style === 'spotlight' && renderSpotlightStyle()}
          {style === 'explore' && renderExploreStyle()}
          {style === 'stories' && renderStoriesStyle()}
          {style === 'grid' && renderGalleryGridStyle()}
          {style === 'marquee' && renderGalleryMarqueeStyle()}
          {style === 'masonry' && renderGalleryMasonryStyle()}
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

  if (type === 'Gallery') {
    return renderGalleryContent();
  }

  // ============ PARTNERS STYLES (Grid, Marquee, Mono, Badge) ============

  // Style: Classic Grid - Hover effect, responsive grid
  if (style === 'grid') {
    return (
      <PartnersGridShared
        items={items}
        title={title}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        maxVisible={8}
        columnsClassName="grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
      />
    );
  }

  // Style: Marquee - Auto scroll, swipeable
  if (style === 'marquee') {
    return (
      <PartnersMarqueeShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title}
        variant="marquee"
        speed={1.15}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
      />
    );
  }

  // Style: Mono - Grayscale, hover to color
  if (style === 'mono') {
    return (
      <PartnersMarqueeShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title}
        variant="mono"
        speed={0.9}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
      />
    );
  }

  // Style: Carousel - Horizontal scrollable với navigation và drag scroll
  if (style === 'carousel') {
    const normalizedItems = items.map((item, idx) => ({ ...item, id: idx }));

    return (
      <PartnersCarouselShared
        items={normalizedItems}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title}
        openInNewTab={false}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
      />
    );
  }

  // Style: Featured - Large featured + smaller grid
  if (style === 'featured') {
    return (
      <PartnersFeaturedShared
        items={items}
        title={title}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        maxOthers={6}
        renderImage={(item, className) => (
          <SiteImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
      />
    );
  }

  // Style: Badge - Compact badges with name (default fallback)
  return (
    <PartnersBadgeShared
      items={items}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      title={title}
      maxVisible={6}
      variant="site"
      renderImage={(item, className) => (
        <SiteImage src={item.url} alt={item.name ?? ''} className={className} />
      )}
    />
  );
}

// ============ PRODUCT CATEGORIES SECTION ============
// Best Practices: Clear navigation, visual appeal, mobile optimization, hover effects
// 6 styles: grid, carousel, cards, minimal, marquee, circular
import { getCategoryIcon } from '@/app/admin/components/CategoryImageSelector';

type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'marquee' | 'circular';

function ProductCategoriesSection({ config, brandColor, secondary, mode, title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string }) {
  const categoriesConfig = (config.categories as { categoryId: string; customImage?: string; imageMode?: string }[]) || [];
  const style = (config.style as ProductCategoriesStyle) || 'grid';
  const productCatCarouselId = useSafeId('productcat-carousel');
  const showProductCount = (config.showProductCount as boolean) ?? true;
  const columnsDesktop = (config.columnsDesktop as number) || 4;
  const columnsMobile = (config.columnsMobile as number) || 2;
  const colors = React.useMemo(() => getProductCategoriesColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const circularScrollRef = React.useRef<HTMLDivElement>(null);
  const [circularScrollPosition, setCircularScrollPosition] = React.useState(0);
  const [circularPageCount, setCircularPageCount] = React.useState(1);

  const getColumnsByDevice = () => {
    if (device === 'mobile') {return columnsMobile;}
    if (device === 'tablet') {return Math.min(Math.max(columnsDesktop, 3), 4);}
    return columnsDesktop;
  };

  const getVisibleCount = (rows: number = 2) => Math.max(getColumnsByDevice(), 1) * rows;
  const getCarouselItemStyle = () => {
    const columns = Math.max(getColumnsByDevice(), 1);
    return {
      flexBasis: `calc((100% - (var(--carousel-gap) * ${columns - 1})) / ${columns})`,
      maxWidth: `calc((100% - (var(--carousel-gap) * ${columns - 1})) / ${columns})`,
      minWidth: 0,
    } as React.CSSProperties;
  };
  const getCircularItemStyle = () => {
    const columns = Math.max(getColumnsByDevice(), 1);
    return {
      flexBasis: `calc((100% - (var(--circular-gap) * ${columns - 1})) / ${columns})`,
      maxWidth: `calc((100% - (var(--circular-gap) * ${columns - 1})) / ${columns})`,
      minWidth: 0,
    } as React.CSSProperties;
  };
  
  const categoriesData = useQuery(api.productCategories.listActive);
  const productsData = useQuery(api.products.listPublicResolved, {});
  
  const categoryMap = React.useMemo(() => {
    const map: Record<string, { name: string; slug: string; image?: string; description?: string }> = {};
    if (categoriesData) {
      for (const cat of categoriesData) {
        map[cat._id] = cat;
      }
    }
    return map;
  }, [categoriesData]);
  
  const productCountMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (productsData) {
      for (const p of productsData) {
        map[p.categoryId] = (map[p.categoryId] || 0) + 1;
      }
    }
    return map;
  }, [productsData]);
  const productImageMap = React.useMemo(() => {
    const map: Record<string, string | undefined> = {};
    if (productsData) {
      for (const product of productsData) {
        map[product._id] = product.image;
      }
    }
    return map;
  }, [productsData]);

  React.useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDevice('mobile');
        return;
      }
      if (width < 1024) {
        setDevice('tablet');
        return;
      }
      setDevice('desktop');
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);
  
  const resolvedCategories = categoriesConfig
    .filter((item, index, arr) => arr.findIndex(i => i.categoryId === item.categoryId) === index)
    .map(item => {
      const cat = categoryMap[item.categoryId];
      if (!cat) {return null;}
      
      const imageMode = item.imageMode ?? 'default';
      let displayImage = cat.image;
      let displayIcon: string | undefined;
      
      if (imageMode === 'icon' && item.customImage?.startsWith('icon:')) {
        displayIcon = item.customImage.replace('icon:', '');
        displayImage = undefined;
      } else if (imageMode === 'product-image' && item.customImage?.startsWith('product:')) {
        const productId = item.customImage.replace('product:', '');
        displayImage = productImageMap[productId] ?? cat.image;
      } else if (imageMode === 'upload' || imageMode === 'url') {
        displayImage = item.customImage ?? cat.image;
      }
      
      return {
        ...cat,
        id: item.categoryId,
        displayImage,
        displayIcon,
        productCount: productCountMap[item.categoryId] || 0,
      };
    })
    .filter(Boolean) as { id: string; name: string; slug: string; image?: string; description?: string; displayImage?: string; displayIcon?: string; productCount: number }[];

  const getGridCols = () => {
    switch (columnsDesktop) {
      case 3: { return 'md:grid-cols-3';
      }
      case 5: { return 'md:grid-cols-5';
      }
      case 6: { return 'md:grid-cols-6';
      }
      default: { return 'md:grid-cols-4';
      }
    }
  };

  const getMobileGridCols = () => columnsMobile === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const maxVisible = getVisibleCount();
  const visibleCategories = resolvedCategories.slice(0, maxVisible);
  const remainingCount = Math.max(resolvedCategories.length - maxVisible, 0);

  const updateCircularPagination = React.useCallback(() => {
    if (!circularScrollRef.current) {return;}
    const { scrollLeft, scrollWidth, clientWidth } = circularScrollRef.current;
    const maxScroll = Math.max(scrollWidth - clientWidth, 0);

    if (maxScroll <= 0) {
      setCircularPageCount(1);
      setCircularScrollPosition(0);
      return;
    }

    const pageWidth = Math.max(clientWidth, 1);
    const pageCount = Math.floor(maxScroll / pageWidth) + 1;
    const nextPage = Math.round(scrollLeft / pageWidth);

    setCircularPageCount(pageCount);
    setCircularScrollPosition(Math.max(0, Math.min(nextPage, pageCount - 1)));
  }, []);

  const handleCircularScroll = () => {
    updateCircularPagination();
  };

  const handleCircularPageChange = (index: number) => {
    if (!circularScrollRef.current) {return;}
    const { scrollWidth, clientWidth } = circularScrollRef.current;
    const maxScroll = Math.max(scrollWidth - clientWidth, 0);
    const pageWidth = Math.max(clientWidth, 1);
    const targetPage = Math.max(0, Math.min(index, circularPageCount - 1));
    const targetLeft = Math.min(targetPage * pageWidth, maxScroll);

    setCircularScrollPosition(targetPage);
    circularScrollRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (style !== 'circular') {return;}

    const frameId = window.requestAnimationFrame(updateCircularPagination);
    window.addEventListener('resize', updateCircularPagination);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateCircularPagination);
    };
  }, [style, resolvedCategories.length, device, updateCircularPagination]);

  // Helper: Render category visual (image or icon)
  if (resolvedCategories.length === 0) {return null;}

  const renderCategoryVisual = (cat: typeof resolvedCategories[0], iconSize: number = 48) => {
    const iconData = cat.displayIcon ? getCategoryIcon(cat.displayIcon) : null;
    if (cat.displayIcon && iconData) {
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.iconContainerBg }}>
          {React.createElement(iconData.icon, { size: iconSize, style: { color: colors.primary.solid } })}
        </div>
      );
    }
    if (cat.displayImage) {
      return <SiteImage src={cat.displayImage} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <Package size={iconSize} className="text-slate-300" />
      </div>
    );
  };

  // Style 1: Grid - Classic grid with hover effect + monochromatic
  if (style === 'grid') {
    const gridItems = resolvedCategories.length <= 2 ? resolvedCategories : visibleCategories;
    return (
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-center" style={{ color: colors.primary.solid }}>{title}</h2>
          <div className="mx-auto h-1 w-12 rounded-full mb-6 md:mb-8" style={{ backgroundColor: colors.sectionAccent }} />
          <div className={`grid gap-3 md:gap-4 lg:gap-6 ${getMobileGridCols()} ${getGridCols()}`}>
            {gridItems.map((cat) => (
              <a 
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{ boxShadow: colors.cardShadow, border: `1px solid ${colors.cardBorder}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = colors.cardShadowHover;
                  e.currentTarget.style.borderColor = colors.cardBorderHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = colors.cardShadow;
                  e.currentTarget.style.borderColor = colors.cardBorder;
                }}
              >
                {renderCategoryVisual(cat, 48)}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
                  style={{ height: '60%' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
                  <h3 className="font-semibold text-sm md:text-base line-clamp-1" style={{ color: colors.overlayText }}>{cat.name}</h3>
                  {showProductCount && (
                    <p className="text-xs mt-0.5" style={{ color: colors.productCountText }}>{cat.productCount} sản phẩm</p>
                  )}
                </div>
              </a>
            ))}
            {remainingCount > 0 && resolvedCategories.length > 2 && (
              <div
                className="flex flex-col items-center justify-center aspect-square rounded-xl cursor-pointer transition-all"
                style={{ backgroundColor: colors.ctaMoreBg, border: `2px dashed ${colors.ctaMoreBorder}` }}
              >
                <Plus size={32} style={{ color: colors.ctaMoreText }} className="mb-2" />
                <span className="font-bold text-lg" style={{ color: colors.ctaMoreText }}>
                  +{remainingCount}
                </span>
                <p className="text-xs text-slate-500 mt-1">danh mục khác</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Style 2: Carousel - Horizontal scroll with navigation
  if (style === 'carousel') {
    const showArrows = resolvedCategories.length > getColumnsByDevice();
    const getScrollAmount = (container: Element | null) => {
      if (!container) {return 200;}
      const columns = Math.max(getColumnsByDevice(), 1);
      return (container as HTMLElement).clientWidth / columns;
    };

    return (
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 md:px-6 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: colors.primary.solid }}>{title}</h2>
            <div className="flex items-center gap-2 md:gap-4">
              {showArrows && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Cuộn trước"
                    onClick={() => {
                      const container = document.querySelector(`#${productCatCarouselId}`);
                      if (container) {container.scrollBy({ behavior: 'smooth', left: -getScrollAmount(container) });}
                    }}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md border flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ borderColor: colors.cardBorder }}
                  >
                    <ChevronLeft size={18} style={{ color: colors.arrowIcon }} />
                  </button>
                  <button
                    type="button"
                    aria-label="Cuộn sau"
                    onClick={() => {
                      const container = document.querySelector(`#${productCatCarouselId}`);
                      if (container) {container.scrollBy({ behavior: 'smooth', left: getScrollAmount(container) });}
                    }}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md border flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ borderColor: colors.cardBorder }}
                  >
                    <ChevronRight size={18} style={{ color: colors.arrowIcon }} />
                  </button>
                </div>
              )}
              <Link
                href="/products"
                className="text-sm font-medium flex items-center gap-1 hover:underline whitespace-nowrap"
                style={{ color: colors.linkText }}
              >
                Xem tất cả
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="relative px-4 md:px-6">
            <div
              id={productCatCarouselId}
              className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:gap-4 py-2 cursor-grab active:cursor-grabbing select-none"
              style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none', '--carousel-gap': device === 'mobile' ? '12px' : '16px' } as React.CSSProperties}
              onMouseDown={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = 'true';
                el.dataset.startX = String(e.pageX - el.offsetLeft);
                el.dataset.scrollLeft = String(el.scrollLeft);
                el.style.scrollBehavior = 'auto';
              }}
              onMouseLeave={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
              onMouseUp={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                if (el.dataset.isDown !== 'true') {return;}
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
            >
              {resolvedCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="snap-start flex-shrink-0 group cursor-pointer"
                  style={getCarouselItemStyle()}
                  draggable={false}
                >
                  <div
                    className="aspect-square rounded-xl overflow-hidden mb-2 transition-all"
                    style={{ border: `2px solid ${colors.cardBorder}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.cardBorderHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.cardBorder; }}
                  >
                    {renderCategoryVisual(cat, 40)}
                  </div>
                  <h3 className="font-medium text-center text-sm line-clamp-1" style={{ color: colors.categoryNameText }}>{cat.name}</h3>
                  {showProductCount && (
                    <p className="text-xs text-center" style={{ color: colors.productCountText }}>{cat.productCount} sản phẩm</p>
                  )}
                </a>
              ))}
              <div className="flex-shrink-0 w-4" />
            </div>
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          </div>
          <style>{`#${productCatCarouselId}::-webkit-scrollbar { display: none; }`}</style>
        </div>
      </section>
    );
  }

  // Style 3: Cards - Modern horizontal cards with description
  if (style === 'cards') {
    return (
      <section className="py-10 md:py-16" style={{ backgroundColor: colors.sectionBg }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-center" style={{ color: colors.primary.solid }}>{title}</h2>
          <div className="mx-auto h-1 w-12 rounded-full mb-6 md:mb-8" style={{ backgroundColor: colors.sectionAccent }} />
          <div className={cn("grid gap-3 md:gap-4", getMobileGridCols(), getGridCols())}>
            {visibleCategories.map((cat) => (
              <a 
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group bg-white rounded-xl overflow-hidden flex cursor-pointer transition-all"
                style={{ border: `1px solid ${colors.cardBorder}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.cardBorderHover;
                  e.currentTarget.style.boxShadow = colors.cardShadow;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.cardBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="w-1.5 self-stretch" style={{ backgroundColor: colors.cardAccentBar }} />
                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0">
                  {renderCategoryVisual(cat, 32)}
                </div>
                <div className="flex-1 p-3 md:p-4 flex flex-col justify-center">
                  <h3 className="font-semibold text-sm md:text-base line-clamp-1 mb-1" style={{ color: colors.categoryNameText }}>{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2 min-h-[2rem]">{cat.description}</p>
                  )}
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: colors.linkText }}>
                    {showProductCount ? `${cat.productCount} sản phẩm` : 'Xem sản phẩm'}
                    <ArrowRight size={12} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Style 4: Minimal - Text-based with small icons, compact layout
  if (style === 'minimal') {
    return (
      <section className="py-10 md:py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold" style={{ color: colors.primary.solid }}>{title}</h2>
          <Link href="/products" className="text-sm font-medium hover:underline" style={{ color: colors.linkText }}>
              Tất cả →
            </Link>
          </div>
          <div className={cn("grid gap-2 md:gap-3", getMobileGridCols(), getGridCols())}>
            {visibleCategories.map((cat) => {
              const iconData = cat.displayIcon ? getCategoryIcon(cat.displayIcon) : null;
              return (
                <a 
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full cursor-pointer transition-all min-w-0"
                  style={{ backgroundColor: colors.pillBg, border: `1px solid ${colors.pillBorder}` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary.surface;
                    e.currentTarget.style.borderColor = colors.primary.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.pillBg;
                    e.currentTarget.style.borderColor = colors.pillBorder;
                  }}
                >
                  {cat.displayIcon && iconData ? (
                    React.createElement(iconData.icon, { size: 16, style: { color: colors.primary.solid } })
                  ) : (cat.displayImage ? (
                    <SiteImage src={cat.displayImage} alt="" className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover" />
                  ) : (
                    <Package size={16} style={{ color: colors.primary.solid }} />
                  ))}
                  <span
                    className="font-medium text-xs md:text-sm truncate min-w-0 flex-1"
                    style={{ color: colors.categoryNameText }}
                    title={cat.name}
                  >
                    {cat.name}
                  </span>
                  {showProductCount && (
                    <span className="text-xs" style={{ color: colors.productCountText }}>({cat.productCount})</span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Style 5: Circular - Horizontal scroll với circular containers
  if (style === 'circular') {
    return (
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-center px-4 md:px-6" style={{ color: colors.primary.solid }}>{title}</h2>
          <div className="mx-auto h-1 w-12 rounded-full mb-6 md:mb-8" style={{ backgroundColor: colors.sectionAccent }} />
          <div
            ref={circularScrollRef}
            className="flex overflow-x-auto scrollbar-hide pb-4 gap-4 md:gap-6 snap-x snap-mandatory px-4 md:px-6"
            style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none', '--circular-gap': device === 'mobile' ? '16px' : '24px' } as React.CSSProperties}
            onScroll={handleCircularScroll}
          >
            {resolvedCategories.map((cat) => (
              <a
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="flex-shrink-0 snap-start group flex flex-col items-center"
                style={getCircularItemStyle()}
              >
                <div
                  className="rounded-full overflow-hidden transition-all duration-300 mb-3"
                  style={{
                    border: `2px solid ${colors.circularBorder}`,
                    padding: '18px',
                    backgroundColor: colors.circularBg,
                    width: '100%',
                    aspectRatio: '1/1'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.cardBorderHover;
                    e.currentTarget.style.boxShadow = colors.cardShadow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.circularBorder;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {renderCategoryVisual(cat, 40)}
                  </div>
                </div>
                <h3 className="font-semibold text-center text-sm line-clamp-1 w-full" style={{ color: colors.categoryNameText }}>{cat.name}</h3>
                <div className="relative h-[24px] overflow-hidden w-full">
                  <span
                    className="block w-full absolute top-0 left-0 text-center transition-transform duration-300 group-hover:translate-y-full group-hover:opacity-0 text-xs"
                    style={{ color: colors.productCountText }}
                  >
                    {showProductCount ? `${cat.productCount} sản phẩm` : '\u00A0'}
                  </span>
                  <span
                    className="block w-full underline absolute top-0 left-0 text-center transition-transform duration-300 -translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 text-xs"
                    style={{ color: colors.linkText }}
                  >
                    Xem chi tiết
                  </span>
                </div>
              </a>
            ))}
          </div>
          {circularPageCount > 1 && (
            <div className="flex items-center justify-center mt-8 gap-[10px]">
              {Array.from({ length: circularPageCount }, (_, index) => index).map((index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => { handleCircularPageChange(index); }}
                  className={cn(
                    "inline-block h-[8px] rounded-[10px] cursor-pointer transition-all duration-300",
                    circularScrollPosition === index ? 'w-[28px]' : 'w-[8px] border'
                  )}
                  style={
                    circularScrollPosition === index
                      ? { backgroundColor: colors.paginationDotActive }
                      : { borderColor: colors.paginationDotInactive, backgroundColor: 'transparent' }
                  }
                  aria-label={`Đi tới trang ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>
    );
  }

  // Style 6: Marquee - Auto-scrolling horizontal animation (default fallback)
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-center" style={{ color: colors.primary.solid }}>{title}</h2>
        <div className="mx-auto h-1 w-12 rounded-full mb-6 md:mb-8" style={{ backgroundColor: colors.sectionAccent }} />
        <div className="relative overflow-hidden rounded-xl">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          
          {/* Marquee track */}
          <div 
            className="flex w-max hover:[animation-play-state:paused]"
            style={{
              animation: 'marquee-scroll 25s linear infinite',
            }}
          >
            {[...visibleCategories, ...visibleCategories].map((cat, idx) => (
              <a 
                key={`${cat.id}-${idx}`}
                href={`/products?category=${cat.slug}`}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer mx-2 bg-white"
                style={{ border: `2px solid ${colors.pillBorder}`, boxShadow: colors.cardShadow, backgroundColor: colors.neutral.surface }}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {renderCategoryVisual(cat, 24)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm whitespace-nowrap" style={{ color: colors.categoryNameText }}>{cat.name}</h3>
                  {showProductCount && (
                    <p className="text-xs whitespace-nowrap" style={{ color: colors.productCountText }}>{cat.productCount} sản phẩm</p>
                  )}
                </div>
                <ArrowUpRight size={14} style={{ color: colors.arrowIcon }} className="flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ CATEGORY PRODUCTS SECTION ============
// Sản phẩm theo danh mục - Mỗi section là 1 danh mục với các sản phẩm thuộc danh mục đó
type CategoryProductsStyle = 'grid' | 'carousel' | 'cards' | 'bento' | 'magazine' | 'showcase';

function CategoryProductsSection({
  config,
  brandColor,
  secondary,
  mode,
  title: _title,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
}) {
  const sections = (config.sections as { categoryId: string; itemCount: number }[]) || [];
  const style = (config.style as CategoryProductsStyle) || 'grid';
  const catProductCarouselBaseId = useSafeId('catproduct-carousel');
  const showViewAll = (config.showViewAll as boolean) ?? true;
  const columnsDesktop = (config.columnsDesktop as number) || 4;
  const columnsMobile = (config.columnsMobile as number) || 2;
  const sectionTitle = _title || 'Sản phẩm';
  const colors = React.useMemo(
    () => getCategoryProductsColors(brandColor, secondary, mode),
    [brandColor, secondary, mode]
  );

  // Query categories and products
  const categoriesData = useQuery(api.productCategories.listActive);
  const productsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const imageAspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = React.useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const saleMode = React.useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);
  const imageAspectRatio = React.useMemo(
    () => resolveProductImageAspectRatio(imageAspectRatioSetting?.value),
    [imageAspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = React.useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const { frame } = useProductFrameConfig();

  // Resolve sections with category and products data
  const resolvedSections = sections
    .map(section => {
      const category = categoriesData?.find(c => c._id === section.categoryId);
      if (!category) {return null;}
      
      const products = (productsData ?? [])
        .filter(p => p.categoryId === section.categoryId)
        .slice(0, section.itemCount);
      
      return {
        ...section,
        category,
        products,
      };
    })
    .filter(Boolean) as { 
      categoryId: string; 
      itemCount: number;
      category: { _id: string; name: string; slug?: string; image?: string }; 
      products: { _id: string; name: string; image?: string; price?: number; salePrice?: number; slug?: string; hasVariants?: boolean }[] 
    }[];

  const getGridCols = () => {
    switch (columnsDesktop) {
      case 3: { return 'md:grid-cols-3';
      }
      case 5: { return 'md:grid-cols-5';
      }
      default: { return 'md:grid-cols-4';
      }
    }
  };

  const getMobileGridCols = () => columnsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2';

  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getHomeComponentPriceLabel({ saleMode, price, salePrice, isRangeFromVariant });
  const formatComparePrice = (price?: number) =>
    price ? getHomeComponentPriceLabel({ saleMode: 'cart', price }).label : '';

  const resolveProductHref = React.useCallback((params: {
    product: { slug?: string; _id: string };
    categorySlug?: string;
  }) => buildDetailPath({
    categorySlug: params.categorySlug,
    mode: routeMode,
    moduleKey: 'products',
    recordSlug: params.product.slug ?? params.product._id,
  }), [routeMode]);

  const categorySlugMap = React.useMemo(() => {
    if (!categoriesData) {return new Map<string, string>();}
    return new Map(categoriesData.map((category) => [category._id, category.slug]));
  }, [categoriesData]);

  const resolveProductHrefByCategory = React.useCallback((params: {
    product: { slug?: string; _id: string };
    categoryId: string;
  }) => resolveProductHref({
    categorySlug: categorySlugMap.get(params.categoryId),
    product: params.product,
  }), [categorySlugMap, resolveProductHref]);

  // Product Card Component with Equal Height (line-clamp + min-height)
  const ProductCard = ({ product, categoryId }: { product: { _id: string; name: string; image?: string; price?: number; salePrice?: number; slug?: string; hasVariants?: boolean }; categoryId: string }) => (
    <a href={resolveProductHrefByCategory({ categoryId, product })} aria-label={`${sectionTitle}: ${product.name}`} className="group cursor-pointer flex flex-col h-full">
      <div className="rounded-lg overflow-hidden mb-2" style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}>
        {product.image ? (
          <SiteImage 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={24} style={{ color: colors.emptyStateIcon }} />
          </div>
        )}
        <ProductImageFrameOverlay frame={frame} />
      </div>
      <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]" style={{ color: colors.bodyText }}>{product.name || 'Tên sản phẩm'}</h4>
      <div className="flex flex-col mt-auto">
        {(() => {
          const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
          if (priceDisplay.comparePrice) {
            return (
              <>
                <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                  {priceDisplay.label}
                </span>
                <span className="text-xs line-through" style={{ color: colors.mutedText }}>{formatComparePrice(priceDisplay.comparePrice)}</span>
              </>
            );
          }
          return (
            <span className="font-bold text-sm" style={{ color: colors.priceText }}>
              {priceDisplay.label}
            </span>
          );
        })()}
      </div>
    </a>
  );

  // Empty State Component with brandColor
  const EmptyProductsState = ({ message }: { message: string }) => (
    <div 
      className="text-center py-8 rounded-xl flex flex-col items-center justify-center"
      style={{ backgroundColor: colors.emptyStateBackground }}
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: colors.emptyStateIconBackground }}
      >
        <Package size={24} style={{ color: colors.emptyStateIcon }} />
      </div>
      <p className="text-sm" style={{ color: colors.emptyStateText }}>{message}</p>
    </div>
  );

  if (resolvedSections.length === 0) {
    return null;
  }

  // Style 1: Grid
  if (style === 'grid') {
    return (
      <div className="py-8 md:py-12 space-y-10 md:space-y-16">
        {resolvedSections.map((section, idx) => (
          <section key={idx} className="px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
                {showViewAll && (
                  <a 
                    href={`/products?category=${section.category.slug ?? section.category._id}`}
                    className="text-sm font-medium flex items-center gap-1 hover:underline px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: colors.buttonBorder, color: colors.buttonText }}
                  >
                    Xem danh mục
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                )}
              </div>
              
              {section.products.length > 0 ? (
                <div className={`grid gap-4 ${getMobileGridCols()} ${getGridCols()}`}>
                  {section.products.map((product) => (
                    <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                  ))}
                </div>
              ) : (
                <EmptyProductsState message="Chưa có sản phẩm trong danh mục này" />
              )}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Style 2: Carousel
  if (style === 'carousel') {
    const cardWidth = 192;
    const gap = 16;

    return (
      <div className="py-8 md:py-12 space-y-10 md:space-y-16">
        {resolvedSections.map((section, idx) => {
          const catProductCarouselId = `${catProductCarouselBaseId}-${idx}`;
          // Responsive: Desktop ~5-6 items (192px each), chỉ hiện arrows khi có > 5 items
          const showArrows = section.products.length > 5;
          return (
            <section key={idx}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between px-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
                  <div className="flex items-center gap-2 md:gap-4">
                    {showArrows && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const container = document.querySelector(`#${catProductCarouselId}`);
                            if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                          }}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md border flex items-center justify-center hover:scale-110 transition-transform"
                          style={{ borderColor: colors.buttonBorder, backgroundColor: colors.buttonBackground }}
                        >
                          <ChevronLeft size={18} style={{ color: colors.buttonText }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const container = document.querySelector(`#${catProductCarouselId}`);
                            if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                          }}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md border flex items-center justify-center hover:scale-110 transition-transform"
                          style={{ borderColor: colors.buttonBorder, backgroundColor: colors.buttonBackground }}
                        >
                          <ChevronRight size={18} style={{ color: colors.buttonText }} />
                        </button>
                      </div>
                    )}
                    {showViewAll && (
                      <a
                        href={`/products?category=${section.category.slug ?? section.category._id}`}
                        className="text-sm font-medium flex items-center gap-1 hover:underline"
                        style={{ color: colors.buttonText }}
                      >
                        Xem danh mục
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {section.products.length > 0 ? (
                  <div className="relative px-4">
                    <div
                      id={catProductCarouselId}
                      className="flex overflow-x-auto snap-x snap-mandatory gap-4 py-2 cursor-grab active:cursor-grabbing select-none"
                      style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                      onMouseDown={(e) => {
                        const el = e.currentTarget;
                        el.dataset.isDown = 'true';
                        el.dataset.startX = String(e.pageX - el.offsetLeft);
                        el.dataset.scrollLeft = String(el.scrollLeft);
                        el.style.scrollBehavior = 'auto';
                      }}
                      onMouseLeave={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
                      onMouseUp={(e) => { e.currentTarget.dataset.isDown = 'false'; e.currentTarget.style.scrollBehavior = 'smooth'; }}
                      onMouseMove={(e) => {
                        const el = e.currentTarget;
                        if (el.dataset.isDown !== 'true') {return;}
                        e.preventDefault();
                        const x = e.pageX - el.offsetLeft;
                        const walk = (x - Number(el.dataset.startX)) * 1.5;
                        el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
                      }}
                    >
                      {section.products.map((product) => (
                        <a
                          key={product._id}
                          href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                          className="snap-start flex-shrink-0 w-40 md:w-48 group cursor-pointer"
                          draggable={false}
                        >
                          <div className="rounded-lg overflow-hidden mb-2" style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}>
                            {product.image ? (
                              <SiteImage
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} style={{ color: colors.emptyStateIcon }} />
                              </div>
                            )}
                          <ProductImageFrameOverlay frame={frame} />
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2 mb-1" style={{ color: colors.bodyText }}>{product.name}</h4>
                          <span className="font-bold text-base" style={{ color: colors.priceText }}>
                            {getPriceDisplay(product.price, product.salePrice, product.hasVariants).label}
                          </span>
                        </a>
                      ))}
                      <div className="flex-shrink-0 w-4" />
                    </div>
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 md:w-6 pointer-events-none" style={{ background: `linear-gradient(to right, ${colors.neutralSurface}, transparent)` }} />
                    <div className="absolute right-0 top-0 bottom-0 w-4 md:w-6 pointer-events-none" style={{ background: `linear-gradient(to left, ${colors.neutralSurface}, transparent)` }} />
                    <style>{`#${catProductCarouselId}::-webkit-scrollbar { display: none; }`}</style>
                  </div>
                ) : (
                  <div className="mx-4">
                    <EmptyProductsState message="Chưa có sản phẩm" />
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // Style 3: Cards - Modern cards with category header
  if (style === 'cards') {
    return (
      <div className="py-8 md:py-12 space-y-10 md:space-y-16">
        {resolvedSections.map((section, idx) => (
          <section key={idx} className="px-4">
            <div className="max-w-7xl mx-auto">
              <div 
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${colors.cardBorder}` }}
              >
                {/* Category Header */}
                <div 
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: colors.neutralBackground }}
                >
                  <div className="flex items-center gap-3">
                    {section.category.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white">
                        <SiteImage 
                          src={section.category.image} 
                          alt={section.category.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <h2 className="text-lg font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
                  </div>
                  {showViewAll && (
                    <a 
                      href={`/products?category=${section.category.slug ?? section.category._id}`}
                      className="text-sm font-medium flex items-center gap-1 hover:underline px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                    >
                      Xem danh mục
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
                
                {/* Products Grid */}
                <div className="p-4" style={{ backgroundColor: colors.cardBackground }}>
                  {section.products.length > 0 ? (
                    <div className={`grid gap-4 ${getMobileGridCols()} ${getGridCols()}`}>
                      {section.products.map((product) => (
                        <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                      ))}
                    </div>
                  ) : (
                    <EmptyProductsState message="Chưa có sản phẩm" />
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Style 4: Bento - Featured product với bento grid
  if (style === 'bento') {
    return (
      <div className="py-8 md:py-12 space-y-10 md:space-y-16">
        {resolvedSections.map((section, idx) => {
          const featured = section.products[0];
          const others = section.products.slice(1, 5);
          
          return (
            <section key={idx} className="px-4">
              <div className="max-w-7xl mx-auto">
                {/* Header với accent line */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: colors.sectionAccent }}
                    />
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.heading }}>{section.category.name}</h2>
                  </div>
                  {showViewAll && (
                    <a 
                      href={`/products?category=${section.category.slug ?? section.category._id}`}
                      className="text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-full transition-all hover:shadow-md"
                      style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                    >
                      Xem danh mục
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
                
                {section.products.length === 0 ? (
                  <EmptyProductsState message="Chưa có sản phẩm" />
                ) : (
                  <>
                    {/* Mobile: 2 columns grid */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                      {section.products.slice(0, 4).map((product) => (
                        <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                      ))}
                    </div>
                    
                    {/* Desktop: Bento grid */}
                    <div className="hidden md:grid grid-cols-4 gap-4 auto-rows-[180px]">
                      {/* Featured - 2x2 */}
                      {featured && (
                        <a 
                          href={resolveProductHrefByCategory({ categoryId: section.category._id, product: featured })}
                          className="col-span-2 row-span-2 group cursor-pointer relative rounded-2xl overflow-hidden"
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                        >
                          {featured.image ? (
                            <SiteImage 
                              src={featured.image} 
                              alt={featured.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={48} style={{ color: colors.emptyStateIcon }} />
                            </div>
                          )}
                          <ProductImageFrameOverlay frame={frame} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2"
                              style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}
                            >
                              Nổi bật
                            </span>
                            <h3 className="font-bold text-lg line-clamp-2 mb-1">{featured.name}</h3>
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                              {(() => {
                                const priceDisplay = getPriceDisplay(featured?.price, featured?.salePrice, featured?.hasVariants);
                                if (priceDisplay.comparePrice) {
                                  return (
                                    <>
                                      <span className="font-bold text-lg">{priceDisplay.label}</span>
                                      <span className="text-xs text-white/60 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                                    </>
                                  );
                                }
                                return <span className="font-bold text-lg">{priceDisplay.label}</span>;
                              })()}
                            </div>
                          </div>
                        </a>
                      )}
                      
                      {/* Other products */}
                      {others.map((product) => (
                        <a 
                          key={product._id}
                          href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                          className="group cursor-pointer relative rounded-xl overflow-hidden"
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                        >
                          {product.image ? (
                            <SiteImage 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={24} style={{ color: colors.emptyStateIcon }} />
                            </div>
                          )}
                          <ProductImageFrameOverlay frame={frame} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                            <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                            <span className="font-bold text-sm">{getPriceDisplay(product.price, product.salePrice, product.hasVariants).label}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // Style 5: Magazine - Editorial Grid với Featured Item + Grid nhỏ
  if (style === 'magazine') {
    return (
      <div className="py-8 md:py-12 space-y-12 md:space-y-16">
        {resolvedSections.map((section, sectionIdx) => {
          const featured = section.products[0];
          const gridItems = section.products.slice(1, 5);
          
          return (
            <section key={sectionIdx} className="px-4">
              <div className="max-w-7xl mx-auto">
                {/* Editorial Header */}
                <div className="flex items-end justify-between mb-6 pb-4 border-b-2" style={{ borderColor: colors.neutralBorder }}>
                  <div>
                    <span 
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: colors.pillText }}
                    >
                      Bộ sưu tập
                    </span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mt-1" style={{ color: colors.heading }}>{section.category.name}</h2>
                  </div>
                  {showViewAll && (
                    <a 
                      href={`/products?category=${section.category.slug ?? section.category._id}`}
                      className="font-semibold flex items-center gap-2 transition-all hover:gap-3"
                      style={{ color: colors.buttonText }}
                    >
                      Xem tất cả
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
                
                {section.products.length === 0 ? (
                  <EmptyProductsState message="Chưa có sản phẩm" />
                ) : (
                  <>
                    {/* Mobile: 2-col grid */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                      {section.products.slice(0, 4).map((product) => (
                        <ProductCard key={product._id} product={product} categoryId={section.category._id} />
                      ))}
                    </div>
                    
                    {/* Desktop: Featured (50%) + Grid 2x2 (50%) */}
                    <div className="hidden md:grid grid-cols-2 gap-6">
                      {/* Featured Item - Large */}
                      {featured && (
                        <a 
                          href={resolveProductHrefByCategory({ categoryId: section.category._id, product: featured })}
                          className="group cursor-pointer relative rounded-2xl overflow-hidden"
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                        >
                          {featured.image ? (
                            <SiteImage 
                              src={featured.image} 
                              alt={featured.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={48} style={{ color: colors.emptyStateIcon }} />
                            </div>
                          )}
                          <ProductImageFrameOverlay frame={frame} />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                              style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}
                            >
                              Nổi bật
                            </span>
                            <h3 className="font-bold text-xl md:text-2xl line-clamp-2 mb-2">{featured.name}</h3>
                            <div className="flex items-baseline gap-3">
                              {(() => {
                                const priceDisplay = getPriceDisplay(featured?.price, featured?.salePrice, featured?.hasVariants);
                                if (priceDisplay.comparePrice) {
                                  return (
                                    <>
                                      <span className="font-bold text-2xl">{priceDisplay.label}</span>
                                      <span className="text-sm text-white/60 line-through">{formatComparePrice(priceDisplay.comparePrice)}</span>
                                    </>
                                  );
                                }
                                return <span className="font-bold text-2xl">{priceDisplay.label}</span>;
                              })()}
                            </div>
                          </div>
                        </a>
                      )}
                      
                      {/* Grid 2x2 */}
                      <div className="grid grid-cols-2 gap-4">
                        {gridItems.map((product) => (
                          <a 
                            key={product._id}
                            href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                            className="group cursor-pointer"
                          >
                            <div 
                              className="rounded-xl overflow-hidden mb-3 relative"
                              style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                            >
                              {product.image ? (
                                <SiteImage 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} style={{ color: colors.emptyStateIcon }} />
                                </div>
                              )}
                              <ProductImageFrameOverlay frame={frame} />
                              {/* Quick view overlay */}
                              <div 
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ backgroundColor: colors.neutralSurface }}
                              >
                                <span 
                                className="px-4 py-2 rounded-full text-sm font-medium"
                                style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                                >
                                  Xem nhanh
                                </span>
                              </div>
                            </div>
                          <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]" style={{ color: colors.bodyText }}>{product.name}</h4>
                            <div className="flex items-baseline gap-2 mt-1">
                              {(() => {
                                const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                                if (priceDisplay.comparePrice) {
                                  return (
                                    <>
                                    <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                        {priceDisplay.label}
                                      </span>
                                    <span className="text-xs line-through" style={{ color: colors.mutedText }}>{formatComparePrice(priceDisplay.comparePrice)}</span>
                                    </>
                                  );
                                }
                                return (
                                <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                    {priceDisplay.label}
                                  </span>
                                );
                              })()}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // Style 6: Showcase - Gradient overlay với hover effects lung linh
  return (
    <div className="py-8 md:py-12 space-y-10 md:space-y-16">
      {resolvedSections.map((section, idx) => (
        <section key={idx}>
          <div className="max-w-7xl mx-auto px-4">
            {/* Header với underline effect */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: colors.pillText }}
                >
                  Bộ sưu tập
                </span>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mt-1" style={{ color: colors.heading }}>{section.category.name}</h2>
                <div 
                  className="h-1 w-16 rounded-full mt-2"
                      style={{ backgroundColor: colors.sectionAccent }}
                />
              </div>
              {showViewAll && (
                <a 
                  href={`/products?category=${section.category.slug ?? section.category._id}`}
                  className="group flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: colors.buttonText }}
                >
                  Xem tất cả 
                  <span 
                    className="w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"
                        style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}` }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </a>
              )}
            </div>
            
            {section.products.length === 0 ? (
              <EmptyProductsState message="Chưa có sản phẩm" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {section.products.map((product) => (
                  <a 
                    key={product._id}
                    href={resolveProductHrefByCategory({ categoryId: section.category._id, product })}
                    className="group cursor-pointer block"
                  >
                    {/* Image Container với effects */}
                    <div className="relative rounded-2xl overflow-hidden mb-3" style={imageAspectRatioStyle}>
                      {/* Background gradient on hover */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        style={{ background: `linear-gradient(135deg, ${colors.neutralBorder} 0%, transparent 50%, ${colors.neutralBackground} 100%)` }}
                      />
                      
                      {product.image ? (
                        <SiteImage 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.imageBackground }}>
                          <Package size={32} style={{ color: colors.emptyStateIcon }} />
                        </div>
                      )}
                      <ProductImageFrameOverlay frame={frame} />
                      
                      {/* Gradient overlay bottom */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                      
                      {/* Quick action button */}
                      <div className="absolute bottom-3 left-3 right-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-30">
                        <span 
                          className="block w-full py-2.5 rounded-xl text-sm font-medium text-center backdrop-blur-sm"
                          style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                        >
                          Xem chi tiết
                        </span>
                      </div>
                      
                      {/* Badge for sale */}
                      {(() => {
                        const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                        if (!priceDisplay.comparePrice) {return null;}
                        return (
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500 z-30">
                            -{Math.round((1 - (product.price ?? 0) / priceDisplay.comparePrice) * 100)}%
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Product info */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:opacity-80 transition-opacity" style={{ color: colors.bodyText }}>{product.name}</h4>
                      <div className="flex flex-col">
                        {(() => {
                          const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                          if (priceDisplay.comparePrice) {
                            return (
                              <>
                                <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                                  {priceDisplay.label}
                                </span>
                                <span className="text-xs line-through" style={{ color: colors.mutedText }}>{formatComparePrice(priceDisplay.comparePrice)}</span>
                              </>
                            );
                          }
                          return (
                            <span className="font-bold text-sm" style={{ color: colors.priceText }}>
                              {priceDisplay.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

// ============ FEATURES SECTION ============
// Shared renderer parity with admin preview (6 styles)
function FeaturesSection({ config, brandColor, secondary, mode, title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: 'single' | 'dual'; title: string }) {
  const rawItems = config.items as unknown;
  const items = Array.isArray(rawItems)
    ? rawItems
      .map((item, index) => {
        if (!item || typeof item !== 'object') {return null;}
        const source = item as Record<string, unknown>;
        const rawId = source.id;
        const normalizedId = typeof rawId === 'number'
          ? rawId
          : (typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number.NaN);

        return {
          id: Number.isFinite(normalizedId) ? normalizedId : index + 1,
          icon: typeof source.icon === 'string' && source.icon.trim().length > 0 ? source.icon : 'Zap',
          title: typeof source.title === 'string' ? source.title : '',
          description: typeof source.description === 'string' ? source.description : '',
        };
      })
      .filter((item): item is { id: number; icon: string; title: string; description: string } => item !== null)
    : [];

  const style = (() => {
    const value = config.style;
    if (value === 'iconGrid' || value === 'alternating' || value === 'compact' || value === 'cards' || value === 'carousel' || value === 'timeline') {
      return value;
    }
    return 'iconGrid';
  })();

  return (
    <FeaturesSectionShared
      context="site"
      items={items}
      style={style}
      title={title}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
    />
  );
}

// ============ PROCESS SECTION ============
// 6 Professional Styles: Horizontal, Stepper, Cards, Accordion, Minimal, Grid
function ProcessSection({ config, brandColor, secondary, mode, title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: ProcessBrandMode; title: string }) {
  const steps = normalizeProcessRenderSteps(config.steps);
  if (steps.length === 0) {return null;}

  const style = normalizeProcessStyle(config.style);

  return (
    <ProcessSectionShared
      steps={steps}
      sectionTitle={title}
      style={style}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      context="site"
    />
  );
}

// ============ CLIENTS SECTION ============
function ClientsSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: ClientsBrandMode;
  title: string;
}) {
  const items = normalizeClientItems(config.items);
  if (items.length === 0) {return null;}

  const style = normalizeClientsStyleSafe(config.style);
  const tokens = getClientsColorTokens({
    primary: brandColor,
    secondary,
    mode,
  });

  return (
    <ClientsSectionShared
      context="site"
      title={title}
      style={style}
      items={items}
      tokens={tokens}
      carouselId={useSafeId('clients-carousel')}
      device="desktop"
    />
  );
}

// ============ VIDEO SECTION ============
// 6 Styles: centered, split, fullwidth, cinema, minimal, parallax

function VideoSection({ config, brandColor, secondary, mode, title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; mode: VideoBrandMode; title: string }) {
  const normalizedConfig = normalizeVideoConfig(config);
  const style = normalizeVideoStyle(normalizedConfig.style);

  const tokens = React.useMemo(() => getVideoColorTokens({
    primary: brandColor,
    secondary,
    mode,
    style,
  }), [brandColor, secondary, mode, style]);

  return (
    <VideoSectionShared
      context="site"
      config={{ ...normalizedConfig, style }}
      style={style}
      tokens={tokens}
      title={title}
      device="desktop"
    />
  );
}

// ============ COUNTDOWN / PROMOTION SECTION ============
// 6 Styles: banner, floating, minimal, split, sticky, popup
// Best Practices: Expired state, accessibility (aria-live)
type CountdownStyle = 'banner' | 'floating' | 'minimal' | 'split' | 'sticky' | 'popup';

// Countdown Timer Hook with expired state
const useCountdownTimer = (endDate: string) => {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, isExpired: false, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const calculateTime = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, isExpired: true, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        isExpired: false,
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () =>{  clearInterval(timer); };
  }, [endDate]);

  return timeLeft;
};

function _CountdownSection({ config, brandColor, secondary, title }: { config: Record<string, unknown>; brandColor: string;
  secondary: string; title: string }) {
  const heading = (config.heading as string) || title;
  const subHeading = (config.subHeading as string) || '';
  const description = (config.description as string) || '';
  const endDate = (config.endDate as string) || DEFAULT_COUNTDOWN_END_DATE;
  const buttonText = (config.buttonText as string) || '';
  const buttonLink = (config.buttonLink as string) || '#';
  const backgroundImage = (config.backgroundImage as string) || '';
  const discountText = (config.discountText as string) || '';
  const showDays = config.showDays !== false;
  const showHours = config.showHours !== false;
  const showMinutes = config.showMinutes !== false;
  const showSeconds = config.showSeconds !== false;
  const style = (config.style as CountdownStyle) || 'banner';

  const timeLeft = useCountdownTimer(endDate);
  
  // Popup dismiss state - show once per session, dismiss on X/background/skip click
  const [isPopupDismissed, setIsPopupDismissed] = React.useState(() => {
    if (typeof window === 'undefined') {return false;}
    return sessionStorage.getItem('countdown-popup-dismissed') === 'true';
  });
  
  const dismissPopup = () => {
    setIsPopupDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('countdown-popup-dismissed', 'true');
    }
  };

  // Time Unit Component
  const TimeUnit = ({ value, label, variant = 'default' }: { value: number; label: string; variant?: 'default' | 'light' | 'outlined' }) => {
    if (variant === 'light') {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px]">
            <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">{String(value).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-white/80 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      );
    }
    if (variant === 'outlined') {
      return (
        <div className="flex flex-col items-center">
          <div className="border-2 rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px]" style={{ borderColor: secondary }}>
            <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: secondary }}>{String(value).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <div className="rounded-lg px-3 py-2 min-w-[50px] md:min-w-[60px] text-white" style={{ backgroundColor: brandColor }}>
          <span className="text-2xl md:text-3xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
        </div>
        <span className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
      </div>
    );
  };

  // Timer Display
  const renderTimerDisplay = (variant: 'default' | 'light' | 'outlined' = 'default') => (
    <div className="flex items-center gap-2 md:gap-3">
      {showDays && (
        <>
          <TimeUnit value={timeLeft.days} label="Ngày" variant={variant} />
          <span className={`text-xl font-bold ${variant === 'light' ? 'text-white/60' : 'text-slate-300'}`}>:</span>
        </>
      )}
      {showHours && (
        <>
          <TimeUnit value={timeLeft.hours} label="Giờ" variant={variant} />
          <span className={`text-xl font-bold ${variant === 'light' ? 'text-white/60' : 'text-slate-300'}`}>:</span>
        </>
      )}
      {showMinutes && (
        <>
          <TimeUnit value={timeLeft.minutes} label="Phút" variant={variant} />
          {showSeconds && <span className={`text-xl font-bold ${variant === 'light' ? 'text-white/60' : 'text-slate-300'}`}>:</span>}
        </>
      )}
      {showSeconds && <TimeUnit value={timeLeft.seconds} label="Giây" variant={variant} />}
    </div>
  );

  // Style 1: Banner
  if (style === 'banner') {
    return (
      <section 
        className="relative w-full py-10 md:py-16 px-4 overflow-hidden"
        style={{ 
          background: backgroundImage 
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${backgroundImage}) center/cover`
            : `linear-gradient(135deg,  0%, cc 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'white' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'white' }} />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {discountText && (
            <div className="inline-block mb-4">
              <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">{discountText}</span>
            </div>
          )}
          {subHeading && <p className="text-white/80 text-sm md:text-base uppercase tracking-wider mb-2">{subHeading}</p>}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">{heading}</h2>
          {description && <p className="text-white/90 mb-6 max-w-2xl mx-auto">{description}</p>}
          <div className="flex justify-center mb-6">{renderTimerDisplay('light')}</div>
          {buttonText && (
            <a href={buttonLink} className="inline-flex items-center gap-2 px-8 py-3 bg-white rounded-lg font-semibold transition-transform hover:scale-105" style={{ color: secondary }}>
              {buttonText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          )}
        </div>
      </section>
    );
  }

  // Style 2: Floating
  if (style === 'floating') {
    return (
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ 
              background: backgroundImage 
                ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage}) center/cover`
                : `linear-gradient(135deg, ee 0%,  100%)`
            }}
          >
            {discountText && (
              <div className="absolute -right-12 top-6 rotate-45 bg-yellow-400 text-yellow-900 px-12 py-1 text-sm font-bold shadow-lg">{discountText}</div>
            )}
            <div className="p-6 md:p-10 text-center">
              {subHeading && (
                <div className="inline-block mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-xs md:text-sm text-white font-medium uppercase tracking-wider">{subHeading}</span>
                </div>
              )}
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3">{heading}</h2>
              {description && <p className="text-white/80 mb-6 text-sm md:text-base">{description}</p>}
              <div className="flex justify-center mb-6">{renderTimerDisplay('light')}</div>
              {buttonText && (
                <a href={buttonLink} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white rounded-full font-semibold text-sm transition-all hover:shadow-lg hover:scale-105" style={{ color: secondary }}>
                  {buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Style 3: Minimal
  if (style === 'minimal') {
    return (
      <section className="py-10 md:py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                {discountText && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: `${secondary}15`, color: secondary }}>{discountText}</span>
                )}
                {subHeading && <p className="text-sm text-slate-500 mb-1">{subHeading}</p>}
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{heading}</h2>
                {description && <p className="text-slate-500 text-sm mb-4">{description}</p>}
                {buttonText && (
                  <a href={buttonLink} className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm text-white transition-colors hover:opacity-90" style={{ backgroundColor: brandColor }}>
                    {buttonText}
                  </a>
                )}
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Kết thúc sau</p>
                {renderTimerDisplay('outlined')}
                {buttonText && (
                  <a href={buttonLink} className="md:hidden inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm text-white mt-4 transition-colors hover:opacity-90" style={{ backgroundColor: brandColor }}>
                    {buttonText}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Expired State Component
  const renderExpiredState = (variant: 'default' | 'light' = 'default') => (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${variant === 'light' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Khuyến mãi đã kết thúc</span>
    </div>
  );

  // Style 4: Split
  if (style === 'split') {
    return (
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2">
            <div 
              className="relative flex items-center justify-center min-h-[200px] md:min-h-[300px]"
              style={{ 
                background: backgroundImage 
                  ? `url(${backgroundImage}) center/cover`
                  : `linear-gradient(135deg, dd 0%,  100%)`
              }}
            >
              {!backgroundImage && (
                <div className="text-center text-white p-6">
                  {discountText && <div className="text-5xl md:text-7xl font-black mb-2">{discountText}</div>}
                  <div className="text-lg md:text-xl font-medium opacity-90">GIẢM GIÁ</div>
                </div>
              )}
              {backgroundImage && discountText && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold text-xl">{discountText}</div>
              )}
            </div>
            <div className="bg-white p-6 md:p-8 flex flex-col justify-center">
              {subHeading && <p className="text-sm uppercase tracking-wider mb-2" style={{ color: secondary }}>{subHeading}</p>}
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">{heading}</h2>
              {description && <p className="text-slate-500 text-sm mb-5">{description}</p>}
              <div className="mb-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Còn lại</p>
                {timeLeft.isExpired ? renderExpiredState() : renderTimerDisplay('default')}
              </div>
              {buttonText && !timeLeft.isExpired && (
                <a href={buttonLink} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 w-full md:w-auto" style={{ backgroundColor: brandColor }}>
                  {buttonText}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Style 5: Sticky - Compact top bar
  if (style === 'sticky') {
    return (
      <section 
        className="w-full py-3 px-4"
        style={{ backgroundColor: brandColor }}
        role="banner"
        aria-label="Khuyến mãi có thời hạn"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
              {discountText && (
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold uppercase">{discountText}</span>
              )}
              <span className="text-white font-semibold text-sm md:text-base">{heading}</span>
            </div>
            <div className="flex items-center gap-2">
              {timeLeft.isExpired ? (
                <span className="text-white/80 text-sm">Đã kết thúc</span>
              ) : (
                <div className="flex items-center gap-1.5 text-white font-mono" role="timer" aria-live="polite">
                  {showDays && (
                    <>
                      <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
                      <span className="text-white/60">:</span>
                    </>
                  )}
                  {showHours && (
                    <>
                      <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span className="text-white/60">:</span>
                    </>
                  )}
                  {showMinutes && (
                    <>
                      <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      {showSeconds && <span className="text-white/60">:</span>}
                    </>
                  )}
                  {showSeconds && (
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  )}
                </div>
              )}
            </div>
            {buttonText && !timeLeft.isExpired && (
              <a href={buttonLink} className="bg-white px-4 py-1.5 rounded-full text-sm font-semibold transition-transform hover:scale-105 whitespace-nowrap" style={{ color: secondary }}>
                {buttonText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Style 6: Popup - Full screen modal overlay (default fallback)
  // Only show once per session, can dismiss by clicking X, background, or "Để sau"
  if (style === 'popup' && isPopupDismissed) {
    return null; // Don't render if already dismissed this session
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="countdown-popup-title"
      onClick={dismissPopup} // Click background to dismiss
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl overflow-hidden relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) =>{  e.stopPropagation(); }} // Prevent dismiss when clicking popup content
      >
        {/* Close button */}
        <button 
          type="button" 
          onClick={dismissPopup}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 z-10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image/Visual header */}
        <div 
          className="h-36 md:h-44 flex items-center justify-center"
          style={{ 
            background: backgroundImage 
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${backgroundImage}) center/cover`
              : `linear-gradient(135deg, ee 0%,  100%)`
          }}
        >
          {discountText && (
            <div className="text-center text-white">
              <div className="text-5xl md:text-6xl font-black">{discountText}</div>
              <div className="text-sm font-medium opacity-80 mt-1">{subHeading || 'GIẢM GIÁ'}</div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5 md:p-6 text-center">
          <h3 id="countdown-popup-title" className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{heading}</h3>
          {description && <p className="text-slate-500 text-sm mb-4 line-clamp-2">{description}</p>}
          <div className="mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Còn lại</p>
            {timeLeft.isExpired ? renderExpiredState() : renderTimerDisplay('default')}
          </div>
          {buttonText && !timeLeft.isExpired && (
            <a href={buttonLink} className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: brandColor }}>
              {buttonText}
            </a>
          )}
          {/* Skip link */}
          <button type="button" onClick={dismissPopup} className="text-slate-400 text-xs mt-3 hover:text-slate-600 transition-colors">
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ FOOTER SECTION ============
// 6 Styles: classic, modern, corporate, minimal, centered, stacked
// Synced with previews.tsx FooterPreview
interface FooterColumn { id?: number | string; title: string; links: { label: string; url: string }[] }
interface SocialLinkItem { id?: number | string; platform: string; url: string; icon: string }

const SOCIAL_ORIGINAL_COLORS: Record<string, { bg: string; icon: string }> = {
  facebook: { bg: '#1877f2', icon: '#ffffff' },
  instagram: { bg: '#e1306c', icon: '#ffffff' },
  youtube: { bg: '#ff0000', icon: '#ffffff' },
  tiktok: { bg: '#000000', icon: '#ffffff' },
  zalo: { bg: '#0084ff', icon: '#ffffff' },
  twitter: { bg: '#1da1f2', icon: '#ffffff' },
  x: { bg: '#000000', icon: '#ffffff' },
  pinterest: { bg: '#E60023', icon: '#ffffff' },
  linkedin: { bg: '#0a66c2', icon: '#ffffff' },
  github: { bg: '#0f172a', icon: '#ffffff' },
};

function FooterSection({
  config,
  brandColor,
  secondary,
  mode,
}: {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: FooterBrandMode;
}) {
  const style = (config.style as FooterStyle) || 'classic';
  const logo = (config.logo as string) || '';
  const description = (config.description as string) || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.';
  const columns = (config.columns as FooterColumn[]) || [];
  const socialLinks = (config.socialLinks as SocialLinkItem[]) || [];
  const copyright = (config.copyright as string) || '© 2024 VietAdmin. All rights reserved.';
  const showSocialLinks = config.showSocialLinks !== false;
  const showBctLogo = config.showBctLogo === true;
  const bctLogoType = (config.bctLogoType as 'thong-bao' | 'dang-ky') ?? 'thong-bao';
  const bctLogoLink = typeof config.bctLogoLink === 'string' ? config.bctLogoLink.trim() : '';
  const bctLogoSrc = bctLogoType === 'dang-ky'
    ? '/images/bct/logo-da-dang-ky-bct.webp'
    : '/images/bct/logo-da-thong-bao-bct.png';
  const colors: FooterLayoutColors = getFooterLayoutColors(style, brandColor, secondary, mode);
  const useOriginalSocialIconColors = config.useOriginalSocialIconColors !== false;
  const resolveSocialStyles = (platform: string, fallbackBg: string, fallbackText: string) => {
    if (!useOriginalSocialIconColors) {
      return { bg: fallbackBg, color: fallbackText };
    }

    const original = SOCIAL_ORIGINAL_COLORS[platform];
    if (!original) {
      return { bg: fallbackBg, color: fallbackText };
    }

    return { bg: original.bg, color: original.icon };
  };

  const renderBctLogo = (className = 'h-10') => {
    if (!showBctLogo) {return null;}
    const image = (
      <SiteImage src={bctLogoSrc} alt="Bộ Công Thương" className={`${className} w-auto object-contain`} mode="decorative" />
    );
    if (!bctLogoLink) {return image;}
    return (
      <a href={bctLogoLink} target="_blank" rel="noopener noreferrer">
        {image}
      </a>
    );
  };

  // Social icons
  const PinterestIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
  const renderSocialIcon = (platform: string, size: number = 18) => {
    switch (platform) {
      case 'facebook': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
      }
      case 'instagram': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
      }
      case 'youtube': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>;
      }
      case 'tiktok': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>;
      }
      case 'zalo': {
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"/></svg>;
      }
      case 'x': {
        return <X size={size} />;
      }
      case 'pinterest': {
        return <PinterestIcon size={size} />;
      }
      default: {
        return <Globe size={size} />;
      }
    }
  };

  const getSocials = () => socialLinks.length > 0 ? socialLinks : [
    { icon: 'facebook', platform: 'facebook', url: '#' },
    { icon: 'instagram', platform: 'instagram', url: '#' },
    { icon: 'youtube', platform: 'youtube', url: '#' }
  ];

  const getColumns = () => columns.length > 0 ? columns : [
    { links: [{ label: 'Giới thiệu', url: '/about' }, { label: 'Tuyển dụng', url: '/careers' }], title: 'Về chúng tôi' },
    { links: [{ label: 'FAQ', url: '/faq' }, { label: 'Liên hệ', url: '/contact' }], title: 'Hỗ trợ' }
  ];

  if (style === 'classic') {
    return (
      <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-3 md:px-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 space-y-3 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                  {logo ? <SiteImage src={logo} alt="Logo" className="h-5 w-5 object-contain brightness-110" mode="logo" /> : <div className="h-5 w-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>V</div>}
                </div>
                <span className="text-base font-bold tracking-tight" style={{ color: colors.heading }}>VietAdmin</span>
              </div>
              <p className="text-xs leading-relaxed md:max-w-sm" style={{ color: colors.textMuted }}>{description}</p>
              {showSocialLinks && (
                <div className="flex gap-2 justify-center md:justify-start">
                    {getSocials().map((s, i) => {
                      const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                      return (
                        <a
                          key={`${s.id ?? 'social'}-${i}`}
                          href={s.url}
                          className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
                          style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                        >
                          {renderSocialIcon(s.platform, 22)}
                        </a>
                      );
                    })}
                </div>
              )}
            </div>
            <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-5 text-center md:text-left">
              {getColumns().slice(0, 3).map((col, i) => (
                <div key={`${col.id ?? 'col'}-${i}`}>
                  <h3 className="font-semibold text-xs tracking-wide mb-2" style={{ color: colors.heading }}>{col.title}</h3>
                  <ul className="space-y-1.5">
                    {col.links.map((link, j) => (
                      <li key={j}>
                        <a
                          href={link.url}
                          className="text-xs transition-colors"
                          style={{ color: colors.textMuted }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-3 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left" style={{ borderTop: `1px solid ${colors.borderSoft}` }}>
            <p className="text-[10px]" style={{ color: colors.textSubtle }}>{copyright}</p>
            {renderBctLogo('h-14')}
          </div>
        </div>
      </footer>
    );
  }

  if (style === 'modern') {
    return (
      <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto px-3 md:px-4 flex flex-col items-center text-center space-y-3 md:space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-1 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {logo ? <SiteImage src={logo} alt="Logo" className="h-6 w-6 object-contain" mode="logo" /> : <div className="h-6 w-6 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>V</div>}
            </div>
            <h2 className="text-base font-bold tracking-tight" style={{ color: colors.heading }}>VietAdmin</h2>
            <p className="text-xs leading-relaxed max-w-xs md:max-w-md" style={{ color: colors.textMuted }}>{description}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-4 gap-y-1.5">
            {getColumns().flatMap(col => col.links).slice(0, 8).map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-xs font-medium underline-offset-4 transition-colors"
                style={{ color: colors.textMuted, textDecorationColor: colors.primary }}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="w-12 h-px" style={{ backgroundColor: colors.dividerGradient }}></div>
          {showSocialLinks && (
            <div className="flex gap-3">
              {getSocials().map((s, i) => {
                const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                return (
                  <a
                    key={`${s.id ?? 'social'}-${i}`}
                    href={s.url}
                    className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
                    style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                  >
                    {renderSocialIcon(s.platform, 22)}
                  </a>
                );
              })}
            </div>
          )}
          <div className="flex flex-col items-center gap-2">
            {renderBctLogo('h-14')}
            <p className="text-[10px] font-medium" style={{ color: colors.textSubtle }}>{copyright}</p>
          </div>
        </div>
      </footer>
    );
  }

  if (style === 'corporate') {
    return (
      <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-3 md:px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-2">
              {logo ? <SiteImage src={logo} alt="Logo" className="h-5 w-5 object-contain" mode="logo" /> : <div className="h-5 w-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>V</div>}
              <span className="text-sm font-bold" style={{ color: colors.heading }}>VietAdmin</span>
            </div>
            {showSocialLinks && (
              <div className="flex gap-2">
                {getSocials().map((s, i) => {
                  const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                  return (
                    <a
                      key={`${s.id ?? 'social'}-${i}`}
                      href={s.url}
                      className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                    >
                      {renderSocialIcon(s.platform, 18)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div className="py-5 grid grid-cols-1 md:grid-cols-4 gap-5 text-center md:text-left">
            <div className="md:col-span-2 md:pr-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>Về Công Ty</h4>
              <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{description}</p>
            </div>
            {getColumns().slice(0, 2).map((col, i) => (
              <div key={`${col.id ?? 'col'}-${i}`}>
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a
                        href={link.url}
                        className="text-xs transition-colors"
                        style={{ color: colors.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-3 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
            <p className="text-[10px]" style={{ color: colors.textSubtle }}>{copyright}</p>
            {renderBctLogo('h-10')}
          </div>
        </div>
      </footer>
    );
  }

  if (style === 'minimal') {
    return (
      <footer className="w-full py-3 md:py-4" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className="max-w-7xl mx-auto px-3 md:px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col md:flex-row items-center gap-2">
              {logo ? <SiteImage src={logo} alt="Logo" className="h-4 w-4" mode="logo" /> : <div className="h-4 w-4 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>V</div>}
              <span className="text-[10px] font-medium" style={{ color: colors.textSubtle }}>{copyright}</span>
            </div>
            {showSocialLinks && (
              <div className="flex gap-2">
                {getSocials().map((s, i) => {
                  const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                  return (
                    <a
                      key={`${s.id ?? 'social'}-${i}`}
                      href={s.url}
                      className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                    >
                      {renderSocialIcon(s.platform, 18)}
                    </a>
                  );
                })}
              </div>
            )}
            {renderBctLogo('h-10')}
          </div>
        </div>
      </footer>
    );
  }

  if (style === 'centered') {
    return (
      <footer className="w-full py-8 md:py-10" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-6xl mx-auto px-3 md:px-4 text-center">
          <div className="flex flex-col items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: colors.centeredBrandBg, borderColor: colors.centeredBrandBorder }}>
              {logo ? <SiteImage src={logo} alt="Logo" className="h-7 w-7 object-contain" mode="logo" /> : <div className="h-7 w-7 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>V</div>}
            </div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: colors.heading }}>VietAdmin</h2>
            <p className="text-xs leading-relaxed max-w-xs md:max-w-md" style={{ color: colors.textMuted }}>{description}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
            {getColumns().slice(0, 4).map((col, i) => (
              <div key={`${col.id ?? 'col'}-${i}`} className="text-center">
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.slice(0, 4).map((link, j) => (
                    <li key={j}>
                      <a
                        href={link.url}
                        className="text-xs transition-colors"
                        style={{ color: colors.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="w-16 h-px mx-auto mb-5" style={{ backgroundColor: colors.dividerGradient }}></div>
          {showSocialLinks && (
            <div className="flex justify-center gap-3 mb-4">
              {getSocials().map((s, i) => {
                const socialStyles = resolveSocialStyles(s.platform, colors.centeredSocialBg, colors.centeredSocialText);
                const socialBorder = useOriginalSocialIconColors && SOCIAL_ORIGINAL_COLORS[s.platform]
                  ? socialStyles.bg
                  : colors.centeredSocialBorder;
                const hoverStyles = useOriginalSocialIconColors && SOCIAL_ORIGINAL_COLORS[s.platform]
                  ? { bg: socialStyles.bg, border: socialStyles.bg, color: socialStyles.color }
                  : { bg: colors.centeredSocialHoverBg, border: colors.centeredSocialHoverBorder, color: colors.textOnAccent };

                return (
                  <a
                    key={`${s.id ?? 'social'}-${i}`}
                    href={s.url}
                    className="h-14 w-14 flex items-center justify-center rounded-full transition-colors"
                    style={{ backgroundColor: socialStyles.bg, border: `1px solid ${socialBorder}`, color: socialStyles.color }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hoverStyles.bg;
                      e.currentTarget.style.borderColor = hoverStyles.border;
                      e.currentTarget.style.color = hoverStyles.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = socialStyles.bg;
                      e.currentTarget.style.borderColor = socialBorder;
                      e.currentTarget.style.color = socialStyles.color;
                    }}
                  >
                    {renderSocialIcon(s.platform, 22)}
                  </a>
                );
              })}
            </div>
          )}
          <div className="flex flex-col items-center gap-2">
            {renderBctLogo('h-10')}
            <p className="text-[10px]" style={{ color: colors.textSubtle }}>{copyright}</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full py-6" style={{ backgroundColor: colors.bg, borderTop: `3px solid ${colors.stackedTopBorder}` }}>
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-5 text-center md:text-left">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>
            {logo ? <SiteImage src={logo} alt="Logo" className="h-6 w-6 object-contain brightness-110" mode="logo" /> : <span className="font-bold text-sm">V</span>}
          </div>
          <div className="md:flex-1">
            <h3 className="text-sm font-bold mb-1" style={{ color: colors.heading }}>VietAdmin</h3>
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: colors.textMuted }}>{description}</p>
          </div>
        </div>
        <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-3 md:gap-x-4 gap-y-2">
            {getColumns().flatMap(col => col.links).slice(0, 10).map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-xs font-medium transition-colors"
                style={{ color: colors.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {showSocialLinks && (
            <div className="flex gap-2">
              {getSocials().map((s, i) => {
                const socialStyles = resolveSocialStyles(s.platform, colors.stackedSocialBg, colors.stackedSocialText);
                const hoverStyles = useOriginalSocialIconColors && SOCIAL_ORIGINAL_COLORS[s.platform]
                  ? { bg: socialStyles.bg, color: socialStyles.color }
                  : { bg: colors.stackedSocialHoverBg, color: colors.textOnAccent };

                return (
                  <a
                    key={`${s.id ?? 'social'}-${i}`}
                    href={s.url}
                    className="h-10 w-10 flex items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hoverStyles.bg;
                      e.currentTarget.style.color = hoverStyles.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = socialStyles.bg;
                      e.currentTarget.style.color = socialStyles.color;
                    }}
                  >
                    {renderSocialIcon(s.platform, 22)}
                  </a>
                );
              })}
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center gap-2">
            {renderBctLogo('h-10')}
            <p className="text-[10px]" style={{ color: colors.textSubtle }}>{copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============ PLACEHOLDER SECTION ============
function PlaceholderSection({ type, title }: { type: string; title: string }) {
  return (
    <section className="py-16 px-4 bg-slate-100">
      <div className="max-w-4xl mx-auto text-center">
        <LayoutTemplate size={48} className="mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold text-slate-600 mb-2">{title}</h3>
        <p className="text-slate-500">Component type “{type}” chưa được implement</p>
      </div>
    </section>
  );
}
