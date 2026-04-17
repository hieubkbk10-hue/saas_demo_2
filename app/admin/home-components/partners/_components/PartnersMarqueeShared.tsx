"use client";

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../components/ui';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';

export type PartnerMarqueeItem = {
  id?: string | number;
  url?: string;
  link?: string;
  name?: string;
};

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>{  setPrefersReducedMotion(mediaQuery.matches); };

    update();
    mediaQuery.addEventListener('change', update);
    return () =>{  mediaQuery.removeEventListener('change', update); };
  }, []);

  return prefersReducedMotion;
};

const normalizeItems = (items: PartnerMarqueeItem[]) => {
  const seen = new Set<string>();

  return items
    .filter(item => item.url)
    .filter((item) => {
      const key = `${item.url ?? ''}::${item.link ?? ''}`;
      if (seen.has(key)) {return false;}
      seen.add(key);
      return true;
    });
};

export const PartnersMarqueeShared = ({
  items,
  title,
  brandColor,
  secondary,
  mode = 'dual',
  variant = 'marquee',
  speed = 0.8,
  renderImage,
  openInNewTab = false,
  className,
}: {
  items: PartnerMarqueeItem[];
  title?: string;
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  variant?: 'marquee' | 'mono';
  speed?: number;
  renderImage: (item: PartnerMarqueeItem, className: string) => React.ReactNode;
  openInNewTab?: boolean;
  className?: string;
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const normalizedItems = React.useMemo(() => normalizeItems(items), [items]);
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const itemCount = normalizedItems.length;
  const shouldAnimate = itemCount > 1 && !prefersReducedMotion;
  const loopCount = shouldAnimate ? 2 : 1;
  const speedMultiplier = itemCount >= 18 ? 1.2 : itemCount >= 12 ? 1.1 : 1;
  const effectiveSpeed = Math.max(0.6, speed * speedMultiplier);
  const baseDuration = 36;
  const duration = Math.max(18, baseDuration / effectiveSpeed);
  const [isPaused, setIsPaused] = React.useState(false);

  if (normalizedItems.length === 0) {return null;}

  const logoClassName = cn(
    'h-11 md:h-12 w-auto object-contain select-none transition-all duration-500',
    variant === 'mono'
      ? 'grayscale group-hover:grayscale-0'
      : 'group-hover:scale-110'
  );

  const placeholderClassName = cn(
    'h-11 md:h-12 w-24 rounded flex items-center justify-center',
    variant === 'mono' ? '' : 'hover:scale-105'
  );

  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <section className={cn('w-full py-8 bg-white border-b border-slate-200', className)} style={{ borderColor: colors.neutralBorder }}>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <h2 className="text-2xl font-bold tracking-tight relative pl-4" style={{ color: colors.headingText }}>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full" style={{ backgroundColor: colors.headingAccent }}></span>
            {title ?? 'Đối tác'}
          </h2>
        </div>
        <div className="w-full relative py-6">
          <div
            className={cn(
              'w-full no-scrollbar',
              shouldAnimate ? 'overflow-hidden' : 'overflow-x-auto touch-pan-x'
            )}
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            onMouseEnter={() =>{  setIsPaused(true); }}
            onMouseLeave={() =>{  setIsPaused(false); }}
            onTouchStart={() =>{  setIsPaused(true); }}
            onTouchEnd={() =>{  setIsPaused(false); }}
            onFocusCapture={() =>{  setIsPaused(true); }}
            onBlurCapture={() =>{  setIsPaused(false); }}
          >
            <style>{`@keyframes partners-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            <div
              className="flex w-max items-center gap-8 md:gap-10 px-4"
              style={shouldAnimate ? { animation: `partners-marquee ${duration}s linear infinite`, animationPlayState: isPaused ? 'paused' : 'running' } : undefined}
            >
              {Array.from({ length: loopCount }).map((_, loopIndex) => (
                <div key={`loop-${loopIndex}`} className="flex shrink-0 items-center gap-8 md:gap-10">
                  {normalizedItems.map((item, index) => {
                    const keyBase = item.id ?? item.url ?? item.name ?? index;
                    return (
                      <a
                        key={`${loopIndex}-${keyBase}`}
                        href={item.link ?? '#'}
                        className="shrink-0 group"
                        {...linkProps}
                      >
                        {item.url
                          ? renderImage(item, logoClassName)
                          : (
                            <div className={placeholderClassName} style={{ backgroundColor: colors.itemBgMuted, border: `1px solid ${colors.neutralBorder}` }}>
                              <ImageIcon size={24} className="text-slate-400" />
                            </div>
                          )}
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
