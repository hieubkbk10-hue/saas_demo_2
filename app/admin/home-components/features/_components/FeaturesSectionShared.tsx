'use client';

import React from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Cpu, Globe, Layers, Plus, Rocket, Settings, Shield, Star, Target, Zap } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import type { FeatureItem, FeaturesBrandMode, FeaturesStyle } from '../_types';
import { getFeaturesColorTokens } from '../_lib/colors';

const featureIcons: Record<string, React.ElementType> = {
  Check,
  Cpu,
  Globe,
  Layers,
  Rocket,
  Settings,
  Shield,
  Star,
  Target,
  Zap,
};

const resolveDevice = (device?: 'mobile' | 'tablet' | 'desktop') => device ?? 'desktop';

const normalizeItems = (items: FeatureItem[]): FeatureItem[] => {
  if (!Array.isArray(items)) {return [];}
  return items
    .map((item, index) => {
      const source = item as Partial<FeatureItem> | null;
      if (!source || typeof source !== 'object') {return null;}
      return {
        id: typeof source.id === 'number' ? source.id : index + 1,
        icon: typeof source.icon === 'string' && source.icon.trim().length > 0 ? source.icon : 'Zap',
        title: typeof source.title === 'string' ? source.title : '',
        description: typeof source.description === 'string' ? source.description : '',
      };
    })
    .filter((item): item is FeatureItem => item !== null);
};

const getItemKey = (item: FeatureItem, idx: number) => {
  const normalizedTitle = item.title.trim().toLowerCase();
  const normalizedDescription = item.description.trim().toLowerCase();
  const normalizedIcon = (item.icon ?? '').toLowerCase();
  return item.id || `${normalizedIcon}-${normalizedTitle}-${normalizedDescription}-${idx}`;
};

interface FeaturesSectionSharedProps {
  items: FeatureItem[];
  style: FeaturesStyle;
  title?: string;
  brandColor: string;
  secondary: string;
  mode: FeaturesBrandMode;
  context: 'preview' | 'site';
  device?: 'mobile' | 'tablet' | 'desktop';
  className?: string;
}

