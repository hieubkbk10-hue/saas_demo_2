'use client';

import React from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../components/ui';
import type { BenefitsColorTokens } from '../_lib/colors';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { resolveContactIcon } from '../../contact/_lib/iconOptions';
import type {
  BenefitItem,
  BenefitsBrandMode,
  BenefitsConfig,
  BenefitsHeaderAlign,
  BenefitsStyle,
} from '../_types';

interface BenefitsSectionSharedProps {
  items: BenefitItem[];
  style: BenefitsStyle;
  title?: string;
  config: Pick<
    BenefitsConfig,
    'subHeading' | 'heading' | 'buttonText' | 'buttonLink' | 'headerAlign' | 'gridColumnsDesktop' | 'gridColumnsMobile'
  >;
  tokens: BenefitsColorTokens;
  mode: BenefitsBrandMode;
  context: 'preview' | 'site';
  previewDevice?: PreviewDevice;
  maxVisible?: number;
}

const BENEFITS_FALLBACKS = {
  description: 'Mô tả lợi ích...',
  heading: 'Giá trị cốt lõi',
  subHeading: 'Vì sao chọn chúng tôi?',
  title: 'Lợi ích nổi bật',
};

const normalizeBenefitsIconValue = (value?: string) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {return 'check';}

  const legacyMap: Record<string, string> = {
    Check: 'check',
    Shield: 'shield',
    Star: 'star',
    Target: 'target',
    Trophy: 'trophy',
    Zap: 'zap',
  };

  if (legacyMap[trimmed]) {return legacyMap[trimmed];}

  const hasUppercase = /[A-Z]/.test(trimmed);
  if (hasUppercase) {
    return trimmed
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  return trimmed;
};

const resolveBenefitsIcon = (value?: string) => resolveContactIcon(normalizeBenefitsIconValue(value));

const toText = (value: unknown, fallback: string) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : fallback;
};

const toDescription = (value?: string) => (value ?? '').trim();

const toSectionTitle = (title?: string, heading?: string) => {
  const headingText = toText(heading, '');
  if (headingText) {return headingText;}
  return toText(title, BENEFITS_FALLBACKS.title);
};

const toHeaderAlign = (value?: string): BenefitsHeaderAlign => (
  value === 'center' || value === 'right' || value === 'left'
    ? value
    : 'left'
);

const toGridColumnsDesktop = (value?: number): 3 | 4 => (
  value === 3 ? 3 : 4
);

const toGridColumnsMobile = (value?: number): 1 | 2 => (
  value === 1 ? 1 : 2
);

const toPreviewGridClass = (
  previewDevice: PreviewDevice,
  mobileColumns: 1 | 2,
  desktopColumns: 3 | 4,
) => {
  if (previewDevice === 'mobile') {
    return mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2';
  }

  if (previewDevice === 'tablet') {
    return 'grid-cols-2';
  }

  return desktopColumns === 3 ? 'grid-cols-3' : 'grid-cols-4';
};

const toKeySeed = (item: BenefitItem, idx: number) => `${item.icon}|${item.title}|${item.description}|${idx}`;

const toStableKey = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const buildStableKeys = (items: BenefitItem[]) => {
  const counters = new Map<string, number>();
  return items.map((item, idx) => {
    const seed = toKeySeed(item, idx);
    const base = toStableKey(seed);
    const seen = counters.get(base) ?? 0;
    counters.set(base, seen + 1);
    return `${base}-${seen}`;
  });
};

const sanitizeLink = (value?: string) => {
  const normalized = (value ?? '').trim();
  if (!normalized) {return '#';}

  if (
    normalized.startsWith('/')
    || normalized.startsWith('#')
    || normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('mailto:')
    || normalized.startsWith('tel:')
  ) {
    return normalized;
  }

  return '#';
};

const getRemainingCount = (allItems: BenefitItem[], displayedItems: BenefitItem[]) => (
  Math.max(0, allItems.length - displayedItems.length)
);

