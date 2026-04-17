'use client';

import React from 'react';
import {
  Briefcase,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Globe,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Rocket,
  Settings,
  Shield,
  Star,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import type { ServiceItem, ServicesColorTokens, ServicesStyle } from '@/app/admin/home-components/services/_types';
import { getAPCATextColor } from '@/app/admin/home-components/services/_lib/colors';

const iconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Briefcase,
  Building2,
  Check,
  Clock,
  Cpu,
  Globe,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Rocket,
  Settings,
  Shield,
  Star,
  Target,
  Users,
  Zap,
};

const ServiceIcon = ({ name, size = 24, style }: { name?: string; size?: number; style?: React.CSSProperties }) => {
  const IconComponent = (name && iconMap[name]) || Star;
  return <IconComponent size={size} style={style} />;
};

const getServiceKey = (item: ServiceItem, index: number) => {
  return `${item.icon}-${item.title}-${item.description}-${index}`;
};

const getDisplayTitle = (title?: string) => title?.trim() || 'Dịch vụ';

export type ServicesCoreDevice = 'desktop' | 'tablet' | 'mobile';

export const ServicesSectionCore = ({
  items,
  style,
  title,
  colors,
  device = 'desktop',
  isPreview = false,
  carouselId,
}: {
  items: ServiceItem[];
  style: ServicesStyle;
  title: string;
  colors: ServicesColorTokens;
  device?: ServicesCoreDevice;
  isPreview?: boolean;
  carouselId?: string;
}) => {
  const fallbackId = React.useId().replaceAll(':', '');
  const scrollId = carouselId ?? `services-carousel-${fallbackId}`;
  const sectionTitle = getDisplayTitle(title);

  const previewMax = device === 'mobile' ? 3 : (device === 'tablet' ? 4 : 6);
  const visibleForPreview = items.slice(0, previewMax);

  const visibleForRuntime = items.slice(0, 6);
  const remainingForRuntime = Math.max(0, items.length - 6);

  const displayItems = isPreview ? visibleForPreview : items;
  const displayFeaturedItems = isPreview ? visibleForPreview : visibleForRuntime;

  if (items.length === 0) {
    return (
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto rounded-xl border p-8 text-center" style={{ backgroundColor: colors.placeholderBackground, borderColor: colors.neutralBorder }}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: colors.placeholderIconBackground }}>
            <ServiceIcon size={24} style={{ color: colors.placeholderIcon }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: colors.bodyText }}>Chưa có dịch vụ nào</h3>
          <p className="mt-1 text-sm" style={{ color: colors.placeholderText }}>Thêm mục đầu tiên để bắt đầu</p>
        </div>
      </section>
    );
  }

  if (style === 'elegantGrid') {
    return (
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: colors.heading }}>{sectionTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(isPreview ? displayItems : items).map((item, idx) => (
              <article key={getServiceKey(item, idx)} className="rounded-xl border bg-white p-5" style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }}>
                <div className="mb-3 h-1 w-14 rounded-full" style={{ backgroundColor: colors.sectionAccent }} />
                <h3 className="text-base font-semibold" style={{ color: colors.bodyText }}>{item.title || 'Tiêu đề'}</h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: colors.mutedText }}>{item.description || 'Mô tả dịch vụ...'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'modernList') {
    return (
      <section className="py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: colors.heading }}>{sectionTitle}</h2>
          <div className="divide-y" style={{ borderColor: colors.neutralBorder }}>
            {(isPreview ? displayItems : items).map((item, idx) => (
              <article key={getServiceKey(item, idx)} className="flex items-start gap-4 py-4">
                <span className="w-9 flex-shrink-0 text-xl font-bold tabular-nums" style={{ color: colors.numberText }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold" style={{ color: colors.bodyText }}>{item.title || 'Tiêu đề'}</h3>
                  <p className="mt-1 text-sm" style={{ color: colors.mutedText }}>{item.description || 'Mô tả dịch vụ...'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'bigNumber') {
    const textOnPrimary = getAPCATextColor(colors.primary, 18, 700);
    return (
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: colors.heading }}>{sectionTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayFeaturedItems.map((item, idx) => {
              const highlighted = idx === 0;
              return (
                <article
                  key={getServiceKey(item, idx)}
                  className="relative rounded-xl border p-5"
                  style={highlighted
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.neutralBackground, borderColor: colors.neutralBorder }}
                >
                  <span
                    className="mb-2 block text-3xl font-black leading-none"
                    style={{ color: highlighted ? textOnPrimary : colors.numberText }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-base font-semibold" style={{ color: highlighted ? textOnPrimary : colors.bodyText }}>{item.title || 'Tiêu đề'}</h3>
                  <p className="mt-1 text-sm" style={{ color: highlighted ? textOnPrimary : colors.mutedText }}>{item.description || 'Mô tả dịch vụ...'}</p>
                </article>
              );
            })}
            {!isPreview && remainingForRuntime > 0 && (
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed" style={{ borderColor: colors.plusTileBorder }}>
                <span className="text-xl font-bold" style={{ color: colors.plusTileText }}>+{remainingForRuntime}</span>
                <span className="text-sm" style={{ color: colors.mutedText }}>dịch vụ khác</span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'cards') {
    return (
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: colors.heading }}>{sectionTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayFeaturedItems.map((item, idx) => (
              <article key={getServiceKey(item, idx)} className="rounded-xl border bg-white p-5" style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }}>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: colors.neutralSurface }}>
                  <ServiceIcon name={item.icon} size={20} style={{ color: colors.iconColor }} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: colors.bodyText }}>{item.title || 'Tiêu đề'}</h3>
                <p className="mt-1 text-sm" style={{ color: colors.mutedText }}>{item.description || 'Mô tả dịch vụ...'}</p>
              </article>
            ))}
            {!isPreview && remainingForRuntime > 0 && (
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed" style={{ borderColor: colors.plusTileBorder }}>
                <Plus size={20} style={{ color: colors.plusTileText }} />
                <span className="mt-1 text-lg font-bold" style={{ color: colors.plusTileText }}>+{remainingForRuntime}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'carousel') {
    const carouselItems = isPreview ? displayItems : displayFeaturedItems;
    const cardWidth = 300;
    const gap = 16;

    return (
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: colors.heading }}>{sectionTitle}</h2>
            {carouselItems.length > 3 && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Cuộn trước"
                  onClick={() => {
                    const container = document.querySelector(`#${scrollId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="h-9 w-9 rounded-full border bg-white flex items-center justify-center"
                  style={{ borderColor: colors.neutralBorder }}
                >
                  <ChevronLeft size={16} style={{ color: colors.buttonText }} />
                </button>
                <button
                  type="button"
                  aria-label="Cuộn sau"
                  onClick={() => {
                    const container = document.querySelector(`#${scrollId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="h-9 w-9 rounded-full border bg-white flex items-center justify-center"
                  style={{ borderColor: colors.neutralBorder }}
                >
                  <ChevronRight size={16} style={{ color: colors.buttonText }} />
                </button>
              </div>
            )}
          </div>

          <div
            id={scrollId}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-1"
            style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {carouselItems.map((item, idx) => (
              <article
                key={getServiceKey(item, idx)}
                className="snap-start w-[280px] md:w-[300px] shrink-0 rounded-xl border bg-white"
                style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }}
              >
                <div className="h-1.5 w-full rounded-t-xl" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }} />
                <div className="p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: colors.neutralSurface }}>
                    <ServiceIcon name={item.icon} size={18} style={{ color: colors.iconColor }} />
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: colors.bodyText }}>{item.title || 'Tiêu đề'}</h3>
                  <p className="mt-1 text-sm" style={{ color: colors.mutedText }}>{item.description || 'Mô tả dịch vụ...'}</p>
                </div>
              </article>
            ))}
            <div className="w-2 shrink-0" />
          </div>
          {!isPreview && remainingForRuntime > 0 && (
            <p className="text-sm" style={{ color: colors.mutedText }}>+{remainingForRuntime} dịch vụ khác</p>
          )}
          <style>{`#${scrollId}::-webkit-scrollbar { display: none; }`}</style>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: colors.heading }}>{sectionTitle}</h2>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5" style={{ backgroundColor: colors.timelineLine }} />
          <div className="space-y-5">
            {displayFeaturedItems.map((item, idx) => (
              <article key={getServiceKey(item, idx)} className={`relative flex ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: colors.timelineDotBorder }}>
                  <ServiceIcon name={item.icon} size={16} style={{ color: colors.numberText }} />
                </div>
                <div className={`ml-16 md:ml-0 md:w-5/12 rounded-xl border bg-white p-4 ${idx % 2 === 0 ? 'md:mr-auto md:ml-8' : 'md:ml-auto md:mr-8'}`} style={{ borderColor: colors.cardBorder }}>
                  <div className="mb-1 text-sm font-bold" style={{ color: colors.numberText }}>{String(idx + 1).padStart(2, '0')}</div>
                  <h3 className="text-base font-semibold" style={{ color: colors.bodyText }}>{item.title || 'Tiêu đề'}</h3>
                  <p className="mt-1 text-sm" style={{ color: colors.mutedText }}>{item.description || 'Mô tả dịch vụ...'}</p>
                </div>
              </article>
            ))}
            {!isPreview && remainingForRuntime > 0 && (
              <div className="ml-16 text-sm font-medium" style={{ color: colors.plusTileText }}>+{remainingForRuntime} dịch vụ khác</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