export function FeaturesSectionShared({
  items,
  style,
  title,
  brandColor,
  secondary,
  mode,
  context,
  device,
  className,
}: FeaturesSectionSharedProps) {
  const normalizedItems = React.useMemo(() => normalizeItems(items), [items]);
  const previewDevice = resolveDevice(device);

  const colors = React.useMemo(() => getFeaturesColorTokens({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  const sectionTitle = title?.trim() || 'Tính năng nổi bật';

  const getIcon = React.useCallback((iconName?: string) => featureIcons[iconName ?? 'Zap'] || Zap, []);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: colors.badgeBackground, color: colors.badgeText }}
      >
        <Zap size={28} />
      </div>
      <h3 className="font-semibold mb-1" style={{ color: colors.body }}>Chưa có tính năng nào</h3>
      <p className="text-sm" style={{ color: colors.muted }}>Thêm tính năng đầu tiên để bắt đầu</p>
    </div>
  );

  const isPreview = context === 'preview';
  const isMobile = previewDevice === 'mobile';
  const isTablet = previewDevice === 'tablet';

  const renderBadge = () => (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{ backgroundColor: colors.badgeBackground, color: colors.badgeText }}
    >
      <Zap size={12} />
      Tính năng
    </div>
  );

  const renderIconGridStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxVisible = isPreview ? (isMobile ? 4 : 6) : 6;
    const visibleItems = normalizedItems.slice(0, maxVisible);
    const remainingCount = normalizedItems.length - maxVisible;

    const gridClass = cn(
      'grid gap-4 md:gap-6',
      visibleItems.length === 1 ? 'max-w-md mx-auto' : '',
      visibleItems.length === 2 ? 'max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2' : '',
      visibleItems.length >= 3
        ? (isPreview
          ? (isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3')
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
        : '',
    );

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        <div className="text-center mb-8 md:mb-12">
          {renderBadge()}
          <h2
            className={cn(
              'font-bold tracking-tight mt-3 mb-3',
              isPreview && isMobile ? 'text-2xl' : 'text-3xl md:text-4xl',
            )}
            style={{ color: colors.heading }}
          >
            {sectionTitle}
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: colors.muted }}>
            Khám phá những tính năng ưu việt giúp bạn đạt hiệu quả tối đa
          </p>
        </div>

        <div className={gridClass}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className="bg-white rounded-2xl p-6 border transition-colors flex flex-col h-full"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                >
                  <IconComponent size={24} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-lg mb-2 line-clamp-1" style={{ color: colors.body }}>
                  {item.title || 'Tên tính năng'}
                </h3>
                <p className="text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]" style={{ color: colors.muted }}>
                  {item.description || 'Mô tả tính năng...'}
                </p>
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div
              className="flex items-center justify-center rounded-2xl aspect-square border-2 border-dashed"
              style={{ borderColor: colors.neutralBorder, backgroundColor: colors.badgeBackground }}
            >
              <div className="text-center" style={{ color: colors.muted }}>
                <Plus size={30} className="mx-auto mb-2" />
                <span className="text-lg font-bold">+{remainingCount}</span>
                <p className="text-xs">tính năng khác</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAlternatingStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxItems = isPreview ? (isMobile ? 4 : 6) : 6;
    const visibleItems = normalizedItems.slice(0, maxItems);
    const remainingCount = normalizedItems.length - maxItems;

    return (
      <div className={cn('py-6 px-4', isPreview && (isMobile ? 'py-4 px-3' : 'md:py-10 md:px-6'))}>
        <div className="text-center mb-6">
          {renderBadge()}
          <h2
            className={cn('font-bold tracking-tight mt-2', isPreview && isMobile ? 'text-xl' : 'text-2xl md:text-3xl')}
            style={{ color: colors.heading }}
          >
            {sectionTitle}
          </h2>
        </div>

        <div className={cn('max-w-3xl mx-auto', isPreview && isMobile ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-3')}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ backgroundColor: colors.badgeBackground, borderColor: colors.cardBorder }}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                  >
                    <IconComponent size={18} strokeWidth={2} />
                  </div>
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: colors.timelineDot }}
                  >
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1" style={{ color: colors.body }}>
                    {item.title || 'Tên tính năng'}
                  </h3>
                  <p className="text-xs line-clamp-1" style={{ color: colors.muted }}>
                    {item.description || 'Mô tả tính năng...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {remainingCount > 0 && (
          <div className="text-center mt-4">
            <span className="text-sm" style={{ color: colors.actionText }}>
              +{remainingCount} tính năng khác
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderCompactStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxItems = isPreview ? (isMobile ? 4 : 8) : 8;
    const visibleItems = normalizedItems.slice(0, maxItems);
    const remainingCount = normalizedItems.length - maxItems;

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 mb-6"
          style={{ borderColor: colors.sectionRule }}
        >
          <div className="space-y-2">
            {renderBadge()}
            <h2
              className={cn('font-bold tracking-tight', isPreview && isMobile ? 'text-xl' : 'text-2xl md:text-3xl')}
              style={{ color: colors.heading }}
            >
              {sectionTitle}
            </h2>
          </div>
          {remainingCount > 0 && <span className="text-sm" style={{ color: colors.muted }}>+{remainingCount} tính năng khác</span>}
        </div>

        <div className={cn('grid gap-3', isPreview ? (isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4') : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4')}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className="flex items-start gap-3 p-4 rounded-xl border"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                >
                  <IconComponent size={18} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-0.5 truncate" style={{ color: colors.body }}>
                    {item.title || 'Tính năng'}
                  </h3>
                  <p className="text-xs line-clamp-2 min-h-[2rem]" style={{ color: colors.muted }}>
                    {item.description || 'Mô tả...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCardsStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxVisible = isPreview ? (isMobile ? 4 : 6) : 6;
    const visibleItems = normalizedItems.slice(0, maxVisible);
    const remainingCount = normalizedItems.length - maxVisible;

    const gridClass = cn(
      'grid gap-5',
      visibleItems.length === 1 ? 'max-w-sm mx-auto' : '',
      visibleItems.length === 2 ? 'max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2' : '',
      visibleItems.length >= 3
        ? (isPreview
          ? (isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3')
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
        : '',
    );

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        <div className="text-center mb-8 md:mb-12">
          {renderBadge()}
          <h2
            className={cn('font-bold tracking-tight mt-3 mb-3', isPreview && isMobile ? 'text-2xl' : 'text-3xl md:text-4xl')}
            style={{ color: colors.heading }}
          >
            {sectionTitle}
          </h2>
        </div>

        <div className={gridClass}>
          {visibleItems.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div
                key={getItemKey(item, idx)}
                className="relative rounded-2xl overflow-hidden border flex flex-col"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
              >
                <div className="h-1" style={{ backgroundColor: colors.primary }} />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                    >
                      <IconComponent size={22} strokeWidth={2} />
                    </div>
                    <span className="text-3xl font-bold opacity-25" style={{ color: colors.primary }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-1" style={{ color: colors.body }}>
                    {item.title || 'Tên tính năng'}
                  </h3>
                  <p className="text-sm leading-relaxed line-clamp-3 min-h-[3.75rem] flex-1" style={{ color: colors.muted }}>
                    {item.description || 'Mô tả tính năng...'}
                  </p>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.neutralBorder }}>
                    <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: colors.actionText }}>
                      Tìm hiểu thêm <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div
              className="flex items-center justify-center rounded-2xl border-2 border-dashed min-h-[250px]"
              style={{ borderColor: colors.neutralBorder, backgroundColor: colors.badgeBackground }}
            >
              <div className="text-center" style={{ color: colors.muted }}>
                <Plus size={32} className="mx-auto mb-2" />
                <span className="text-lg font-bold">+{remainingCount}</span>
                <p className="text-xs">tính năng khác</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const itemsPerView = style === 'carousel'
    ? (isPreview ? (isMobile ? 1 : isTablet ? 2 : 3) : 3)
    : 1;
  const maxCarouselIndex = Math.max(0, normalizedItems.length - itemsPerView);
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  React.useEffect(() => {
    if (carouselIndex > maxCarouselIndex) {
      setCarouselIndex(maxCarouselIndex);
    }
  }, [carouselIndex, maxCarouselIndex]);

  const renderCarouselStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    return (
      <div className={cn('py-8 px-4', isPreview && (isMobile ? 'py-6 px-3' : 'md:py-12 md:px-6'))}>
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            {renderBadge()}
            <h2
              className={cn('font-bold tracking-tight mt-3', isPreview && isMobile ? 'text-2xl' : 'text-3xl md:text-4xl')}
              style={{ color: colors.heading }}
            >
              {sectionTitle}
            </h2>
          </div>
          {normalizedItems.length > itemsPerView && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCarouselIndex((current) => Math.max(0, current - 1))}
                disabled={carouselIndex === 0}
                className="w-10 h-10 rounded-full border flex items-center justify-center disabled:opacity-40"
                style={{ borderColor: colors.neutralBorder, color: colors.body }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => setCarouselIndex((current) => Math.min(maxCarouselIndex, current + 1))}
                disabled={carouselIndex >= maxCarouselIndex}
                className="w-10 h-10 rounded-full border flex items-center justify-center disabled:opacity-40"
                style={{ borderColor: colors.neutralBorder, color: colors.body }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-300"
            style={{ transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)`, width: `${(normalizedItems.length / itemsPerView) * 100}%` }}
          >
            {normalizedItems.map((item, idx) => {
              const IconComponent = getIcon(item.icon);
              return (
                <div key={getItemKey(item, idx)} className="flex-shrink-0" style={{ width: `${100 / normalizedItems.length}%` }}>
                  <div
                    className="rounded-2xl p-6 border h-full flex flex-col"
                    style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: colors.iconChipBackground, color: colors.iconChipText }}
                    >
                      <IconComponent size={24} strokeWidth={2} />
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-1" style={{ color: colors.body }}>
                      {item.title || 'Tên tính năng'}
                    </h3>
                    <p className="text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]" style={{ color: colors.muted }}>
                      {item.description || 'Mô tả tính năng...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {normalizedItems.length > itemsPerView && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxCarouselIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={cn('w-2 h-2 rounded-full transition-all', idx === carouselIndex ? 'w-6' : '')}
                style={{ backgroundColor: idx === carouselIndex ? colors.primary : colors.neutralBorder }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTimelineStyle = () => {
    if (normalizedItems.length === 0) {return renderEmptyState();}

    const maxItems = isPreview ? (isMobile ? 4 : 6) : 6;
    const visibleItems = normalizedItems.slice(0, maxItems);
    const remainingCount = normalizedItems.length - maxItems;

    return (
      <div className={cn('py-6 px-4', isPreview && (isMobile ? 'py-4 px-3' : 'md:py-10 md:px-6'))}>
        <div className="text-center mb-6">
          {renderBadge()}
          <h2
            className={cn('font-bold tracking-tight mt-2', isPreview && isMobile ? 'text-xl' : 'text-2xl md:text-3xl')}
            style={{ color: colors.heading }}
          >
            {sectionTitle}
          </h2>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <div
            className={cn('absolute top-0 bottom-0 w-px', isPreview && isMobile ? 'left-3' : 'left-1/2')}
            style={{ backgroundColor: colors.timelineLine }}
          />

          <div className={cn('relative', isPreview && isMobile ? 'space-y-3' : 'space-y-4')}>
            {visibleItems.map((item, idx) => {
              const IconComponent = getIcon(item.icon);
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={getItemKey(item, idx)}
                  className={cn(
                    'relative flex items-center',
                    isPreview && isMobile ? 'pl-8' : (isEven ? 'flex-row pr-[52%]' : 'flex-row-reverse pl-[52%]'),
                  )}
                >
                  <div
                    className={cn(
                      'absolute flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow z-10',
                      isPreview && isMobile ? 'left-0' : 'left-1/2 -translate-x-1/2',
                    )}
                    style={{ backgroundColor: colors.timelineDot }}
                  >
                    <IconComponent size={12} className="text-white" strokeWidth={2.5} />
                  </div>

                  <div
                    className="flex-1 rounded-lg p-3 border"
                    style={{ backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: colors.badgeBackground, color: colors.badgeText }}
                      >
                        {idx + 1}
                      </span>
                      <h3 className="font-semibold text-sm line-clamp-1" style={{ color: colors.body }}>
                        {item.title || 'Tên tính năng'}
                      </h3>
                    </div>
                    <p className="text-xs line-clamp-1 pl-6" style={{ color: colors.muted }}>
                      {item.description || 'Mô tả tính năng...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {remainingCount > 0 && (
            <div className="text-center mt-4">
              <span className="text-sm" style={{ color: colors.actionText }}>
                +{remainingCount} tính năng khác
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const styleRenderer: Record<FeaturesStyle, () => React.ReactNode> = {
    iconGrid: renderIconGridStyle,
    alternating: renderAlternatingStyle,
    compact: renderCompactStyle,
    cards: renderCardsStyle,
    carousel: renderCarouselStyle,
    timeline: renderTimelineStyle,
  };

  const content = styleRenderer[style] ? styleRenderer[style]() : renderIconGridStyle();

  return (
    <div className={className} style={{ backgroundColor: colors.sectionBackground }}>
      {content}
    </div>
  );
}
