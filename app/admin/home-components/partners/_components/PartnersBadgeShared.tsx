"use client";

import React from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { PartnersLogoCloudModal } from './PartnersLogoCloudModal';

export type PartnerBadgeItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

type LayoutVariant = 'preview' | 'site';

const layoutByVariant: Record<LayoutVariant, {
  section: string;
  container: string;
  title: string;
  list: string;
  item: string;
  image: string;
  name: string;
  remaining: string;
}> = {
  preview: {
    section: 'w-full py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700',
    container: 'w-full max-w-7xl mx-auto px-4 md:px-6 space-y-4',
    title: 'text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 relative pl-3',
    list: 'w-full flex flex-wrap items-center justify-center gap-2.5',
    item: 'px-4 py-2.5 rounded-lg border flex items-center gap-2.5',
    image: 'h-7 w-auto',
    name: 'text-sm font-semibold truncate max-w-[120px]',
    remaining: 'px-4 py-2.5 rounded-lg border flex items-center gap-2.5',
  },
  site: {
    section: 'w-full py-10 bg-white border-b border-slate-200',
    container: 'w-full max-w-7xl mx-auto px-4 md:px-6 space-y-8',
    title: 'text-2xl font-bold tracking-tight text-slate-900 relative pl-4',
    list: 'w-full flex flex-wrap items-center justify-center gap-4',
    item: 'px-5 py-3 rounded-lg border transition-all flex items-center gap-3.5 group',
    image: 'h-6 w-auto',
    name: 'text-sm font-semibold',
    remaining: 'px-5 py-3 rounded-lg border flex items-center gap-3.5',
  },
};

export const PartnersBadgeShared = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  title,
  maxVisible = 6,
  renderImage,
  openInNewTab = false,
  className,
  variant = 'preview',
}: {
  items: PartnerBadgeItem[];
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  title?: string;
  maxVisible?: number;
  renderImage: (item: PartnerBadgeItem, className: string) => React.ReactNode;
  openInNewTab?: boolean;
  className?: string;
  variant?: LayoutVariant;
}) => {
  if (items.length === 0) {return null;}

  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const layout = layoutByVariant[variant];
  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <section className={cn(layout.section, className)}>
      <div className={layout.container}>
        <h2 className={layout.title} style={{ color: colors.headingText }}>
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
            style={{ backgroundColor: colors.headingAccent }}
          ></span>
          {title ?? 'Đối tác'}
        </h2>
        <div className={layout.list}>
          {visibleItems.map((item, idx) => (
            <a
              key={item.id ?? `${item.url ?? ''}-${idx}`}
              href={item.link || '#'}
              className={layout.item}
              style={{ backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }}
              {...linkProps}
            >
              {item.url
                ? renderImage(item, layout.image)
                : <ImageIcon size={20} className="text-slate-400" />}
              <span className={layout.name} style={{ color: colors.badgeText }}>
                {item.name ?? `Đối tác ${idx + 1}`}
              </span>
            </a>
          ))}
          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={cn(layout.remaining, 'transition-colors')}
              style={{ backgroundColor: colors.remainingBg, borderColor: colors.remainingBorder }}
              aria-label={`Xem tất cả ${remainingCount} đối tác`}
            >
              <Plus size={14} style={{ color: colors.remainingText }} />
              <span className="text-xs font-bold" style={{ color: colors.remainingText }}>+{remainingCount}</span>
              <span className="text-[10px] font-semibold" style={{ color: colors.remainingText }}>Xem tất cả</span>
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
