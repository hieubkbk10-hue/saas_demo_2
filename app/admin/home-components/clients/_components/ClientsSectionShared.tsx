'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Plus } from 'lucide-react';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import type { ClientsColorTokens } from '../_lib/colors';
import type { ClientItem, ClientsStyle } from '../_types';

interface NormalizedClientItem {
  key: string;
  url: string;
  link: string;
  name: string;
}

interface ClientsSectionSharedProps {
  context: 'preview' | 'site';
  title: string;
  style: ClientsStyle;
  items: ClientItem[];
  tokens: ClientsColorTokens;
  carouselId?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  texts?: {
    subtitle?: string;
    heading?: string;
    countLabel?: string;
    scrollHint?: string;
    othersLabel?: string;
  };
}

export const normalizeClientsStyleSafe = (value: unknown): ClientsStyle => {
  if (
    value === 'simpleGrid'
    || value === 'compactInline'
    || value === 'subtleMarquee'
    || value === 'grid'
    || value === 'carousel'
    || value === 'featured'
  ) {
    return value;
  }
  return 'simpleGrid';
};

export const normalizeClientItems = (items: unknown): NormalizedClientItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set<string>();

  return items
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        return null;
      }

      const source = raw as Record<string, unknown>;
      const url = typeof source.url === 'string' ? source.url.trim() : '';
      const link = typeof source.link === 'string' ? source.link.trim() : '';
      const name = typeof source.name === 'string' ? source.name.trim() : '';

      // Giữ items dù url rỗng (placeholder sẽ được render)
      // Chỉ dedupe items có url để tránh duplicate logos
      if (url && seen.has(url)) {
        return null;
      }
      if (url) {
        seen.add(url);
      }

      return {
        key: `client-${index}`,
        url,
        link,
        name,
      };
    })
    .filter((item): item is NormalizedClientItem => item !== null);
};

const getImageSizeClass = (size: 'sm' | 'md' | 'lg') => {
  if (size === 'lg') {return 'h-16 md:h-[4.5rem]';}
  if (size === 'sm') {return 'h-12 md:h-14';}
  return 'h-14 md:h-16';
};

const renderLogoContent = (
  item: NormalizedClientItem,
  idx: number,
  tokens: ClientsColorTokens,
  size: 'sm' | 'md' | 'lg',
) => (
  item.url ? (
    <PreviewImage
      src={item.url}
      alt={item.name || `Logo ${idx + 1}`}
      className={`${getImageSizeClass(size)} w-auto object-contain select-none`}
    />
  ) : (
    <div
      className={`${getImageSizeClass(size)} w-28 rounded-lg flex items-center justify-center`}
      style={{ backgroundColor: tokens.placeholderBackground }}
    >
      <ImageIcon size={22} style={{ color: tokens.placeholderIcon }} className="opacity-70" />
    </div>
  )
);

const _renderLogoItem = (
  item: NormalizedClientItem,
  idx: number,
  tokens: ClientsColorTokens,
  size: 'sm' | 'md' | 'lg' = 'md',
) => {
  const content = renderLogoContent(item, idx, tokens, size);
  const ariaLabel = item.name || `Logo ${idx + 1}`;

  if (!item.link) {
    return (
      <div key={`${item.key}-${idx}`} className="shrink-0" role="listitem" aria-label={ariaLabel}>
        {content}
      </div>
    );
  }

  return (
    <a
      key={`${item.key}-${idx}`}
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0"
      role="listitem"
      aria-label={ariaLabel}
    >
      {content}
    </a>
  );
};

const renderSectionTitle = (title: string, accentColor: string, headingColor: string) => (
  <h2 className="text-lg md:text-xl font-bold tracking-tight relative pl-3" style={{ color: headingColor }}>
    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
    {title}
  </h2>
);

