import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BadgeCheck,
  Bell,
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Gift,
  Globe,
  Heart,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Star,
  ThumbsUp,
  Truck,
} from 'lucide-react';
import { CommentsPreview } from './DetailPreview';
import { getProductDetailColors } from '@/components/site/products/detail/_lib/colors';
import {
  getProductImageFrameConfig,
  getVerticalThumbnailSlots,
  type ProductImageAspectRatio,
} from '@/components/site/products/detail/_lib/image-aspect-ratio';
import { ProductImageLightbox } from '@/components/site/products/detail/_components/ProductImageLightbox';

type ProductDetailPreviewProps = {
  layoutStyle: 'classic' | 'modern' | 'minimal';
  showRating: boolean;
  showComments?: boolean;
  showCommentLikes?: boolean;
  showCommentReplies?: boolean;
  showWishlist: boolean;
  showShare: boolean;
  showAddToCart: boolean;
  showBuyNow: boolean;
  showVariants?: boolean;
  showAllProductImagesSection?: boolean;
  enableImageLightbox?: boolean;
  showHighlights: boolean;
  classicHighlights?: { icon: string; text: string }[];
  heroStyle?: 'full' | 'split' | 'minimal';
  contentWidth?: 'narrow' | 'medium' | 'wide';
  imageAspectRatio: ProductImageAspectRatio;
  device?: 'desktop' | 'tablet' | 'mobile';
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  relatedProductsMode?: 'fixed' | 'infiniteScroll' | 'pagination';
  relatedProductsPerPage?: number;
};

const formatVND = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const CLASSIC_HIGHLIGHT_ICON_MAP: Record<string, React.ElementType> = {
  Award,
  BadgeCheck,
  Bell,
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Globe,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Phone,
  RotateCcw,
  Shield,
  Star,
  ThumbsUp,
  Truck,
};

const PREVIEW_IMAGES = [
  '/seed_mau/tech/products/1.webp',
  '/seed_mau/tech/products/2.webp',
  '/seed_mau/tech/products/3.webp',
  '/seed_mau/tech/products/4.webp',
  '/seed_mau/tech/products/5.webp',
  '/seed_mau/tech/products/6.webp',
  '/seed_mau/tech/products/7.webp',
  '/seed_mau/tech/products/8.webp',
];

const PREVIEW_DESCRIPTION = 'Thiết kế sang trọng, hiệu năng bền bỉ và trải nghiệm màn hình sắc nét phù hợp nhu cầu cao cấp. Pin tối ưu cho cả ngày dài, camera linh hoạt và chất liệu hoàn thiện tinh tế.';
const RATING_STAR_ACTIVE_COLOR = '#f59e0b';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function preloadNeighborImages(images: string[], centerIndex: number) {
  if (typeof window === 'undefined' || images.length === 0) {
    return;
  }

  const candidates = [images[centerIndex], images[centerIndex - 1], images[centerIndex + 1]];
  candidates.forEach((candidate) => {
    if (!candidate) {
      return;
    }
    const image = new window.Image();
    image.src = candidate;
  });
}

