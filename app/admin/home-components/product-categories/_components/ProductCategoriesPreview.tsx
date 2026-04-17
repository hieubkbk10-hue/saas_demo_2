'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronRight, Image as ImageIcon, Package, Plus } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getCategoryIcon } from '@/app/admin/components/CategoryImageSelector';
import { PRODUCT_CATEGORIES_STYLES } from '../_lib/constants';
import { getProductCategoriesColors } from '../_lib/colors';
import type {
  CategoryData,
  ProductCategoriesBrandMode,
  ProductCategoriesConfig,
  ProductCategoriesStyle,
} from '../_types';

export const ProductCategoriesPreview = ({ 
  config, 
  brandColor, 
  secondary,
  mode,
  selectedStyle, 
  onStyleChange,
  categoriesData,
  fontStyle,
  fontClassName,
}: { 
  config: ProductCategoriesConfig;
  brandColor: string;
  secondary: string;
  mode: ProductCategoriesBrandMode;
  selectedStyle?: ProductCategoriesStyle;
  onStyleChange?: (style: ProductCategoriesStyle) => void;
  categoriesData: CategoryData[];
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const previewStyle = (selectedStyle ?? config.style) || 'grid';
  const setPreviewStyle = (s: string) => onStyleChange?.(s as ProductCategoriesStyle);
  const colors = React.useMemo(() => getProductCategoriesColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const [isCircularDown, setIsCircularDown] = useState(false);
  const [isCircularDragging, setIsCircularDragging] = useState(false);
  const [circularStartX, setCircularStartX] = useState(0);
  const [circularScrollLeft, setCircularScrollLeft] = useState(0);
  const [circularScrollPosition, setCircularScrollPosition] = useState(0);
  const [circularPageCount, setCircularPageCount] = useState(1);
  const circularScrollRef = React.useRef<HTMLDivElement>(null);
  
  const productsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const categoryMap = React.useMemo(() => {
    const map: Record<string, CategoryData> = {};
    for (const cat of categoriesData) {
      map[cat._id] = cat;
    }
    return map;
  }, [categoriesData]);
  const productImageMap = React.useMemo(() => {
    const map: Record<string, { image?: string }> = {};
    if (productsData) {
      for (const product of productsData) {
        map[product._id] = { image: product.image };
      }
    }
    return map;
  }, [productsData]);

  const categoriesConfig = config.categories ?? [];
  const uniqueCategories = React.useMemo(() => (
    categoriesConfig.filter((item, index, arr) => {
      if (!item.categoryId) {return true;}
      return arr.findIndex(i => i.categoryId === item.categoryId) === index;
    })
  ), [categoriesConfig]);
  const duplicateCount = categoriesConfig.length - uniqueCategories.length;

  const resolvedCategories = uniqueCategories
    .map((item, idx) => {
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
        displayImage = productImageMap[productId]?.image ?? cat.image;
      } else if (imageMode === 'upload' || imageMode === 'url') {
        displayImage = item.customImage ?? cat.image;
      }
      
      return {
        ...cat,
        itemId: item.id || idx,
        displayImage,
        displayIcon,
        imageMode,
      };
    })
    .filter(Boolean) as (CategoryData & { itemId: number; displayImage?: string; displayIcon?: string; imageMode: string })[];

  const getColumnsByDevice = () => {
    if (isMobile) {return config.columnsMobile || 2;}
    if (isTablet) {
      const desktopCols = config.columnsDesktop || 4;
      return Math.min(Math.max(desktopCols, 3), 4);
    }
    return config.columnsDesktop || 4;
  };

  const getGridCols = () => {
    const columns = getColumnsByDevice();
    switch (columns) {
      case 2: { return 'grid-cols-2';
      }
      case 3: { return 'grid-cols-3';
      }
      case 5: { return 'grid-cols-5';
      }
      case 6: { return 'grid-cols-6';
      }
      default: { return 'grid-cols-4';
      }
    }
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
  const maxVisible = getVisibleCount();
  const visibleCategories = resolvedCategories.slice(0, maxVisible);
  const remainingCount = Math.max(resolvedCategories.length - maxVisible, 0);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: colors.emptyState.iconBg }}
      >
        <Package size={32} style={{ color: colors.emptyState.icon }} />
      </div>
      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có danh mục nào</h3>
      <p className="text-sm" style={{ color: colors.emptyState.text }}>Thêm danh mục để bắt đầu hiển thị</p>
    </div>
  );

  const renderCategoryVisual = (cat: typeof resolvedCategories[0], size: 'sm' | 'md' | 'lg' = 'md') => {
    const iconData = cat.displayIcon ? getCategoryIcon(cat.displayIcon) : null;
    const iconSizes = { lg: isMobile ? 40 : 56, md: isMobile ? 32 : 40, sm: isMobile ? 24 : 28 };
    const iconSize = iconSizes[size];
    
    if (cat.displayIcon && iconData) {
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.iconContainerBg }}>
          {React.createElement(iconData.icon, { size: iconSize, style: { color: colors.primary.solid } })}
        </div>
      );
    }
    if (cat.displayImage) {
      return <PreviewImage src={cat.displayImage} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
        <Package size={iconSize} className="text-slate-300" />
      </div>
    );
  };

  const renderGridStyle = () => {
    const gridItems = resolvedCategories.length <= 2 
      ? resolvedCategories 
      : visibleCategories;
    const containerClass = resolvedCategories.length === 1 
      ? 'max-w-xs mx-auto' 
      : (resolvedCategories.length === 2 
        ? 'max-w-lg mx-auto grid grid-cols-2 gap-4'
        : cn("grid gap-4", getGridCols()));

    return (
      <section className={cn("w-full", isMobile ? 'py-6 px-3' : 'py-10 px-6')}>
        <div className="max-w-7xl mx-auto">
          <h2
            className={cn("font-bold mb-2 text-center", isMobile ? 'text-lg' : 'text-xl md:text-2xl')}
            style={{ color: colors.primary.solid }}
          >
            Danh mục sản phẩm
          </h2>
          <div
            className={cn("mx-auto h-1 w-12 rounded-full", isMobile ? 'mb-4' : 'mb-6')}
            style={{ backgroundColor: colors.sectionAccent }}
          />
          
          {resolvedCategories.length === 0 ? renderEmptyState() : (
            <div className={containerClass}>
              {gridItems.map((cat) => (
                <div 
                  key={cat.itemId} 
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                  style={{ 
                    boxShadow: colors.cardShadow,
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = colors.cardShadowHover;
                    e.currentTarget.style.borderColor = colors.cardBorderHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = colors.cardShadow;
                    e.currentTarget.style.borderColor = colors.cardBorder;
                  }}
                >
                  {renderCategoryVisual(cat, 'lg')}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
                    style={{ height: '60%' }}
                  />
                  <div className={cn("absolute bottom-0 left-0 right-0 z-10", isMobile ? 'p-3' : 'p-4')}>
                    <h3 className={cn("font-semibold line-clamp-1", isMobile ? 'text-sm' : 'text-base')} style={{ color: colors.overlayText }}>{cat.name}</h3>
                    {config.showProductCount && (
                      <p className="text-xs mt-0.5" style={{ color: colors.productCountText }}>12 sản phẩm</p>
                    )}
                  </div>
                </div>
              ))}
              
              {remainingCount > 0 && resolvedCategories.length > 2 && (
                <div 
                  className="flex flex-col items-center justify-center aspect-square rounded-xl cursor-pointer transition-all"
                  style={{ backgroundColor: colors.ctaMoreBg, border: `2px dashed ${colors.ctaMoreBorder}` }}
                >
                  <Plus size={isMobile ? 24 : 32} style={{ color: colors.ctaMoreText }} className="mb-2" />
                  <span className={cn("font-bold", isMobile ? 'text-base' : 'text-lg')} style={{ color: colors.ctaMoreText }}>
                    +{remainingCount}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">danh mục khác</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderCarouselStyle = () => (
    <section className={cn("w-full", isMobile ? 'py-6' : 'py-10')}>
      <div className="max-w-7xl mx-auto">
        <div className={cn("flex items-center justify-between mb-6", isMobile ? 'px-3' : 'px-6')}>
          <h2
            className={cn("font-bold", isMobile ? 'text-lg' : 'text-xl md:text-2xl')}
            style={{ color: colors.primary.solid }}
          >
            Danh mục sản phẩm
          </h2>
          <button 
            className="text-sm font-medium flex items-center gap-1 hover:underline whitespace-nowrap"
            style={{ color: colors.linkText }}
          >
            Xem tất cả <ChevronRight size={16} />
          </button>
        </div>
        
        {resolvedCategories.length === 0 ? (
          <div className={cn(isMobile ? 'px-3' : 'px-6')}>{renderEmptyState()}</div>
        ) : (
          <div className={cn("overflow-x-auto pb-4 scrollbar-hide", isMobile ? 'px-3' : 'px-6')}>
            <div
              className={cn("flex", isMobile ? 'gap-3' : 'gap-4')}
              style={{ '--carousel-gap': isMobile ? '12px' : '16px' } as React.CSSProperties}
            >
              {resolvedCategories.map((cat) => (
                <div 
                  key={cat.itemId} 
                  className="flex-shrink-0 group cursor-pointer"
                  style={getCarouselItemStyle()}
                >
                  <div 
                    className="aspect-square rounded-xl overflow-hidden mb-2 transition-all"
                    style={{ border: `2px solid ${colors.cardBorder}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.cardBorderHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.cardBorder; }}
                  >
                    {renderCategoryVisual(cat, 'md')}
                  </div>
                  <h3 className={cn("font-medium text-center line-clamp-1", isMobile ? 'text-xs' : 'text-sm')} style={{ color: colors.categoryNameText }}>
                    {cat.name}
                  </h3>
                  {config.showProductCount && (
                    <p className="text-xs text-center" style={{ color: colors.productCountText }}>12 sản phẩm</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderCardsStyle = () => {
    const displayItems = visibleCategories;
    
    return (
      <section className={cn("w-full", isMobile ? 'py-6 px-3' : 'py-10 px-6')} style={{ backgroundColor: colors.sectionBg }}>
        <div className="max-w-7xl mx-auto">
          <h2
            className={cn("font-bold mb-2 text-center", isMobile ? 'text-lg' : 'text-xl md:text-2xl')}
            style={{ color: colors.primary.solid }}
          >
            Khám phá theo danh mục
          </h2>
          <div
            className={cn("mx-auto h-1 w-12 rounded-full", isMobile ? 'mb-4' : 'mb-6')}
            style={{ backgroundColor: colors.sectionAccent }}
          />
          
          {resolvedCategories.length === 0 ? renderEmptyState() : (
            <div className={cn("grid", getGridCols(), isMobile ? 'gap-3' : 'gap-4')}>
              {displayItems.map((cat) => (
                <div 
                  key={cat.itemId} 
                  className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden flex cursor-pointer transition-all"
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
                  <div className={cn("flex-shrink-0", isMobile ? 'w-20 h-20' : 'w-28 h-28')}>
                    {renderCategoryVisual(cat, 'sm')}
                  </div>
                  <div className={cn("flex-1 flex flex-col justify-center", isMobile ? 'p-3' : 'p-4')}>
                    <h3 className={cn("font-semibold line-clamp-1 mb-1", isMobile ? 'text-sm' : 'text-base')} style={{ color: colors.categoryNameText }}>{cat.name}</h3>
                    {cat.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2 min-h-[2rem]">{cat.description}</p>
                    )}
                    <span className="text-xs font-medium flex items-center gap-1" style={{ color: colors.linkText }}>
                      Xem sản phẩm <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderMinimalStyle = () => (
    <section className={cn("w-full", isMobile ? 'py-6 px-3' : 'py-10 px-6')}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2
            className={cn("font-bold", isMobile ? 'text-lg' : 'text-xl')}
            style={{ color: colors.primary.solid }}
          >
            Danh mục
          </h2>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.linkText }}>
            Tất cả →
          </button>
        </div>
        
        {resolvedCategories.length === 0 ? renderEmptyState() : (
          <div className={cn("grid", getGridCols(), isMobile ? 'gap-2' : 'gap-3')}>
            {visibleCategories.map((cat) => {
              const iconData = cat.displayIcon ? getCategoryIcon(cat.displayIcon) : null;
              return (
                <div 
                  key={cat.itemId} 
                  className={cn(
                    "flex items-center gap-2 rounded-full cursor-pointer transition-all min-w-0",
                    isMobile ? 'px-3 py-2' : 'px-4 py-2.5'
                  )}
                  style={{ 
                    backgroundColor: colors.pillBg,
                    border: `1px solid ${colors.pillBorder}`
                  }}
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
                    React.createElement(iconData.icon, { size: isMobile ? 14 : 16, style: { color: colors.primary.solid } })
                  ) : (cat.displayImage ? (
                    <PreviewImage src={cat.displayImage} alt="" className={cn("rounded-full object-cover", isMobile ? 'w-5 h-5' : 'w-6 h-6')} />
                  ) : (
                    <Package size={isMobile ? 14 : 16} style={{ color: colors.primary.solid }} />
                  ))}
                  <span
                    className={cn("font-medium truncate min-w-0 flex-1", isMobile ? 'text-xs' : 'text-sm')}
                    style={{ color: colors.categoryNameText }}
                    title={cat.name}
                  >
                    {cat.name}
                  </span>
                  {config.showProductCount && (
                    <span className="text-xs" style={{ color: colors.productCountText }}>(12)</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );

  const renderMarqueeStyle = () => (
    <section className={cn("w-full overflow-hidden", isMobile ? 'py-6' : 'py-10')}>
      <div className="max-w-7xl mx-auto">
        <h2
          className={cn("font-bold mb-2 text-center", isMobile ? 'text-lg px-3' : 'text-xl md:text-2xl')}
          style={{ color: colors.primary.solid }}
        >
          Khám phá danh mục
        </h2>
        <div
          className={cn("mx-auto h-1 w-12 rounded-full", isMobile ? 'mb-4' : 'mb-6')}
          style={{ backgroundColor: colors.sectionAccent }}
        />
        
        {resolvedCategories.length === 0 ? (
          <div className={cn(isMobile ? 'px-3' : 'px-6')}>{renderEmptyState()}</div>
        ) : (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none" />
            
            <div className="flex animate-marquee">
              {[...visibleCategories, ...visibleCategories].map((cat, idx) => (
                <div 
                  key={`${cat._id}-${idx}`} 
                  className={cn(
                    "flex-shrink-0 flex items-center gap-3 rounded-full cursor-pointer mx-2 transition-all",
                    isMobile ? 'px-3 py-2' : 'px-4 py-3'
                  )}
                  style={{ 
                    backgroundColor: colors.neutral.surface,
                    border: `2px solid ${colors.pillBorder}`,
                    boxShadow: colors.cardShadow
                  }}
                >
                  <div className={cn("rounded-full overflow-hidden flex-shrink-0", isMobile ? 'w-8 h-8' : 'w-10 h-10')}>
                    {renderCategoryVisual(cat, 'sm')}
                  </div>
                  <div className="min-w-0">
                    <h3 className={cn("font-semibold whitespace-nowrap", isMobile ? 'text-xs' : 'text-sm')} style={{ color: colors.categoryNameText }}>
                      {cat.name}
                    </h3>
                    {config.showProductCount && (
                      <p className="text-xs whitespace-nowrap" style={{ color: colors.productCountText }}>12 sản phẩm</p>
                    )}
                  </div>
                  <ArrowUpRight size={14} style={{ color: colors.arrowIcon }} className="flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );

  const handleCircularMouseDown = (e: React.MouseEvent) => {
    if (!circularScrollRef.current) {return;}
    setIsCircularDown(true);
    setIsCircularDragging(false);
    setCircularStartX(e.pageX - circularScrollRef.current.offsetLeft);
    setCircularScrollLeft(circularScrollRef.current.scrollLeft);
  };

  const handleCircularMouseMove = (e: React.MouseEvent) => {
    if (!isCircularDown || !circularScrollRef.current) {return;}
    e.preventDefault();
    const x = e.pageX - circularScrollRef.current.offsetLeft;
    const walk = (x - circularStartX) * 2;
    circularScrollRef.current.scrollLeft = circularScrollLeft - walk;

    if (Math.abs(x - circularStartX) > 5) {
      setIsCircularDragging(true);
    }
  };

  const handleCircularMouseUp = () => {
    setIsCircularDown(false);
    setTimeout(() => {
      setIsCircularDragging(false);
    }, 50);
  };

  const handleCircularMouseLeave = () => {
    setIsCircularDown(false);
    setIsCircularDragging(false);
  };

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
    if (previewStyle !== 'circular') {return;}

    const frameId = window.requestAnimationFrame(updateCircularPagination);
    window.addEventListener('resize', updateCircularPagination);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateCircularPagination);
    };
  }, [previewStyle, resolvedCategories.length, device, updateCircularPagination]);

  const renderCircularStyle = () => (
    <section className={cn("w-full", isMobile ? 'py-6' : 'py-10')}>
      <div className="max-w-7xl mx-auto">
        <h2
          className={cn("font-bold mb-2 text-center px-3", isMobile ? 'text-lg' : 'text-xl md:text-2xl')}
          style={{ color: colors.primary.solid }}
        >
          Danh mục sản phẩm
        </h2>
        <div
          className={cn("mx-auto h-1 w-12 rounded-full", isMobile ? 'mb-4' : 'mb-6')}
          style={{ backgroundColor: colors.sectionAccent }}
        />

        {resolvedCategories.length === 0 ? (
          <div className={cn(isMobile ? 'px-3' : 'px-6')}>{renderEmptyState()}</div>
        ) : (
          <>
            <div
              ref={circularScrollRef}
              className={cn(
                "flex overflow-x-auto scrollbar-hide pb-4 gap-5 snap-x snap-mandatory select-none",
                isMobile ? 'px-3' : 'px-6 md:px-11',
                isCircularDown ? 'cursor-grabbing' : 'cursor-grab'
              )}
              onMouseDown={handleCircularMouseDown}
              onMouseLeave={handleCircularMouseLeave}
              onMouseUp={handleCircularMouseUp}
              onMouseMove={handleCircularMouseMove}
              onScroll={handleCircularScroll}
              style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch', '--circular-gap': '20px' } as React.CSSProperties}
            >
              {resolvedCategories.map((cat) => (
                <div
                  key={cat.itemId}
                  className="flex-shrink-0 snap-start group"
                  style={getCircularItemStyle()}
                  onClick={(e) => { if (isCircularDragging) {e.preventDefault();} }}
                >
                  <div
                    className="rounded-full overflow-hidden transition-all duration-300"
                    style={{
                      border: `1px solid ${colors.circularBorder}`,
                      padding: isMobile ? '15px' : '20px',
                      backgroundColor: colors.circularBg
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = colors.cardShadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="relative pb-[100%]">
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        {renderCategoryVisual(cat, 'md')}
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-3">
                    <h3 className={cn("font-semibold line-clamp-2 mb-1 leading-tight", isMobile ? 'text-sm min-h-[2rem]' : 'text-base min-h-[2.8rem]')} style={{ color: colors.categoryNameText }}>
                      {cat.name}
                    </h3>

                    <div className="relative h-[27px] overflow-hidden w-full">
                      <span className={cn("block w-full absolute top-0 left-0 transition-transform duration-300 group-hover:translate-y-full group-hover:opacity-0", isMobile ? 'text-xs' : 'text-sm')} style={{ color: colors.productCountText }}>
                        {config.showProductCount ? '12 sản phẩm' : '\u00A0'}
                      </span>
                      <span
                        className={cn("block w-full underline absolute top-0 left-0 transition-transform duration-300 -translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100", isMobile ? 'text-xs' : 'text-sm')}
                        style={{ color: colors.linkText }}
                      >
                        Xem chi tiết
                      </span>
                    </div>
                  </div>
                </div>
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
          </>
        )}
      </div>
    </section>
  );

  const getPreviewInfo = () => {
    const count = resolvedCategories.length;
    const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
    if (count === 0) {return `Chưa có danh mục • ${modeLabel}`;}
    
    const sizeRecommendations: Record<string, string> = {
      cards: `${count} danh mục • Ảnh: 200×200px (1:1) • ${modeLabel}`,
      carousel: `${count} danh mục • Ảnh: 300×300px (1:1) • ${modeLabel}`,
      grid: `${count} danh mục • Ảnh: 400×400px (1:1) • ${modeLabel}`,
      marquee: `${count} danh mục • Ảnh: 80×80px (1:1) • ${modeLabel}`,
      minimal: `${count} danh mục • Icon/Ảnh: 48×48px • ${modeLabel}`,
      circular: `${count} danh mục • Ảnh: 500×500px (1:1, tròn) • ${modeLabel}`
    };
    return sizeRecommendations[previewStyle] || `${count} danh mục • ${modeLabel}`;
  };

  return (
    <>
      {duplicateCount > 0 && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Có {duplicateCount} danh mục bị trùng lặp. Preview đã ẩn bớt để khớp trang chủ.
        </div>
      )}
      <PreviewWrapper 
        title="Preview Danh mục sản phẩm" 
        device={device} 
        setDevice={setDevice} 
        previewStyle={previewStyle} 
        setPreviewStyle={setPreviewStyle} 
        styles={PRODUCT_CATEGORIES_STYLES} 
        info={getPreviewInfo()}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {previewStyle === 'grid' && renderGridStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'cards' && renderCardsStyle()}
          {previewStyle === 'minimal' && renderMinimalStyle()}
          {previewStyle === 'marquee' && renderMarqueeStyle()}
          {previewStyle === 'circular' && renderCircularStyle()}
        </BrowserFrame>
      </PreviewWrapper>

      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
      
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {previewStyle === 'grid' && (
              <p><strong>400×400px</strong> (1:1) • Ảnh vuông cho grid đều, overlay gradient tự động</p>
            )}
            {previewStyle === 'carousel' && (
              <p><strong>300×300px</strong> (1:1) • Ảnh vuông nhỏ gọn cho carousel horizontal</p>
            )}
            {previewStyle === 'cards' && (
              <p><strong>200×200px</strong> (1:1) • Thumbnail nhỏ bên trái card</p>
            )}
            {previewStyle === 'minimal' && (
              <p><strong>48×48px</strong> hoặc icon • Style text-based, ảnh chỉ làm accent</p>
            )}
            {previewStyle === 'marquee' && (
              <p><strong>80×80px</strong> (1:1) • Avatar nhỏ trong pill, auto-scroll animation</p>
            )}
            {previewStyle === 'circular' && (
              <p><strong>500×500px</strong> (1:1) • Ảnh vuông, tự động crop tròn</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
