import React from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { ProductImageFrameOverlay, useProductFrameConfig } from '@/components/shared/ProductImageFrameBox';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { CATEGORY_PRODUCTS_STYLES } from '../_lib/constants';
import { getCategoryProductsColors } from '../_lib/colors';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../_shared/lib/productPrice';
import { getProductImageAspectRatioCssValue, getProductImageAspectRatioLabel, resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import type {
  CategoryProductsBrandMode,
  CategoryProductsConfig,
  CategoryProductsProduct,
  CategoryProductsSection,
  CategoryProductsStyle,
} from '../_types';

interface CategoryProductsPreviewProps {
  config: CategoryProductsConfig;
  brandColor: string;
  secondary: string;
  mode: CategoryProductsBrandMode;
  selectedStyle: CategoryProductsStyle;
  onStyleChange: (style: CategoryProductsStyle) => void;
  categoriesData: { _id: string; name: string; slug?: string; image?: string }[];
  productsData: CategoryProductsProduct[];
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const CategoryProductsPreview = ({ 
  config, 
  brandColor: _brandColor, 
  secondary,
  mode,
  selectedStyle,
  onStyleChange, 
  categoriesData,
  productsData,
  fontStyle,
  fontClassName,
}: CategoryProductsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const previewStyle = selectedStyle || 'grid';
  const setPreviewStyle = (s: string) =>{  onStyleChange(s as CategoryProductsStyle); };
  const colors = React.useMemo(
    () => getCategoryProductsColors(_brandColor, secondary, mode),
    [_brandColor, secondary, mode]
  );
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' });
  const saleMode = React.useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);
  const imageAspectRatio = React.useMemo(
    () => resolveProductImageAspectRatio(aspectRatioSetting?.value),
    [aspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = React.useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(imageAspectRatio) }),
    [imageAspectRatio]
  );
  const imageAspectRatioLabel = React.useMemo(
    () => getProductImageAspectRatioLabel(imageAspectRatio),
    [imageAspectRatio]
  );

  // Resolve sections with category and products data
  const resolvedSections = config.sections
    .map((section) => {
      const category = categoriesData.find(c => c._id === section.categoryId);
      if (!category) {return null;}

      const products = productsData
        .filter(p => p.categoryId === section.categoryId)
        .slice(0, section.itemCount);

      return {
        ...section,
        category,
        products,
      };
    })
    .filter(Boolean) as (CategoryProductsSection & { 
      category: { _id: string; name: string; slug?: string; image?: string }; 
      products: CategoryProductsProduct[]; 
    })[];

  const getGridCols = () => {
    if (device === 'mobile') {
      return config.columnsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2';
    }
    if (device === 'tablet') {
      return 'grid-cols-3';
    }
    switch (config.columnsDesktop) {
      case 3: { return 'grid-cols-3';
      }
      case 5: { return 'grid-cols-5';
      }
      default: { return 'grid-cols-4';
      }
    }
  };

  const getPriceDisplay = (price?: number, salePrice?: number, isRangeFromVariant?: boolean) =>
    getHomeComponentPriceLabel({ saleMode, price, salePrice, isRangeFromVariant });

  // Get info for PreviewWrapper based on style with image size recommendations
  const getPreviewInfo = () => {
    const sectionCount = resolvedSections.length;
    const totalProducts = resolvedSections.reduce((sum, s) => sum + s.products.length, 0);

    if (sectionCount === 0) {return 'Chưa có section nào';}

    switch (previewStyle) {
      case 'grid': {
        return `${sectionCount} section • ${totalProducts} SP • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'carousel': {
        return `${sectionCount} section • ${totalProducts} SP • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'cards': {
        return `${sectionCount} section • ${totalProducts} SP • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'bento': {
        return `${sectionCount} section • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'magazine': {
        return `${sectionCount} section • Ảnh: ${imageAspectRatioLabel}`;
      }
      case 'showcase': {
        return `${sectionCount} section • Ảnh: ${imageAspectRatioLabel}`;
      }
      default: {
        return `${sectionCount} section • ${totalProducts} sản phẩm`;
      }
    }
  };

  // Empty State Component with brandColor
  const EmptyState = ({ message, size = 'normal' }: { message: string; size?: 'small' | 'normal' }) => (
    <div
      className={cn(
        'text-center rounded-xl flex flex-col items-center justify-center',
        size === 'small' ? 'py-6' : 'py-12'
      )}
      style={{ backgroundColor: colors.emptyStateBackground }}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center mb-3',
          size === 'small' ? 'w-12 h-12' : 'w-16 h-16'
        )}
        style={{ backgroundColor: colors.emptyStateIconBackground }}
      >
        <Package size={size === 'small' ? 24 : 32} style={{ color: colors.emptyStateIcon }} />
      </div>
      <p className="text-sm" style={{ color: colors.emptyStateText }}>{message}</p>
    </div>
  );

  const FramePreviewImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const { frame } = useProductFrameConfig();
    return (
      <>
        <PreviewImage src={src} alt={alt} className={className} />
        <ProductImageFrameOverlay frame={frame} />
      </>
    );
  };

  // Product Card Component with Equal Height (line-clamp + min-height)
  const ProductCard = ({ product }: { product: CategoryProductsProduct }) => (
    <div className="group cursor-pointer flex flex-col h-full">
      <div className="rounded-lg overflow-hidden mb-2" style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}>
        {product.image ? (
          <FramePreviewImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={24} style={{ color: colors.emptyStateIcon }} />
          </div>
        )}
      </div>
      <h4
        className={cn(
          'font-medium line-clamp-2',
          device === 'mobile' ? 'text-xs min-h-[2rem]' : 'text-sm min-h-[2.5rem]'
        )}
        style={{ color: colors.bodyText }}
      >
        {product.name || 'Tên sản phẩm'}
      </h4>
      <div className="flex flex-col mt-auto">
        {(() => {
          const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
          if (priceDisplay.comparePrice) {
            return (
              <>
                <span className={cn('font-bold', device === 'mobile' ? 'text-xs' : 'text-sm')} style={{ color: colors.priceText }}>
                  {priceDisplay.label}
                </span>
                <span className="text-[10px] text-slate-400 line-through">
                  {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                </span>
              </>
            );
          }
          return (
            <span className={cn('font-bold', device === 'mobile' ? 'text-xs' : 'text-sm')} style={{ color: colors.priceText }}>
              {priceDisplay.label}
            </span>
          );
        })()}
      </div>
    </div>
  );

  // Style 1: Grid - Classic grid layout per section
  const renderGridStyle = () => (
    <div className="w-full py-4 space-y-8 md:space-y-12">
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <section key={section.id} className="px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2
                  className={cn(
                    'font-bold',
                    device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl'
                  )}
                  style={{ color: colors.heading }}
                >
                  {section.category.name}
                </h2>
                {config.showViewAll && (
                  <button
                    className="text-sm font-medium flex items-center gap-1 underline px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: colors.buttonBorder, color: colors.buttonText }}
                  >
                    Xem danh mục <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {section.products.length === 0 ? (
                <EmptyState message="Chưa có sản phẩm trong danh mục này" size="small" />
              ) : (
                <div className={cn('grid gap-4', getGridCols())}>
                  {section.products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );

  // Style 2: Carousel - Horizontal scroll
  const renderCarouselStyle = () => (
    <div className="w-full py-4 space-y-8 md:space-y-12">
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <section key={section.id}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between px-4 mb-4">
                <h2
                  className={cn(
                    'font-bold',
                    device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl'
                  )}
                  style={{ color: colors.heading }}
                >
                  {section.category.name}
                </h2>
                {config.showViewAll && (
                  <button 
                    className="text-sm font-medium flex items-center gap-1 underline"
                    style={{ color: colors.buttonText }}
                  >
                    Xem danh mục <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {section.products.length === 0 ? (
                <div className="mx-4">
                  <EmptyState message="Chưa có sản phẩm" size="small" />
                </div>
              ) : (
                <div className="overflow-x-auto pb-4 px-4 scrollbar-hide">
                  <div className="flex gap-4">
                    {section.products.map((product) => (
                      <div 
                        key={product._id}
                        className={cn(
                          'flex-shrink-0 group cursor-pointer',
                          device === 'mobile' ? 'w-36' : 'w-48'
                        )}
                      >
                        <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2" style={imageAspectRatioStyle}>
                          {product.image ? (
                            <FramePreviewImage 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={24} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                        <h4 className={cn(
                          'font-medium line-clamp-2 mb-1',
                          device === 'mobile' ? 'text-xs' : 'text-sm'
                        )}>{product.name}</h4>
                        <span className={cn('font-bold', device === 'mobile' ? 'text-sm' : 'text-base')} style={{ color: colors.buttonText }}>
                          {getPriceDisplay(product.price, product.salePrice, product.hasVariants).label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );

  // Style 3: Cards - Modern cards with category header
  const renderCardsStyle = () => (
    <div className="w-full py-4 space-y-8 md:space-y-12">
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <section key={section.id} className="px-4">
            <div className="max-w-7xl mx-auto">
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${colors.cardBorder}` }}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: colors.neutralBackground }}
                >
                  <div className="flex items-center gap-3">
                    {section.category.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white">
                        <PreviewImage 
                          src={section.category.image} 
                          alt={section.category.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <h2
                      className={cn(
                        'font-bold',
                        device === 'mobile' ? 'text-base' : 'text-lg'
                      )}
                      style={{ color: colors.heading }}
                    >
                      {section.category.name}
                    </h2>
                  </div>
                  {config.showViewAll && (
                    <button
                      className="text-sm font-medium flex items-center gap-1 underline px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                    >
                      Xem danh mục <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-900">
                  {section.products.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Package size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Chưa có sản phẩm</p>
                    </div>
                  ) : (
                    <div className={cn('grid gap-4', getGridCols())}>
                      {section.products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );

  // Style 4: Bento - Featured product với grid layout sáng tạo
  const renderBentoStyle = () => (
    <div className="w-full py-4 space-y-10 md:space-y-16">
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => {
          const featured = section.products[0];
          const others = section.products.slice(1, 5);

          return (
            <section key={section.id} className="px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: colors.sectionAccent }}
                    />
                    <h2
                      className={cn(
                        'font-bold',
                        device === 'mobile' ? 'text-lg' : 'text-xl md:text-2xl'
                      )}
                      style={{ color: colors.heading }}
                    >
                      {section.category.name}
                    </h2>
                  </div>
                  {config.showViewAll && (
                    <button
                    className="text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-full"
                    style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                  >
                      Xem danh mục <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {section.products.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Chưa có sản phẩm</p>
                  </div>
                ) : (device === 'mobile' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {section.products.slice(0, 4).map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 auto-rows-[180px]">
                    {featured && (
                      <div className="col-span-2 row-span-2 group cursor-pointer relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {featured.image ? (
                          <FramePreviewImage 
                            src={featured.image} 
                            alt={featured.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={48} className="text-slate-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                            style={{ backgroundColor: colors.featuredBadgeBackground, color: colors.featuredBadgeText }}
                          >
                            Nổi bật
                          </span>
                          <h3 className="font-bold text-base line-clamp-2 mb-1">{featured.name}</h3>
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                            {(() => {
                              const priceDisplay = getPriceDisplay(featured?.price, featured?.salePrice, featured?.hasVariants);
                              if (priceDisplay.comparePrice) {
                                return (
                                  <>
                                    <span className="font-bold text-base">{priceDisplay.label}</span>
                                    <span className="text-xs text-white/60 line-through">
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  </>
                                );
                              }
                              return <span className="font-bold text-base">{priceDisplay.label}</span>;
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {others.map((product) => (
                      <div key={product._id} className="group cursor-pointer relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {product.image ? (
                          <FramePreviewImage 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-slate-300" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-3 text-white bg-black/55">
                          <h4 className="font-medium text-xs line-clamp-1">{product.name}</h4>
                          <span className="font-bold text-xs">{getPriceDisplay(product.price, product.salePrice, product.hasVariants).label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );

  // Style 5: Magazine - Editorial Grid với Featured Item + Grid nhỏ
  const renderMagazineStyle = () => (
    <div className="w-full py-4 space-y-12 md:space-y-16">
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => {
          const featured = section.products[0];
          const gridItems = section.products.slice(1, 5);

          return (
            <section key={section.id} className="px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-6 pb-4 border-b-2" style={{ borderColor: colors.neutralBorder }}>
                  <div>
                    <span 
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: colors.buttonText }}
                    >
                      Bộ sưu tập
                    </span>
                    <h2
                      className={cn(
                        'font-bold tracking-tight mt-1',
                        device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl'
                      )}
                      style={{ color: colors.heading }}
                    >
                      {section.category.name}
                    </h2>
                  </div>
                  {config.showViewAll && (
                    <button 
                      className={cn(
                        'font-semibold flex items-center gap-2',
                        device === 'mobile' ? 'text-sm' : 'text-base'
                      )}
                      style={{ color: colors.buttonText }}
                    >
                      Xem tất cả <ArrowRight size={device === 'mobile' ? 16 : 18} />
                    </button>
                  )}
                </div>

                {section.products.length === 0 ? (
                  <EmptyState message="Chưa có sản phẩm" size="small" />
                ) : (device === 'mobile' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {section.products.slice(0, 4).map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {featured && (
                      <div className="group cursor-pointer relative rounded-2xl overflow-hidden" style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}>
                        {featured.image ? (
                          <FramePreviewImage 
                            src={featured.image} 
                            alt={featured.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={48} style={{ color: colors.emptyStateIcon }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <span
                            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
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
                                    <span className="text-sm text-white/60 line-through">
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  </>
                                );
                              }
                              return <span className="font-bold text-2xl">{priceDisplay.label}</span>;
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {gridItems.map((product) => (
                        <div key={product._id} className="group cursor-pointer">
                          <div 
                            className="rounded-xl overflow-hidden mb-3 relative"
                            style={{ ...imageAspectRatioStyle, backgroundColor: colors.imageBackground }}
                          >
                            {product.image ? (
                              <FramePreviewImage 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} style={{ color: colors.emptyStateIcon }} />
                              </div>
                            )}
                            <div
                              className="absolute inset-x-2 bottom-2 flex items-center justify-center"
                            >
                              <span
                                className="px-4 py-2 rounded-full text-sm font-medium"
                                style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                              >
                                Xem nhanh
                              </span>
                            </div>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            {(() => {
                              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                              if (priceDisplay.comparePrice) {
                                return (
                                  <>
                                    <span className={cn('font-bold', 'text-sm')}>
                                      {priceDisplay.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  </>
                                );
                              }
                              return (
                                <span className={cn('font-bold', 'text-sm')}>
                                  {priceDisplay.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      ))}

                      {gridItems.length < 4 && Array.from({ length: 4 - gridItems.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="rounded-xl flex items-center justify-center"
                          style={{ ...imageAspectRatioStyle, backgroundColor: colors.emptyStateBackground, border: `2px dashed ${colors.neutralBorder}` }}
                        >
                          <Package size={24} style={{ color: colors.emptyStateIcon }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );

  // Style 6: Showcase - always-visible mobile-first cards
  const renderShowcaseStyle = () => (
    <div className="w-full py-4 space-y-10 md:space-y-16">
      {resolvedSections.length === 0 ? (
        <div className="px-4">
          <EmptyState message="Chưa chọn danh mục nào" />
        </div>
      ) : (
        resolvedSections.map((section) => (
          <section key={section.id}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: colors.buttonText }}
                  >
                    Bộ sưu tập
                  </span>
                  <h2
                    className={cn(
                      'font-bold mt-1',
                      device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
                    )}
                    style={{ color: colors.heading }}
                  >
                    {section.category.name}
                  </h2>
                  <div
                    className="h-1 w-16 rounded-full mt-2"
                    style={{ backgroundColor: colors.sectionAccent }}
                  />
                </div>
                {config.showViewAll && (
                  <button
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: colors.buttonText }}
                  >
                    Xem tất cả
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}` }}
                    >
                      <ArrowRight size={14} />
                    </span>
                  </button>
                )}
              </div>

              {section.products.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có sản phẩm</p>
                </div>
              ) : (
                <div className={cn(
                  'grid gap-4',
                  device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'
                )}>
                  {section.products.map((product) => (
                    <div key={product._id} className="cursor-pointer">
                      <div
                        className="relative rounded-2xl overflow-hidden border"
                        style={{ ...imageAspectRatioStyle, borderColor: colors.cardBorder, backgroundColor: colors.imageBackground }}
                      >
                        {product.image ? (
                          <FramePreviewImage
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={32} style={{ color: colors.emptyStateIcon }} />
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <h4 className={cn('font-medium line-clamp-2', device === 'mobile' ? 'text-xs' : 'text-sm')}>
                            {product.name}
                          </h4>
                          <div className="flex flex-col mt-1">
                            {(() => {
                              const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                              if (priceDisplay.comparePrice) {
                                return (
                                  <>
                                    <span className={cn('font-bold', device === 'mobile' ? 'text-xs' : 'text-sm')}>
                                      {priceDisplay.label}
                                    </span>
                                    <span className="text-[10px] text-white/70 line-through">
                                      {getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                                    </span>
                                  </>
                                );
                              }
                              return (
                                <span className={cn('font-bold', device === 'mobile' ? 'text-xs' : 'text-sm')}>
                                  {priceDisplay.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        <span
                          className="absolute top-3 right-3 px-2 py-1 rounded-md text-[11px] font-medium"
                          style={{ backgroundColor: colors.buttonBackground, border: `1px solid ${colors.buttonBorder}`, color: colors.buttonText }}
                        >
                          Chi tiết
                        </span>

                        {(() => {
                          const priceDisplay = getPriceDisplay(product.price, product.salePrice, product.hasVariants);
                          if (!priceDisplay.comparePrice) {return null;}
                          return (
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500">
                              -{Math.round((1 - (product.price ?? 0) / priceDisplay.comparePrice) * 100)}%
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );

  return (
    <>
      <PreviewWrapper 
        title="Preview Sản phẩm theo danh mục" 
        device={device} 
        setDevice={setDevice} 
        previewStyle={previewStyle} 
        setPreviewStyle={setPreviewStyle} 
        styles={CATEGORY_PRODUCTS_STYLES} 
        info={getPreviewInfo()}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {previewStyle === 'grid' && renderGridStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'cards' && renderCardsStyle()}
          {previewStyle === 'bento' && renderBentoStyle()}
          {previewStyle === 'magazine' && renderMagazineStyle()}
          {previewStyle === 'showcase' && renderShowcaseStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={_brandColor} secondary={colors.secondary} />
    </>
  );
};