function BlurredPreviewImage({ src, alt }: { src: string; alt: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [currentSrc, setCurrentSrc] = useState(src);
  const [incomingSrc, setIncomingSrc] = useState<string | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);

  useEffect(() => {
    if (!src) {
      setIncomingSrc(null);
      setIncomingVisible(false);
      return;
    }

    if (!currentSrc) {
      setCurrentSrc(src);
      return;
    }

    if (currentSrc === src) {
      return;
    }

    if (prefersReducedMotion) {
      setCurrentSrc(src);
      setIncomingSrc(null);
      setIncomingVisible(false);
      return;
    }

    setIncomingSrc(src);
    setIncomingVisible(false);

    const frame = window.requestAnimationFrame(() => setIncomingVisible(true));
    const timeout = window.setTimeout(() => {
      setCurrentSrc(src);
      setIncomingSrc(null);
      setIncomingVisible(false);
    }, 160);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [currentSrc, prefersReducedMotion, src]);

  return (
    <>
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${currentSrc})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: 'blur(24px)',
        }}
      />
      <div className="absolute inset-0 bg-black/10" />
      <img src={currentSrc} alt={alt} className="relative z-10 h-full w-full object-contain" />

      {incomingSrc && (
        <div className={`absolute inset-0 transition-opacity duration-150 ease-out ${incomingVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${incomingSrc})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'blur(24px)',
            }}
          />
          <div className="absolute inset-0 bg-black/10" />
          <img src={incomingSrc} alt={alt} className="relative z-10 h-full w-full object-contain" />
        </div>
      )}
    </>
  );
}

function ExpandablePreviewDescriptionBlock({
  children,
  buttonStyle,
}: {
  children: React.ReactNode;
  buttonStyle?: React.CSSProperties;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const checkOverflow = () => {
      setCanExpand(element.scrollHeight > element.clientHeight + 1);
    };
    checkOverflow();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, children]);

  return (
    <div>
      <div
        ref={contentRef}
        className={`${expanded ? '' : 'max-h-[640px] overflow-hidden md:max-h-[860px]'}`.trim()}
      >
        {children}
      </div>
      {canExpand && (
        <button
          type="button"
          className="mt-3 text-sm font-medium"
          style={buttonStyle}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}

function PreviewMobileCarousel({
  images,
  alt,
  activeIndex,
  onActiveIndexChange,
}: {
  images: string[];
  alt: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const width = container.clientWidth;
    if (!width) {
      return;
    }
    const targetLeft = activeIndex * width;
    if (Math.abs(container.scrollLeft - targetLeft) > 2) {
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [activeIndex]);

  useEffect(() => () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, []);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const width = container.clientWidth;
      if (!width) {
        return;
      }
      const nextIndex = Math.round(container.scrollLeft / width);
      if (nextIndex !== activeIndex) {
        onActiveIndexChange(nextIndex);
      }
    }, 120);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex h-full w-full snap-x snap-mandatory overflow-x-auto no-scrollbar scroll-smooth"
    >
      {images.map((image, index) => (
        <div key={`${image}-${index}`} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
          <BlurredPreviewImage src={image} alt={`${alt} ${index + 1}`} />
        </div>
      ))}
    </div>
  );
}

type PreviewThumbnailRailProps = {
  images: string[];
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  orientation: 'horizontal' | 'vertical';
  visibleSlots: number;
  tokens: ReturnType<typeof getProductDetailColors>;
  thumbnailAspectRatio: string;
  className?: string;
  listClassName?: string;
  itemClassName?: string;
};

function PreviewThumbnailRail({
  images,
  activeIndex = 0,
  onActiveIndexChange,
  orientation,
  visibleSlots,
  tokens,
  thumbnailAspectRatio,
  className,
  listClassName,
  itemClassName,
}: PreviewThumbnailRailProps) {
  const [startIndex, setStartIndex] = useState(0);
  const hasOverflow = images.length > visibleSlots;
  const maxStartIndex = Math.max(0, images.length - visibleSlots);
  const isVertical = orientation === 'vertical';

  useEffect(() => {
    if (!hasOverflow) {
      if (startIndex !== 0) {
        setStartIndex(0);
      }
      return;
    }
    if (startIndex > maxStartIndex) {
      setStartIndex(maxStartIndex);
    }
  }, [hasOverflow, maxStartIndex, startIndex]);

  useEffect(() => {
    if (!hasOverflow) {
      return;
    }
    if (activeIndex < startIndex) {
      setStartIndex(activeIndex);
      return;
    }
    if (activeIndex >= startIndex + visibleSlots) {
      setStartIndex(Math.max(0, activeIndex - visibleSlots + 1));
    }
  }, [activeIndex, hasOverflow, startIndex, visibleSlots]);

  if (images.length <= 1) {
    return null;
  }

  const visibleImages = hasOverflow ? images.slice(startIndex, startIndex + visibleSlots) : images;
  const canScrollPrev = hasOverflow && activeIndex > 0;
  const canScrollNext = hasOverflow && activeIndex < images.length - 1;
  const railClassName = `${isVertical ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2'} ${className ?? ''}`.trim();
  const listClass = `${isVertical ? 'flex flex-col gap-2' : 'flex gap-2'} ${listClassName ?? ''}`.trim();
  const arrowClassName = 'h-8 w-8 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40';
  const handlePrev = () => onActiveIndexChange?.(Math.max(0, activeIndex - 1));
  const handleNext = () => onActiveIndexChange?.(Math.min(images.length - 1, activeIndex + 1));

  return (
    <div className={railClassName}>
      {hasOverflow && (
        <button
          type="button"
          aria-label={isVertical ? 'Ảnh trước' : 'Ảnh trước'}
          disabled={!canScrollPrev}
          onClick={handlePrev}
          className={arrowClassName}
          style={{ borderColor: tokens.thumbnailBorder, color: tokens.thumbnailBorderActive, backgroundColor: tokens.surface }}
        >
          {isVertical ? <ChevronUp size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
      <div className={listClass}>
        {visibleImages.map((img, index) => {
          const actualIndex = hasOverflow ? startIndex + index : index;
          const isActive = actualIndex === activeIndex;
          return (
            <button
              key={`${img}-${actualIndex}`}
              type="button"
              onClick={() => onActiveIndexChange?.(actualIndex)}
              className={`${itemClassName ?? 'w-20 rounded-lg'} overflow-hidden border-2`}
              style={{
                aspectRatio: thumbnailAspectRatio,
                borderColor: isActive ? tokens.thumbnailBorderActive : tokens.thumbnailBorder,
                backgroundColor: tokens.surfaceMuted,
              }}
            >
              <img src={img} alt="" className="h-full w-full object-contain" />
            </button>
          );
        })}
      </div>
      {hasOverflow && (
        <button
          type="button"
          aria-label={isVertical ? 'Ảnh kế tiếp' : 'Ảnh kế tiếp'}
          disabled={!canScrollNext}
          onClick={handleNext}
          className={arrowClassName}
          style={{ borderColor: tokens.thumbnailBorder, color: tokens.thumbnailBorderActive, backgroundColor: tokens.surface }}
        >
          {isVertical ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
    </div>
  );
}

function VariantPreview({ tokens }: { tokens: ReturnType<typeof getProductDetailColors> }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold" style={{ color: tokens.metaText }}>Màu sắc</p>
        <div className="flex gap-2 mt-2">
          {['#111827', '#e11d48', '#0ea5e9'].map((color, index) => (
            <span
              key={color}
              className="h-6 w-6 rounded-full border"
              style={{
                backgroundColor: color,
                borderColor: index === 0 ? tokens.variantRing : tokens.border,
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: tokens.metaText }}>Dung lượng</p>
        <div className="flex gap-2 mt-2">
          {['128GB', '256GB', '512GB'].map((value, index) => (
            <span
              key={value}
              className="px-3 py-1 rounded-full text-xs border"
              style={index === 1
                ? { backgroundColor: tokens.variantChipActiveBg, borderColor: tokens.variantChipActiveBorder, color: tokens.variantChipActiveText }
                : { borderColor: tokens.variantChipBorder, color: tokens.variantChipText }}
            >
              {value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailPreview({
  layoutStyle,
  showRating,
  showComments,
  showCommentLikes,
  showCommentReplies,
  showWishlist,
  showShare,
  showAddToCart,
  showBuyNow,
  showVariants = true,
  showAllProductImagesSection = false,
  enableImageLightbox = false,
  showHighlights,
  classicHighlights = [],
  heroStyle = 'full',
  contentWidth = 'medium',
  imageAspectRatio,
  device = 'desktop',
  brandColor = '#06b6d4',
  secondaryColor,
  colorMode = 'single',
  relatedProductsMode = 'fixed',
  relatedProductsPerPage = 8,
}: ProductDetailPreviewProps) {
  const tokens = getProductDetailColors(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';
  const isDesktop = device === 'desktop';
  const isTablet = device === 'tablet';
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mainImageHeight, setMainImageHeight] = useState<number | null>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const mainImageHeightRef = useRef<number | null>(null);
  const productName = 'iPhone 15 Pro Max 256GB';
  const categoryName = 'Điện thoại';
  const sku = 'IP15PM-256';
  const stock = 12;
  const price = 34990000;
  const originalPrice = 36990000;
  const rating = 4.8;
  const reviews = 234;
  const hasRatingData = reviews > 0 && rating > 0;
  const discountPercent = Math.round((1 - price / originalPrice) * 100);
  const stockStatus = stock > 10
    ? { label: 'Còn hàng', color: tokens.stockSuccessText }
    : stock > 0
      ? { label: `Chỉ còn ${stock} sản phẩm`, color: tokens.stockWarningText }
      : { label: 'Hết hàng', color: tokens.stockDangerText };
  const fallbackHighlights = [
    { icon: 'Star', text: 'Chip A17 Pro mạnh mẽ' },
    { icon: 'Star', text: 'Camera 48MP chuyên nghiệp' },
    { icon: 'Star', text: 'Titanium siêu bền' },
  ];
  const highlightItems = classicHighlights.length > 0 ? classicHighlights : fallbackHighlights;
  const showHighlightBlock = showHighlights && highlightItems.length > 0;
  const relatedCount = relatedProductsMode === 'fixed' ? 4 : relatedProductsPerPage;
  const relatedItems = Array.from({ length: relatedCount }).map((_, index) => ({
    name: `Sản phẩm ${index + 1}`,
    price: formatVND(1250000 + index * 100000),
    image: PREVIEW_IMAGES[index % PREVIEW_IMAGES.length],
  }));
  const contentWidthClass = contentWidth === 'narrow'
    ? 'max-w-4xl'
    : contentWidth === 'wide'
      ? 'max-w-7xl'
      : 'max-w-6xl';
  const imageFrame = getProductImageFrameConfig(imageAspectRatio, layoutStyle);
  const mainImageFrameStyle: React.CSSProperties = { aspectRatio: imageFrame.frameAspectRatio };
  const thumbnailFrameStyle: React.CSSProperties = { aspectRatio: imageFrame.thumbnailAspectRatio };
  const relatedImageFrameStyle: React.CSSProperties = { aspectRatio: imageFrame.frameAspectRatio };
  const heroContainerClass = heroStyle === 'full'
    ? 'border rounded-2xl'
    : heroStyle === 'split'
      ? 'border rounded-2xl'
      : 'border rounded-xl';
  const heroContainerStyle = heroStyle === 'full'
    ? { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }
    : { borderColor: tokens.border, backgroundColor: tokens.surface };
  const heroImageWrapperClass = heroStyle === 'split'
    ? 'relative flex items-center justify-center p-6'
    : heroStyle === 'minimal'
      ? 'relative flex items-center justify-center p-3'
      : 'relative flex items-center justify-center p-6';
  const verticalVisibleSlots = mainImageHeight
    ? getVerticalThumbnailSlots({
      frameHeight: mainImageHeight,
      thumbnailWidth: 80,
      thumbnailAspectRatio: imageFrame.thumbnailAspectRatio,
      gap: 8,
      arrowHeight: 32,
      imageCount: PREVIEW_IMAGES.length,
      minSlots: 1,
    })
    : 6;
  const canOpenLightbox = enableImageLightbox && PREVIEW_IMAGES.length > 0;

  const openLightboxAt = (index: number) => {
    if (!canOpenLightbox) {
      return;
    }
    setLightboxIndex(index);
  };

  const handleLightboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenLightbox) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightboxAt(activeImageIndex);
    }
  };

  useEffect(() => {
    preloadNeighborImages(PREVIEW_IMAGES, activeImageIndex);
  }, [activeImageIndex]);

  useEffect(() => {
    const element = mainImageRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const nextHeight = Math.round(entries[0]?.contentRect?.height ?? 0);
      if (!nextHeight || nextHeight === mainImageHeightRef.current) {
        return;
      }
      mainImageHeightRef.current = nextHeight;
      setMainImageHeight(nextHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [layoutStyle]);

  const renderHighlights = () => (
    <div className="grid grid-cols-3 gap-4 p-4 rounded-xl" style={{ backgroundColor: tokens.highlightBg }}>
      {highlightItems.map((item, index) => {
        const Icon = CLASSIC_HIGHLIGHT_ICON_MAP[item.icon] ?? Star;
        return (
          <div key={`${item.icon}-${index}`} className="text-center">
            <Icon size={24} className="mx-auto mb-2" style={{ color: tokens.highlightIcon }} />
            <p className="text-xs" style={{ color: tokens.highlightText }}>{item.text}</p>
          </div>
        );
      })}
    </div>
  );

  const renderPreviewDescriptionImages = () => {
    if (!showAllProductImagesSection || PREVIEW_IMAGES.length === 0) {
      return null;
    }

    return (
      <div className="mt-6 border-t pt-6" style={{ borderColor: tokens.divider }}>
        <h4 className="text-base font-semibold" style={{ color: tokens.headingColor }}>Toàn bộ ảnh sản phẩm</h4>
        <p className="mt-1 text-xs" style={{ color: tokens.metaText }}>Lăn để xem chi tiết ảnh sản phẩm.</p>
        <div className="mt-3 space-y-4">
          {PREVIEW_IMAGES.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="w-full overflow-hidden rounded-2xl"
              style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
            >
              <img src={image} alt={`${productName} ${index + 1}`} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-6 px-4 min-h-[300px]">
      <div className="max-w-6xl mx-auto">
        {layoutStyle === 'classic' && (
          <>
            <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-8'}`}>
            <div className="space-y-3">
              <div className={imageFrame.frameWidthClassName}>
                <div
                  className={`relative rounded-xl overflow-hidden ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                  style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                  role={canOpenLightbox ? 'button' : undefined}
                  tabIndex={canOpenLightbox ? 0 : -1}
                  onClick={canOpenLightbox ? () => openLightboxAt(activeImageIndex) : undefined}
                  onKeyDown={handleLightboxKeyDown}
                >
                  {PREVIEW_IMAGES.length > 0 ? (
                    <>
                      {isMobile ? (
                        <PreviewMobileCarousel
                          images={PREVIEW_IMAGES}
                          alt={productName}
                          activeIndex={activeImageIndex}
                          onActiveIndexChange={setActiveImageIndex}
                        />
                      ) : (
                        <BlurredPreviewImage src={PREVIEW_IMAGES[activeImageIndex]} alt={productName} />
                      )}
                      {isMobile && PREVIEW_IMAGES.length > 1 && (
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                          {activeImageIndex + 1}/{PREVIEW_IMAGES.length}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: tokens.surfaceSoft }} />
                    </div>
                  )}
                </div>
              </div>
              {PREVIEW_IMAGES.length > 1 && (
                <>
                  {isTablet && (
                    <div className="grid grid-cols-4 gap-2">
                      {PREVIEW_IMAGES.slice(0, 4).map((img, index) => (
                        <div
                          key={img}
                          className="rounded-lg border-2 overflow-hidden relative"
                          style={{
                            ...thumbnailFrameStyle,
                            borderColor: index === 0 ? tokens.thumbnailBorderActive : tokens.thumbnailBorder,
                            backgroundColor: tokens.surfaceMuted,
                          }}
                        >
                          <img src={img} alt="" className="h-full w-full object-contain" />
                        </div>
                      ))}
                    </div>
                  )}
                  {isDesktop && (
                    <PreviewThumbnailRail
                      images={PREVIEW_IMAGES}
                      activeIndex={activeImageIndex}
                      orientation="horizontal"
                      visibleSlots={6}
                      tokens={tokens}
                      thumbnailAspectRatio={imageFrame.thumbnailAspectRatio}
                      onActiveIndexChange={setActiveImageIndex}
                      itemClassName="w-20 rounded-lg"
                    />
                  )}
                </>
              )}
            </div>
            <div className="space-y-3 md:space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] md:text-xs font-semibold"
                    style={{
                      backgroundColor: tokens.categoryBadgeBg,
                      color: tokens.categoryBadgeText,
                      borderColor: tokens.categoryBadgeBorder,
                      borderWidth: 1,
                    }}
                  >
                    {categoryName}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-semibold md:hidden" style={{ color: stockStatus.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                    <span>{stockStatus.label}</span>
                  </div>
                </div>
                <h1 className="text-lg md:text-2xl font-bold" style={{ color: tokens.headingColor }}>{productName}</h1>
                {showRating && hasRatingData && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          style={i < Math.floor(rating)
                            ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
                            : { color: tokens.ratingStarInactive }}
                        />
                      ))}
                    </div>
                    <span className="text-sm" style={{ color: tokens.ratingText }}>{rating} ({reviews} đánh giá)</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold" style={{ color: tokens.priceColor }}>{formatVND(price)}</span>
                <span className="text-lg line-through" style={{ color: tokens.priceOriginalText }}>{formatVND(originalPrice)}</span>
                <span className="px-2 py-0.5 text-sm font-medium rounded" style={{ backgroundColor: tokens.discountBadgeBg, color: tokens.discountBadgeText }}>-{Math.round((1 - price / originalPrice) * 100)}%</span>
              </div>
              {showVariants && <VariantPreview tokens={tokens} />}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center border rounded-lg" style={{ borderColor: tokens.quantityBorder }}>
                  <button className="p-3" disabled>
                    <Minus size={18} style={{ color: tokens.quantityIconMuted }} />
                  </button>
                  <span className="w-12 text-center font-medium" style={{ color: tokens.quantityText }}>1</span>
                  <button className="p-3" disabled>
                    <Plus size={18} style={{ color: tokens.quantityIconMuted }} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {showAddToCart && (
                    <button className="py-3.5 px-8 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}>
                      <ShoppingCart size={20} />
                      Thêm vào giỏ hàng
                    </button>
                  )}
                  {showBuyNow && (
                    <button
                      className="py-3.5 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]"
                      style={{
                        borderColor: tokens.ctaSecondaryBorder,
                        color: tokens.ctaSecondaryText,
                        '--cta-secondary-bg': tokens.ctaSecondaryHoverBg,
                        '--cta-secondary-hover-bg': tokens.ctaSecondaryHoverBg,
                        '--cta-secondary-ring': tokens.inputRing,
                      } as React.CSSProperties}
                    >
                      Mua ngay
                    </button>
                  )}
                </div>

                {showWishlist && (
                  <button className="p-3.5 rounded-xl border" style={{ borderColor: tokens.wishlistBorder, backgroundColor: tokens.wishlistBg }}>
                    <Heart size={20} style={{ color: tokens.wishlistIcon }} />
                  </button>
                )}
                {showShare && (
                  <button className="p-3.5 rounded-xl border" style={{ borderColor: tokens.shareBorder, backgroundColor: tokens.shareBg }}>
                    <Share2 size={20} style={{ color: tokens.shareIcon }} />
                  </button>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs md:text-sm font-medium" style={{ color: stockStatus.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                <span>{stockStatus.label}</span>
              </div>

              {showHighlightBlock && renderHighlights()}
              <div className="border-t pt-6" style={{ borderColor: tokens.divider }}>
                <h3 className="font-semibold mb-4" style={{ color: tokens.headingColor }}>Mô tả sản phẩm</h3>
                <ExpandablePreviewDescriptionBlock buttonStyle={{ color: tokens.primary }}>
                  <div className="prose prose-sm max-w-none" style={{ color: tokens.bodyText }}>
                    {PREVIEW_DESCRIPTION}
                  </div>
                  {renderPreviewDescriptionImages()}
                </ExpandablePreviewDescriptionBlock>
              </div>
            </div>
          </div>

          <CommentsPreview
            showComments={showComments}
            showLikes={showCommentLikes}
            showReplies={showCommentReplies}
            brandColor={brandColor}
          />
          </>
        )}

        {layoutStyle === 'modern' && (
          <div className="space-y-5">
            <header className="border-b pb-3" style={{ borderColor: tokens.divider }}>
              <div className="flex items-center justify-between gap-4 text-sm" style={{ color: tokens.breadcrumbText }}>
                <div className={`${isMobile ? 'flex items-center gap-1 text-[11px]' : 'flex items-center gap-2'} truncate`}>
                  {isMobile ? (
                    <>
                      <span>{categoryName}</span>
                      <ChevronRight size={10} />
                      <span className="truncate" style={{ color: tokens.breadcrumbActive }}>{productName}</span>
                    </>
                  ) : (
                    <>
                      <span>Trang chủ</span>
                      <ChevronRight size={14} />
                      <span>Sản phẩm</span>
                      <ChevronRight size={14} />
                      <span className="truncate" style={{ color: tokens.breadcrumbActive }}>{productName}</span>
                    </>
                  )}
                </div>
                {showWishlist && (
                  <button className="inline-flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                    <Heart size={16} style={{ color: tokens.wishlistIcon }} />
                    Yêu thích
                  </button>
                )}
              </div>
            </header>

            <div className="grid md:grid-cols-2 gap-5 md:gap-6 lg:gap-10">
              <div className="space-y-3 md:space-y-4">
                {heroStyle === 'split' ? (
                  <div className={`overflow-hidden ${heroContainerClass}`} style={heroContainerStyle}>
                    <div className="grid md:grid-cols-2 gap-3 items-center p-3 md:p-5">
                      <div className={imageFrame.frameWidthClassName}>
                    <div
                      className={`relative rounded-xl overflow-hidden ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                      style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                      role={canOpenLightbox ? 'button' : undefined}
                      tabIndex={canOpenLightbox ? 0 : -1}
                      onClick={canOpenLightbox ? () => openLightboxAt(activeImageIndex) : undefined}
                      onKeyDown={handleLightboxKeyDown}
                    >
                      {discountPercent > 0 && (
                        <span
                          className="absolute left-3 top-3 z-30 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: tokens.discountBadgeBg, color: tokens.discountBadgeText }}>
                          -{discountPercent}%
                        </span>
                      )}
                      {PREVIEW_IMAGES.length > 0 ? (
                        <>
                          {isMobile ? (
                            <PreviewMobileCarousel
                              images={PREVIEW_IMAGES}
                              alt={productName}
                              activeIndex={activeImageIndex}
                              onActiveIndexChange={setActiveImageIndex}
                            />
                          ) : (
                            <BlurredPreviewImage src={PREVIEW_IMAGES[activeImageIndex]} alt={productName} />
                          )}
                          {isMobile && (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                              {activeImageIndex + 1}/{PREVIEW_IMAGES.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: tokens.surfaceSoft }} />
                        </div>
                      )}
                    </div>
                  </div>
                    </div>
                  </div>
                ) : (
                  <div className={`overflow-hidden ${heroContainerClass}`} style={heroContainerStyle}>
                    <div className={heroImageWrapperClass}>
                  <div className={`${imageFrame.frameWidthClassName} overflow-hidden`}>
                    <div
                      className={`relative overflow-hidden rounded-xl ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                      style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                      role={canOpenLightbox ? 'button' : undefined}
                      tabIndex={canOpenLightbox ? 0 : -1}
                      onClick={canOpenLightbox ? () => openLightboxAt(activeImageIndex) : undefined}
                      onKeyDown={handleLightboxKeyDown}
                    >
                      {discountPercent > 0 && (
                        <span
                          className="absolute left-3 top-3 z-30 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: tokens.discountBadgeBg, color: tokens.discountBadgeText }}>
                          -{discountPercent}%
                        </span>
                      )}
                      {PREVIEW_IMAGES.length > 0 ? (
                        <>
                          {isMobile ? (
                            <PreviewMobileCarousel
                              images={PREVIEW_IMAGES}
                              alt={productName}
                              activeIndex={activeImageIndex}
                              onActiveIndexChange={setActiveImageIndex}
                            />
                          ) : (
                            <BlurredPreviewImage src={PREVIEW_IMAGES[activeImageIndex]} alt={productName} />
                          )}
                          {isMobile && (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                              {activeImageIndex + 1}/{PREVIEW_IMAGES.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="w-40 h-40 rounded-xl" style={{ backgroundColor: tokens.surfaceSoft }} />
                      )}
                    </div>
                  </div>
                </div>
                  </div>
                )}

                {heroStyle !== 'minimal' && PREVIEW_IMAGES.length > 1 && (
                  <>
                    {isDesktop && (
                      <PreviewThumbnailRail
                        images={PREVIEW_IMAGES}
                        activeIndex={activeImageIndex}
                        orientation="horizontal"
                        visibleSlots={5}
                        tokens={tokens}
                        thumbnailAspectRatio={imageFrame.thumbnailAspectRatio}
                        onActiveIndexChange={setActiveImageIndex}
                        itemClassName="w-20 rounded-xl"
                      />
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: tokens.categoryBadgeBg,
                      color: tokens.categoryBadgeText,
                      borderColor: tokens.categoryBadgeBorder,
                      borderWidth: 1,
                    }}
                  >
                    {categoryName}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-semibold md:hidden" style={{ color: stockStatus.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                    <span>{stockStatus.label}</span>
                  </div>
                </div>

                <h1 className="text-lg md:text-3xl font-light tracking-tight" style={{ color: tokens.headingColor }}>{productName}</h1>

                {showRating && hasRatingData && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: tokens.ratingText }}>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          style={star <= Math.round(rating)
                            ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
                            : { color: tokens.ratingStarInactive }}
                        />
                      ))}
                    </div>
                    <span>{rating} ({reviews})</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xl md:text-3xl font-light" style={{ color: tokens.priceColor }}>{formatVND(price)}</span>
                    <span className="text-base line-through" style={{ color: tokens.priceOriginalText }}>{formatVND(originalPrice)}</span>
                  </div>
                </div>

                {showVariants && <VariantPreview tokens={tokens} />}

                <div className="h-px w-full" style={{ backgroundColor: tokens.divider }} />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: tokens.bodyText }}>Số lượng</label>
                  <div className="flex items-center gap-3">
                    <button type="button" className="h-10 w-10 border rounded-full flex items-center justify-center" style={{ borderColor: tokens.quantityBorder }}>
                      <Minus className="w-4 h-4" style={{ color: tokens.quantityIcon }} />
                    </button>
                    <div className="w-16 text-center">
                      <span className="text-lg font-medium" style={{ color: tokens.quantityText }}>1</span>
                    </div>
                    <button type="button" className="h-10 w-10 border rounded-full flex items-center justify-center" style={{ borderColor: tokens.quantityBorder }}>
                      <Plus className="w-4 h-4" style={{ color: tokens.quantityIcon }} />
                    </button>
                  </div>
                </div>

                {(showAddToCart || showBuyNow || showWishlist) && (
                  <div className="space-y-2.5">
                    {showAddToCart && (
                      <button className="w-full h-12 text-base font-semibold" style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}>
                        <ShoppingBag className="w-5 h-5 mr-2 inline-block" />
                        Thêm vào giỏ hàng
                      </button>
                    )}
                    {showBuyNow && (
                      <button
                        className="w-full h-12 text-base font-semibold border transition-all cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]"
                        style={{
                          borderColor: tokens.ctaSecondaryBorder,
                          color: tokens.ctaSecondaryText,
                          '--cta-secondary-bg': tokens.ctaSecondaryHoverBg,
                          '--cta-secondary-hover-bg': tokens.ctaSecondaryHoverBg,
                          '--cta-secondary-ring': tokens.inputRing,
                        } as React.CSSProperties}
                      >
                        Mua ngay
                      </button>
                    )}
                    {showWishlist && (
                      <button className="w-full h-12 text-base border" style={{ borderColor: tokens.wishlistBorder, color: tokens.metaText, backgroundColor: tokens.wishlistBg }}>
                        <Heart className="w-5 h-5 mr-2 inline-block" style={{ color: tokens.wishlistIcon }} />
                        Thêm vào yêu thích
                      </button>
                    )}
                    <div className="hidden md:flex items-center gap-2 text-xs md:text-sm font-medium" style={{ color: stockStatus.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                      <span>{stockStatus.label}</span>
                    </div>
                  </div>
                )}

                {showHighlightBlock && renderHighlights()}

                <div className="border rounded-2xl p-4" style={{ borderColor: tokens.border }}>
                  <ExpandablePreviewDescriptionBlock buttonStyle={{ color: tokens.primary }}>
                    <div className="prose prose-sm max-w-none" style={{ color: tokens.bodyText }}>
                      {PREVIEW_DESCRIPTION}
                    </div>
                    {renderPreviewDescriptionImages()}
                  </ExpandablePreviewDescriptionBlock>
                </div>

                <CommentsPreview
                  showComments={showComments}
                  showLikes={showCommentLikes}
                  showReplies={showCommentReplies}
                  brandColor={brandColor}
                />
              </div>
            </div>
          </div>
        )}

        {layoutStyle === 'minimal' && (
          <div className={`space-y-5 ${contentWidthClass} mx-auto`}>
            <div className={`${isMobile ? 'flex items-center gap-1 text-[11px]' : 'text-xs flex items-center gap-2'}`} style={{ color: tokens.breadcrumbText }}>
              {isMobile ? (
                <>
                  <span>{categoryName}</span>
                  <ChevronRight size={10} />
                  <span className="truncate max-w-[180px]" style={{ color: tokens.breadcrumbActive }}>{productName}</span>
                </>
              ) : (
                <>
                  <span>Trang chủ</span>
                  <ChevronRight size={12} />
                  <span>Sản phẩm</span>
                  <ChevronRight size={12} />
                  <span className="truncate max-w-[160px]" style={{ color: tokens.breadcrumbActive }}>{productName}</span>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-7">
                <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 items-start">
                  {PREVIEW_IMAGES.length > 1 && isDesktop && (
                    <div className="hidden md:flex md:flex-col md:w-20 shrink-0">
                      <PreviewThumbnailRail
                        images={PREVIEW_IMAGES}
                        activeIndex={activeImageIndex}
                        orientation="vertical"
                        visibleSlots={verticalVisibleSlots}
                        tokens={tokens}
                        thumbnailAspectRatio={imageFrame.thumbnailAspectRatio}
                        onActiveIndexChange={setActiveImageIndex}
                        itemClassName="w-full rounded-sm"
                      />
                    </div>
                  )}

                  <div className={`flex-1 ${imageFrame.frameWidthClassName}`}>
                    <div
                      ref={mainImageRef}
                      className={`relative w-full rounded-sm overflow-hidden ${canOpenLightbox ? 'cursor-zoom-in' : ''}`.trim()}
                      style={{ ...mainImageFrameStyle, backgroundColor: tokens.surfaceMuted }}
                      role={canOpenLightbox ? 'button' : undefined}
                      tabIndex={canOpenLightbox ? 0 : -1}
                      onClick={canOpenLightbox ? () => openLightboxAt(activeImageIndex) : undefined}
                      onKeyDown={handleLightboxKeyDown}
                    >
                      {discountPercent > 0 && (
                        <span
                          className="absolute left-3 top-3 z-30 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: tokens.discountBadgeBg, color: tokens.discountBadgeText }}>
                          -{discountPercent}%
                        </span>
                      )}
                      {PREVIEW_IMAGES.length > 0 ? (
                        <>
                          {isMobile ? (
                            <PreviewMobileCarousel
                              images={PREVIEW_IMAGES}
                              alt={productName}
                              activeIndex={activeImageIndex}
                              onActiveIndexChange={setActiveImageIndex}
                            />
                          ) : (
                            <BlurredPreviewImage src={PREVIEW_IMAGES[activeImageIndex]} alt={productName} />
                          )}
                          {isMobile && (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-sm" style={{ backgroundColor: tokens.surface, color: tokens.headingColor }}>
                                {activeImageIndex + 1}/{PREVIEW_IMAGES.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: tokens.surfaceSoft }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 px-0 md:px-2 py-2 lg:py-0 flex flex-col justify-center">
                <div className="mb-3 md:mb-5 space-y-2 md:space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] md:text-xs font-semibold"
                      style={{
                        backgroundColor: tokens.categoryBadgeBg,
                        color: tokens.categoryBadgeText,
                        borderColor: tokens.categoryBadgeBorder,
                        borderWidth: 1,
                      }}
                    >
                      {categoryName}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-semibold md:hidden" style={{ color: stockStatus.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                      <span>{stockStatus.label}</span>
                    </div>
                  </div>
                  <h1 className="text-xl md:text-3xl lg:text-[2rem] font-medium leading-tight tracking-tight" style={{ color: tokens.headingColor }}>{productName}</h1>
                  {showRating && hasRatingData && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: tokens.ratingText }}>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            style={star <= Math.round(rating)
                              ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
                              : { color: tokens.ratingStarInactive }}
                          />
                        ))}
                      </div>
                      <span>{rating} ({reviews})</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-lg md:text-2xl font-semibold" style={{ color: tokens.priceColor }}>
                      {formatVND(price)}
                    </p>
                    <span className="text-sm md:text-base line-through" style={{ color: tokens.priceOriginalText }}>
                      {formatVND(originalPrice)}
                    </span>
                  </div>
                  <div className="mt-3 md:mt-4">
                    {showVariants && <VariantPreview tokens={tokens} />}
                  </div>
                </div>

                {(showAddToCart || showBuyNow || showWishlist) && (
                  <div className="flex flex-col gap-2.5 md:gap-3 mb-4 md:mb-5 border-t pt-4 md:pt-5" style={{ borderColor: tokens.divider }}>
                    <div className="flex gap-4">
                      {showAddToCart && (
                        <button className="flex-1 h-14 uppercase tracking-wider text-sm font-medium" style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}>
                          Thêm vào giỏ
                        </button>
                      )}
                      {showWishlist && (
                        <button className="w-14 h-14 border flex items-center justify-center" style={{ borderColor: tokens.wishlistBorder, backgroundColor: tokens.wishlistBg }}>
                          <Heart size={20} style={{ color: tokens.wishlistIcon }} />
                        </button>
                      )}
                    </div>
                    {showBuyNow && (
                      <button
                        className="h-12 uppercase tracking-wider text-xs font-medium border transition-all cursor-pointer bg-[var(--cta-secondary-bg)] shadow-sm hover:bg-[var(--cta-secondary-hover-bg)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-secondary-ring)]"
                        style={{
                          borderColor: tokens.ctaSecondaryBorder,
                          color: tokens.ctaSecondaryText,
                          '--cta-secondary-bg': tokens.ctaSecondaryHoverBg,
                          '--cta-secondary-hover-bg': tokens.ctaSecondaryHoverBg,
                          '--cta-secondary-ring': tokens.inputRing,
                        } as React.CSSProperties}
                      >
                        Mua ngay
                      </button>
                    )}
                    <div className="hidden md:flex items-center gap-2 text-xs md:text-sm font-medium" style={{ color: stockStatus.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                      <span>{stockStatus.label}</span>
                    </div>
                  </div>
                )}

                {showHighlightBlock && renderHighlights()}

                <div className="space-y-4 text-sm font-light" style={{ color: tokens.metaText }}>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: tokens.divider }}>
                    <span>SKU</span>
                    <span className="font-mono" style={{ color: tokens.bodyText }}>{sku}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border px-6 py-8" style={{ borderColor: tokens.border }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.headingColor }}>Mô tả sản phẩm</h2>
              <ExpandablePreviewDescriptionBlock buttonStyle={{ color: tokens.primary }}>
                <div className="leading-relaxed" style={{ color: tokens.bodyText }}>
                  {PREVIEW_DESCRIPTION}
                </div>
                {renderPreviewDescriptionImages()}
              </ExpandablePreviewDescriptionBlock>
            </div>

            <CommentsPreview
              showComments={showComments}
              showLikes={showCommentLikes}
              showReplies={showCommentReplies}
              brandColor={brandColor}
            />

            <section className="mt-12 pt-8 border-t" style={{ borderColor: tokens.divider }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold" style={{ color: tokens.headingColor }}>Sản phẩm liên quan</h2>
                <span className="text-xs" style={{ color: tokens.metaText }}>
                  {relatedProductsMode === 'fixed' && '4 sản phẩm'}
                  {relatedProductsMode === 'infiniteScroll' && `Cuộn vô hạn · ${relatedProductsPerPage}/lần`}
                  {relatedProductsMode === 'pagination' && `Phân trang · ${relatedProductsPerPage}/trang`}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="rounded-xl border overflow-hidden" style={{ borderColor: tokens.relatedCardBorder, backgroundColor: tokens.relatedCardBg }}>
                    <div className="overflow-hidden" style={{ ...relatedImageFrameStyle, backgroundColor: tokens.surfaceMuted }}>
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium line-clamp-2" style={{ color: tokens.relatedTitle }}>{item.name}</p>
                      <p className="text-xs font-semibold mt-2" style={{ color: tokens.relatedPrice }}>{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              {relatedProductsMode === 'infiniteScroll' && (
                <div className="text-center mt-5 text-xs" style={{ color: tokens.metaText }}>Cuộn để xem thêm...</div>
              )}
              {relatedProductsMode === 'pagination' && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  {[1, 2, 3].map((page) => (
                    <span
                      key={page}
                      className="h-7 w-7 rounded-md border flex items-center justify-center text-xs"
                      style={page === 1
                        ? { backgroundColor: tokens.primary, borderColor: tokens.primary, color: '#fff' }
                        : { borderColor: tokens.border, color: tokens.metaText }}
                    >
                      {page}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      <ProductImageLightbox
        images={PREVIEW_IMAGES}
        currentIndex={lightboxIndex ?? activeImageIndex}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(nextIndex) => setLightboxIndex(nextIndex)}
        useNativeImage
        frame={null}
      />
    </div>
  );
}