export function BenefitsSectionShared({
  items,
  style,
  title,
  config,
  tokens,
  mode,
  context,
  previewDevice,
  maxVisible,
}: BenefitsSectionSharedProps) {
  const HeadingTag = context === 'site' ? 'h2' : 'h3';

  const sectionHeading = toSectionTitle(title, config.heading ?? BENEFITS_FALLBACKS.heading);
  const rawSubheading = typeof config.subHeading === 'string' ? config.subHeading.trim() : '';
  const sectionSubheading = rawSubheading;
  const buttonText = (config.buttonText ?? '').trim();
  const buttonLink = sanitizeLink(config.buttonLink);
  const headerAlign = toHeaderAlign(config.headerAlign);
  const headerAlignClass = headerAlign === 'center'
    ? 'items-center text-center'
    : headerAlign === 'right'
      ? 'items-end text-right'
      : 'items-start text-left';

  const isPreview = context === 'preview';
  const isPreviewMobile = isPreview && previewDevice === 'mobile';
  const sectionPaddingClass = isPreviewMobile ? 'py-8' : 'py-12 md:py-16';

  const gridColumnsDesktop = toGridColumnsDesktop(config.gridColumnsDesktop);
  const gridColumnsMobile = toGridColumnsMobile(config.gridColumnsMobile);
  const gridBaseClass = gridColumnsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const gridDesktopClass = gridColumnsDesktop === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
  const resolvedPreviewDevice = previewDevice ?? 'desktop';
  const previewGridClass = toPreviewGridClass(resolvedPreviewDevice, gridColumnsMobile, gridColumnsDesktop);
  const gridCardsClass = isPreview
    ? cn('grid', previewGridClass, isPreviewMobile ? 'gap-3' : 'gap-4')
    : cn('grid', gridBaseClass, 'md:grid-cols-2', gridDesktopClass, 'gap-4 md:gap-6');
  const gridRowClass = isPreview
    ? cn('grid', previewGridClass, 'divide-y', resolvedPreviewDevice === 'mobile' ? '' : 'divide-x')
    : cn('grid', gridBaseClass, 'md:grid-cols-2', gridDesktopClass, 'divide-y md:divide-y-0 md:divide-x');

  const displayedItems = React.useMemo(
    () => (typeof maxVisible === 'number' ? items.slice(0, maxVisible) : items),
    [items, maxVisible],
  );

  const remainingCount = getRemainingCount(items, displayedItems);

  const itemKeys = React.useMemo(
    () => buildStableKeys(displayedItems),
    [displayedItems],
  );

  const carouselId = React.useId().replaceAll(':', '');

  const headerContainerClass = headerAlign === 'center'
    ? 'flex flex-col items-center text-center'
    : headerAlign === 'right'
      ? 'flex flex-col items-end text-right'
      : 'flex flex-col md:flex-row md:items-end md:justify-between';

  const renderHeader = () => (
    <div
      className={cn(headerContainerClass, 'gap-4 pb-4 border-b')}
      style={{ borderColor: tokens.neutralBorder }}
    >
      <div className={cn('space-y-2', headerAlignClass)}>
        {sectionSubheading ? (
          <span
            className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: tokens.badgeBackground,
              borderColor: tokens.neutralBorder,
              color: tokens.badgeText,
            }}
          >
            {sectionSubheading}
          </span>
        ) : null}
        <HeadingTag className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: tokens.heading }}>
          {sectionHeading}
        </HeadingTag>
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: tokens.iconSurfaceStrong }}
          >
            <Check size={32} style={{ color: tokens.iconTextStrong }} />
          </div>
          <HeadingTag className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>
            {toText(title, BENEFITS_FALLBACKS.title)}
          </HeadingTag>
          <p style={{ color: tokens.mutedText }}>Chưa có lợi ích nào</p>
        </div>
      </section>
    );
  }

  if (style === 'cards') {
    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}
          <div className={gridCardsClass}>
            {displayedItems.map((item, idx) => {
              const Icon = resolveBenefitsIcon(item.icon);
              const description = toDescription(item.description);
              return (
                <article
                  key={itemKeys[idx]}
                  className={cn('rounded-xl shadow-sm flex flex-col items-start border', isPreviewMobile ? 'p-4' : 'p-5 md:p-6')}
                  style={{
                    backgroundColor: tokens.cardBackground,
                    borderColor: tokens.cardBorder,
                  }}
                >
                  <div
                    className={cn('rounded-lg flex items-center justify-center mb-3', isPreviewMobile ? 'w-9 h-9' : 'w-11 h-11 md:w-12 md:h-12')}
                    style={{ backgroundColor: tokens.iconSurfaceStrong, color: tokens.iconTextStrong }}
                  >
                    <Icon size={18} />
                  </div>

                  <h3 className={cn('font-bold mb-2 line-clamp-2', isPreviewMobile ? 'text-base' : 'text-base md:text-lg')} style={{ color: tokens.heading }}>
                    {toText(item.title, 'Tiêu đề')}
                  </h3>

                  {description ? (
                    <p className="text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]" style={{ color: tokens.mutedText }}>
                      {description}
                    </p>
                  ) : null}
                </article>
              );
            })}

            {remainingCount > 0 && (
              <div
                className="rounded-xl flex items-center justify-center border-2 border-dashed p-5"
                style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.neutralSurface }}
              >
                <div className="text-center">
                  <span className="text-lg font-bold" style={{ color: tokens.plusBadgeText }}>
                    +{remainingCount}
                  </span>
                  <p className="text-xs" style={{ color: tokens.mutedText }}>mục khác</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'list') {
    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-5xl mx-auto space-y-6">
          {renderHeader()}

          <div className="flex flex-col gap-3">
            {displayedItems.map((item, idx) => (
              <article
                key={itemKeys[idx]}
                className={cn('relative rounded-lg overflow-hidden shadow-sm border', isPreviewMobile ? 'p-3 pl-4' : 'p-4 md:p-5 pl-5 md:pl-6')}
                style={{
                  backgroundColor: tokens.neutralSurface,
                  borderColor: tokens.neutralBorder,
                }}
              >
                <div
                  className="absolute top-0 bottom-0 left-0 w-1.5"
                  style={{ backgroundColor: tokens.styleAccentByStyle.list }}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={cn('rounded-full flex items-center justify-center border', isPreviewMobile ? 'w-5 h-5' : 'w-6 h-6')}
                        style={{
                          backgroundColor: tokens.iconSurface,
                          borderColor: tokens.neutralBorder,
                          color: tokens.iconTextStrong,
                        }}
                      >
                        <span className={cn('font-bold', isPreviewMobile ? 'text-[10px]' : 'text-[11px]')}>{idx + 1}</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className={cn('font-bold line-clamp-1', isPreviewMobile ? 'text-sm' : 'text-sm md:text-base')} style={{ color: tokens.neutralText }}>
                        {toText(item.title, 'Tiêu đề')}
                      </h3>
                      {toDescription(item.description) ? (
                        <p className={cn('leading-normal line-clamp-2', isPreviewMobile ? 'text-xs mt-0.5' : 'text-xs md:text-sm mt-1 md:mt-1.5')} style={{ color: tokens.mutedText }}>
                          {toDescription(item.description)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="hidden md:block flex-shrink-0" style={{ color: tokens.iconTextStrong }}>
                    <Check size={18} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {remainingCount > 0 && (
            <div className="text-center">
              <span className="text-sm font-medium" style={{ color: tokens.plusBadgeText }}>
                +{remainingCount} mục khác
              </span>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'bento') {
    const bentoItems = displayedItems.slice(0, 4);

    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {bentoItems.map((item, idx) => {
              const isWide = idx === 0 || idx === 3;
              const isPrimary = idx === 0;
              const description = toDescription(item.description);

              return (
                <article
                  key={itemKeys[idx]}
                className={cn(
                  'flex flex-col justify-between rounded-2xl border',
                  isPreviewMobile ? 'p-4 min-h-[140px]' : 'p-5 md:p-6 lg:p-8 min-h-[160px] md:min-h-[180px]',
                  isWide ? 'md:col-span-2' : 'md:col-span-1',
                )}
                  style={
                    isPrimary
                      ? {
                        backgroundColor: tokens.primary,
                        borderColor: tokens.primary,
                      }
                      : {
                        backgroundColor: tokens.neutralSurface,
                        borderColor: tokens.neutralBorder,
                      }
                  }
                >
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded"
                      style={
                        isPrimary
                          ? {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: '#ffffff',
                          }
                          : {
                            backgroundColor: tokens.badgeBackground,
                            color: tokens.badgeText,
                          }
                      }
                    >
                      0{idx + 1}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={cn(
                        'font-bold mb-2 md:mb-3 tracking-tight line-clamp-2',
                        isPreviewMobile ? 'text-lg' : 'text-lg md:text-xl lg:text-2xl',
                      )}
                      style={{ color: isPrimary ? '#ffffff' : tokens.neutralText }}
                    >
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                    {description ? (
                      <p
                        className="text-sm md:text-base leading-relaxed font-medium line-clamp-3"
                        style={{ color: isPrimary ? 'rgba(255,255,255,0.9)' : tokens.mutedText }}
                      >
                        {description}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'row') {
    const rowItems = displayedItems.slice(0, 4);

    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}

          <div className="rounded-lg overflow-hidden border-y" style={{ borderColor: tokens.rowDivider }}>
            <div className={gridRowClass} style={{ borderColor: tokens.rowDivider }}>
              {rowItems.map((item, idx) => {
                const Icon = resolveBenefitsIcon(item.icon);
                const description = toDescription(item.description);

                return (
                  <article
                    key={itemKeys[idx]}
                    className={cn(
                      'flex flex-col items-center text-center',
                      isPreviewMobile ? 'p-4' : 'p-5 md:p-6 lg:p-8',
                    )}
                    style={{ backgroundColor: tokens.neutralSurface }}
                  >
                    <div
                      className={cn('rounded-full', isPreviewMobile ? 'mb-2 p-2.5' : 'mb-3 md:mb-4 p-3')}
                      style={{
                        backgroundColor: tokens.iconSurface,
                        color: tokens.iconText,
                        border: `1px solid ${tokens.neutralBorder}`,
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <h3
                      className={cn(
                        'font-bold line-clamp-2 min-h-[2.5rem]',
                        isPreviewMobile ? 'mb-1 text-sm' : 'mb-1.5 md:mb-2 text-sm md:text-base',
                      )}
                      style={{ color: tokens.neutralText }}
                    >
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                    {description ? (
                      <p
                        className={cn('leading-relaxed line-clamp-3', isPreviewMobile ? 'text-xs' : 'text-xs md:text-sm')}
                        style={{ color: tokens.mutedText }}
                      >
                        {description}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'carousel') {
    const cardWidth = isPreviewMobile ? 260 : 320;
    const gap = 16;
    const showArrowsDesktop = displayedItems.length > 3;

    return (
      <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">{renderHeader()}</div>

            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector<HTMLElement>(`#benefits-carousel-${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
                  style={{ borderColor: tokens.carouselArrowBorder, color: tokens.carouselArrowIcon }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector<HTMLElement>(`#benefits-carousel-${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-r from-white/40 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-l from-white/40 to-transparent z-10 pointer-events-none" />

            <div
              id={`benefits-carousel-${carouselId}`}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 py-4 px-2 cursor-grab active:cursor-grabbing select-none"
              style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              onMouseDown={(event) => {
                const el = event.currentTarget;
                el.dataset.isDown = 'true';
                el.dataset.startX = String(event.pageX - el.offsetLeft);
                el.dataset.scrollLeft = String(el.scrollLeft);
                el.style.scrollBehavior = 'auto';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.dataset.isDown = 'false';
                event.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseUp={(event) => {
                event.currentTarget.dataset.isDown = 'false';
                event.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseMove={(event) => {
                const el = event.currentTarget;
                if (el.dataset.isDown !== 'true') {return;}
                event.preventDefault();
                const x = event.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
            >
              {displayedItems.map((item, idx) => {
                const Icon = resolveBenefitsIcon(item.icon);
                const isHighlighted = mode === 'dual' ? idx % 3 === 0 : idx === 0;
                const description = toDescription(item.description);

                return (
                  <article
                    key={itemKeys[idx]}
                    className={cn(
                      'snap-start flex-shrink-0 rounded-xl border shadow-sm',
                      isPreviewMobile ? 'w-[260px] p-4' : 'w-[280px] md:w-[320px] p-5 md:p-6',
                    )}
                    style={
                      isHighlighted
                        ? {
                          backgroundColor: tokens.primary,
                          borderColor: tokens.primary,
                        }
                        : {
                          backgroundColor: tokens.neutralSurface,
                          borderColor: tokens.cardBorder,
                        }
                    }
                    draggable={false}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                      style={
                        isHighlighted
                          ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }
                          : { backgroundColor: tokens.iconSurfaceStrong, color: tokens.iconTextStrong }
                      }
                    >
                      <Icon size={18} />
                    </div>

                    <h3
                      className="font-bold text-base mb-2 line-clamp-2"
                      style={{ color: isHighlighted ? '#ffffff' : tokens.neutralText }}
                    >
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                    {description ? (
                      <p
                        className="text-sm leading-relaxed line-clamp-3"
                        style={{ color: isHighlighted ? 'rgba(255,255,255,0.85)' : tokens.mutedText }}
                      >
                        {description}
                      </p>
                    ) : null}
                  </article>
                );
              })}

              <div className="flex-shrink-0 w-4" />
            </div>

            <style>{`#benefits-carousel-${carouselId}::-webkit-scrollbar{display:none;}`}</style>
          </div>
        </div>
      </section>
    );
  }

  // timeline (default)
  return (
    <section className={cn(sectionPaddingClass, 'px-4')} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="max-w-3xl mx-auto space-y-8">
        {renderHeader()}

        <div className="relative">
          <div
            className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5"
            style={{ backgroundColor: tokens.timelineLine }}
          />

          <div className="space-y-6 md:space-y-8">
            {displayedItems.map((item, idx) => (
              <article
                key={itemKeys[idx]}
                className={cn(
                  'relative flex items-start pl-12 md:pl-0',
                  idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse',
                )}
              >
                <div
                  className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-8 h-8 rounded-full border-4 flex items-center justify-center text-xs font-bold z-10"
                  style={{
                    backgroundColor: tokens.timelineDotBackground,
                    borderColor: tokens.timelineDotBorder,
                    color: tokens.timelineDotText,
                  }}
                >
                  {idx + 1}
                </div>

                <div
                  className="rounded-xl p-4 md:p-5 border shadow-sm w-full md:w-5/12"
                  style={{
                    backgroundColor: tokens.neutralSurface,
                    borderColor: tokens.cardBorder,
                  }}
                >
                  <h3 className="font-bold mb-2 line-clamp-2" style={{ color: tokens.neutralText }}>
                    {toText(item.title, 'Tiêu đề')}
                  </h3>
                  {toDescription(item.description) ? (
                    <p className="text-sm leading-relaxed line-clamp-3" style={{ color: tokens.mutedText }}>
                      {toDescription(item.description)}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        {buttonText && (
          <div className="text-center">
            <a
              href={buttonLink}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium"
              style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
            >
              {buttonText}
              <ArrowRight size={16} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
