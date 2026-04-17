"use client";

import React from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { PartnersLogoCloudModal } from './PartnersLogoCloudModal';

export type PartnerGridItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

export const PartnersGridShared = ({
  items,
  title,
  brandColor,
  secondary,
  mode = 'dual',
  maxVisible = 8,
  columnsClassName = 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8',
  openInNewTab = false,
  renderImage,
  className,
}: {
  items: PartnerGridItem[];
  title?: string;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  maxVisible?: number;
  columnsClassName?: string;
  openInNewTab?: boolean;
  renderImage: (item: PartnerGridItem, className: string) => React.ReactNode;
  className?: string;
}) => {
  if (items.length === 0) {return null;}

  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const hasRemaining = items.length > maxVisible;
  const visibleCount = hasRemaining ? maxVisible - 1 : maxVisible;
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = items.length - visibleCount;
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <section className={cn('w-full py-10 bg-white border-b border-slate-200', className)}>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight relative pl-4" style={{ color: colors.headingText }}>
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
            style={{ backgroundColor: colors.headingAccent }}
          ></span>
          {title ?? 'Đối tác'}
        </h2>
        <div className={cn('grid gap-8 items-center justify-items-center', columnsClassName)}>
          {visibleItems.map((item, idx) => (
            <a
              key={item.id ?? `${item.url ?? ''}-${idx}`}
              href={item.link ?? '#'}
              className="w-full flex items-center justify-center p-4 rounded-xl border transition-colors duration-300 cursor-pointer group"
              style={{ borderColor: colors.itemBorder, backgroundColor: colors.itemBg }}
              {...linkProps}
            >
              {item.url ? (
                renderImage(item, 'h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110')
              ) : (
                <ImageIcon size={40} className="text-slate-300" />
              )}
            </a>
          ))}
          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-colors"
              style={{ backgroundColor: colors.remainingBg, borderColor: colors.remainingBorder }}
              aria-label={`Xem tất cả ${remainingCount} đối tác`}
            >
              <Plus size={20} style={{ color: colors.remainingText }} />
              <span className="text-sm font-semibold" style={{ color: colors.remainingText }}>+{remainingCount}</span>
              <span className="text-xs mt-1" style={{ color: colors.remainingText }}>Xem tất cả</span>
            </button>
          )}
        </div>
      </div>
      <PartnersLogoCloudModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        items={items}
        title={title ?? 'Đối tác'}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        openInNewTab={openInNewTab}
        renderImage={renderImage}
      />
    </section>
  );
};
