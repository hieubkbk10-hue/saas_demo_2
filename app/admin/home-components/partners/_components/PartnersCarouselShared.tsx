"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';

type CarouselDevice = 'desktop' | 'tablet' | 'mobile';

type PartnersCarouselItem = {
  id?: string | number;
  url: string;
  link?: string;
  name?: string;
};

export const PartnersCarouselShared = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  title,
  device,
  openInNewTab = false,
  renderImage,
  className,
}: {
  items: PartnersCarouselItem[];
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  title?: string;
  device?: CarouselDevice;
  openInNewTab?: boolean;
  renderImage?: (item: PartnersCarouselItem, className: string) => React.ReactNode;
  className?: string;
}) => {
  const [localDevice, setLocalDevice] = React.useState<CarouselDevice>('desktop');
  const [pageIndex, setPageIndex] = React.useState(0);
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);

  React.useEffect(() => {
    if (device) {return;}

    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setLocalDevice('mobile');
        return;
      }
      if (width < 1024) {
        setLocalDevice('tablet');
        return;
      }
      setLocalDevice('desktop');
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, [device]);

  const resolvedDevice = device ?? localDevice;
  const itemsPerPage = resolvedDevice === 'mobile' ? 2 : (resolvedDevice === 'tablet' ? 4 : 6);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  React.useEffect(() => {
    setPageIndex(0);
  }, [items.length, itemsPerPage]);

  if (items.length === 0) {
    return (
      <section className={cn('w-full py-6 bg-white dark:bg-slate-900', className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: colors.iconBg }}>
            <ImageIcon size={28} style={{ color: colors.iconColor }} />
          </div>
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có đối tác nào</h3>
          <p className="text-sm text-slate-500">Thêm logo đối tác đầu tiên</p>
        </div>
      </section>
    );
  }

  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const startIndex = safePageIndex * itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerPage);
  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;

  return (
    <section className={cn('w-full py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700', className)}>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight relative pl-3" style={{ color: colors.headingText }}>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ backgroundColor: colors.headingAccent }}></span>
            {title ?? 'Đối tác'}
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>{  setPageIndex(prev => Math.max(0, prev - 1)); }}
                disabled={!canPrev}
                className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30"
                style={{ borderColor: colors.navBorder, color: colors.navText, backgroundColor: colors.navBg }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-slate-500 tabular-nums">{safePageIndex + 1}/{totalPages}</span>
              <button
                type="button"
                onClick={() =>{  setPageIndex(prev => Math.min(totalPages - 1, prev + 1)); }}
                disabled={!canNext}
                className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30"
                style={{ borderColor: colors.navBorder, color: colors.navText, backgroundColor: colors.navBg }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className={cn('grid gap-3 items-center', resolvedDevice === 'mobile' ? 'grid-cols-2' : (resolvedDevice === 'tablet' ? 'grid-cols-4' : 'grid-cols-6'))}>
          {visibleItems.map((item, index) => {
            const key = item.id ?? item.link ?? index;
            return (
              <a
                key={key}
                href={item.link || '#'}
                target={openInNewTab ? '_blank' : undefined}
                rel={openInNewTab ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-center p-3 rounded-lg border aspect-[3/2]"
                style={{ backgroundColor: colors.itemBg, borderColor: colors.itemBorder }}
              >
                {item.url ? (
                  renderImage ? renderImage(item, 'h-11 w-auto object-contain') : <ImageIcon size={32} className="text-slate-300" />
                ) : (
                  <ImageIcon size={32} className="text-slate-300" />
                )}
              </a>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() =>{  setPageIndex(idx); }}
                className={cn('h-1.5 rounded-full', idx === safePageIndex ? 'w-5' : 'w-1.5')}
                style={idx === safePageIndex ? { backgroundColor: colors.dotActive } : { backgroundColor: colors.dotInactive }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