export function ClientsSectionShared({
  context,
  title,
  style,
  items,
  tokens,
  carouselId,
  device = 'desktop',
  texts = {},
}: ClientsSectionSharedProps) {
  const normalizedItems = React.useMemo(() => normalizeClientItems(items), [items]);
  const selectedStyle = normalizeClientsStyleSafe(style);

  if (normalizedItems.length === 0) {
    return null;
  }

  const sectionTitle = title.trim().length > 0 ? title : 'Khách hàng tin tưởng';

  const subtleStyles = `
    @keyframes subtle-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .subtle-marquee-track { animation: subtle-scroll 60s linear infinite; }
    .subtle-marquee-container:hover .subtle-marquee-track { animation-play-state: paused; }
    @media (prefers-reduced-motion: reduce) { .subtle-marquee-track { animation: none !important; } }
  `;

  // Layout 1: Simple Static Grid - Clean grid like Stripe/Vercel
  if (selectedStyle === 'simpleGrid') {
    const subtitle = texts.subtitle || 'Được tin tưởng bởi';
    const heading = texts.heading || sectionTitle;
    
    return (
      <section className="w-full py-12 border-b" style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }} aria-label={sectionTitle}>
        <div className="w-full max-w-7xl mx-auto px-4 space-y-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: tokens.secondary }}>{subtitle}</p>
            <h2 className="text-lg md:text-xl font-bold" style={{ color: tokens.heading }}>{heading}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 items-center justify-items-center py-4" role="list">
            {normalizedItems.map((item, idx) => (
              <div key={`sg-${item.key}-${idx}`} role="listitem">
                {renderLogoContent(item, idx, tokens, 'md')}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Layout 2: Compact Inline - Single row, flexbox wrap, minimal
  if (selectedStyle === 'compactInline') {
    const heading = texts.heading || sectionTitle;
    
    return (
      <section className="w-full py-10 border-b" style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }} aria-label={sectionTitle}>
        <div className="w-full max-w-7xl mx-auto px-4 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold" style={{ color: tokens.heading }}>{heading}</h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: tokens.countBadgeBackground, color: tokens.countBadgeText }}>
              {normalizedItems.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 py-3" role="list">
            {normalizedItems.map((item, idx) => (
              <div key={`ci-${item.key}-${idx}`} role="listitem">
                {renderLogoContent(item, idx, tokens, 'sm')}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Layout 3: Subtle Marquee - Very slow scroll, no filters
  if (selectedStyle === 'subtleMarquee') {
    const heading = texts.heading || sectionTitle;
    const subtitle = texts.subtitle || 'Đối tác';
    
    return (
      <section className="w-full py-12 border-b" style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }} aria-label={sectionTitle}>
        <style>{subtleStyles}</style>
        <div className="w-full max-w-7xl mx-auto px-4 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: tokens.secondary }}>{subtitle}</p>
            <h2 className="text-lg md:text-xl font-bold" style={{ color: tokens.heading }}>{heading}</h2>
          </div>
          <div
            className="subtle-marquee-container relative overflow-hidden py-4"
            role="list"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
          >
            <div className="subtle-marquee-track flex items-center gap-12 md:gap-16" style={{ width: 'max-content' }}>
              {normalizedItems.map((item, idx) => (
                <div key={`sm1-${item.key}-${idx}`} className="shrink-0" role="listitem">
                  {renderLogoContent(item, idx, tokens, 'md')}
                </div>
              ))}
              {normalizedItems.map((item, idx) => (
                <div key={`sm2-${item.key}-${idx}`} className="shrink-0" role="listitem">
                  {renderLogoContent(item, idx + normalizedItems.length, tokens, 'md')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (selectedStyle === 'grid') {
    const heading = texts.heading || sectionTitle;
    const countLabel = texts.countLabel || 'đối tác';
    const maxVisible = context === 'preview' && device === 'mobile' ? 6 : 12;
    const visibleItems = normalizedItems.slice(0, maxVisible);
    const remainingCount = Math.max(0, normalizedItems.length - maxVisible);

    return (
      <section className="w-full py-8 border-b" style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }} aria-label={sectionTitle}>
        <div className="w-full max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            {renderSectionTitle(heading, tokens.sectionAccent, tokens.heading)}
            <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ backgroundColor: tokens.countBadgeBackground, color: tokens.countBadgeText, borderColor: tokens.countBadgeBorder }}>
              {normalizedItems.length} {countLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 py-3" role="list">
            {visibleItems.map((item, idx) => (
              <div key={`grid-${item.key}-${idx}`} className="p-3 rounded-lg border transition-colors flex flex-col items-center" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }} role="listitem">
                {renderLogoContent(item, idx, tokens, 'md')}
                {item.name ? <span className="text-[10px] text-center mt-1.5 truncate max-w-full" style={{ color: tokens.mutedText }}>{item.name}</span> : null}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="p-3 rounded-lg border flex flex-col items-center justify-center" style={{ backgroundColor: tokens.placeholderBackground, borderColor: tokens.cardBorder }} role="listitem">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: tokens.placeholderIconBackground }}>
                  <Plus size={18} style={{ color: tokens.placeholderIcon }} />
                </div>
                <span className="text-sm font-bold" style={{ color: tokens.countBadgeText }}>+{remainingCount}</span>
                <span className="text-[10px]" style={{ color: tokens.placeholderText }}>khác</span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (selectedStyle === 'carousel') {
    const heading = texts.heading || sectionTitle;
    const scrollHint = texts.scrollHint || 'Vuốt để xem thêm';
    const safeCarouselId = carouselId || 'clients-shared-carousel';

    return (
      <section className="w-full py-8 border-b" style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }} aria-label={sectionTitle}>
        <style>{`#${safeCarouselId}::-webkit-scrollbar { display: none; }`}</style>
        <div className="w-full max-w-7xl mx-auto space-y-4">
          <div className="px-4 flex items-center justify-between gap-3">
            <div>
              {renderSectionTitle(heading, tokens.sectionAccent, tokens.heading)}
              <p className="pl-3 text-xs" style={{ color: tokens.secondary }}>{scrollHint}</p>
            </div>
            {normalizedItems.length > 3 && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector(`#${safeCarouselId}`);
                    if (el) {el.scrollBy({ behavior: 'smooth', left: -182 });}
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center border"
                  style={{ backgroundColor: tokens.navButtonBackground, borderColor: tokens.navButtonBorder, color: tokens.navButtonText }}
                  aria-label="Cuộn trái"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector(`#${safeCarouselId}`);
                    if (el) {el.scrollBy({ behavior: 'smooth', left: 182 });}
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center border"
                  style={{ backgroundColor: tokens.navButtonBackground, borderColor: tokens.navButtonBorder, color: tokens.navButtonText }}
                  aria-label="Cuộn phải"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="relative overflow-hidden mx-4 rounded-lg">
            <div className="absolute left-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div
              id={safeCarouselId}
              className="flex overflow-x-auto snap-x snap-mandatory gap-3 py-3 px-1.5"
              style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              role="list"
            >
              {normalizedItems.map((item, idx) => (
                <div key={`carousel-${item.key}-${idx}`} className="flex-shrink-0 snap-start w-[170px]" role="listitem">
                  <div className="h-full p-3 rounded-lg border flex flex-col items-center justify-center" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
                    {renderLogoContent(item, idx, tokens, 'sm')}
                    {item.name ? <span className="text-[10px] text-center mt-1.5 truncate w-full" style={{ color: tokens.mutedText }}>{item.name}</span> : null}
                  </div>
                </div>
              ))}
              <div className="flex-shrink-0 w-3" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const heading = texts.heading || sectionTitle;
  const subtitle = texts.subtitle || 'Được tin tưởng bởi các thương hiệu hàng đầu';
  const othersLabel = texts.othersLabel || 'Và nhiều đối tác khác';
  
  const featuredItems = normalizedItems.slice(0, 4);
  const otherItems = normalizedItems.slice(4);
  const maxOther = context === 'preview' && device === 'mobile' ? 4 : 8;
  const visibleOthers = otherItems.slice(0, maxOther);
  const remainingCount = Math.max(0, otherItems.length - maxOther);

  return (
    <section className="w-full py-10 border-b" style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }} aria-label={sectionTitle}>
      <div className="w-full max-w-7xl mx-auto px-4 space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-lg md:text-xl font-bold tracking-tight" style={{ color: tokens.heading }}>{heading}</h2>
          <p className="text-xs" style={{ color: tokens.secondary }}>{subtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="list">
          {featuredItems.map((item, idx) => (
            <div key={`featured-${item.key}-${idx}`} className="rounded-xl border flex flex-col items-center justify-center p-5" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }} role="listitem">
              {renderLogoContent(item, idx, tokens, 'lg')}
              {item.name ? <span className="font-medium text-center mt-2 truncate w-full text-xs" style={{ color: tokens.neutralText }}>{item.name}</span> : null}
            </div>
          ))}
        </div>

        {visibleOthers.length > 0 && (
          <div className="pt-4 border-t" style={{ borderColor: tokens.neutralBorder }}>
            <p className="text-center mb-3 text-xs" style={{ color: tokens.secondary }}>{othersLabel}</p>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6" role="list">
              {visibleOthers.map((item, idx) => (
                <div key={`other-${item.key}-${idx}`} role="listitem">
                  {renderLogoContent(item, idx + featuredItems.length, tokens, 'sm')}
                </div>
              ))}
              {remainingCount > 0 ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ backgroundColor: tokens.countBadgeBackground, color: tokens.countBadgeText, borderColor: tokens.countBadgeBorder }}>
                  +{remainingCount}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

