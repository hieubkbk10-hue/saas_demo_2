'use client';

import React from 'react';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { STATS_STYLES } from '../_lib/constants';
import {
  getCardsColors,
  getCounterColors,
  getGradientColors,
  getHorizontalColors,
  getIconsColors,
  getMinimalColors,
} from '../_lib/colors';
import type { StatsBrandMode, StatsItem, StatsStyle } from '../_types';

export const StatsPreview = ({
  items,
  brandColor,
  secondary,
  mode,
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
}: {
  items: StatsItem[];
  brandColor: string;
  secondary: string;
  mode: StatsBrandMode;
  selectedStyle?: StatsStyle;
  onStyleChange?: (style: StatsStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const previewStyle = selectedStyle ?? 'horizontal';
  const setPreviewStyle = (style: string) => onStyleChange?.(style as StatsStyle);
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  const info = `${items.filter((item) => item.value || item.label).length} số liệu • ${modeLabel}`;

  const renderHorizontalStyle = () => {
    const colors = getHorizontalColors(brandColor, secondary, mode);
    return (
    <section className="w-full rounded-lg shadow-sm overflow-hidden border" style={{ backgroundColor: 'white', borderColor: colors.border }}>
      <div className={cn(
        "flex items-center justify-between",
        device === 'mobile' ? 'flex-col divide-y' : 'flex-row divide-x',
        "divide-slate-200"
      )}>
        {items.slice(0, device === 'mobile' ? 2 : 4).map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex-1 w-full flex flex-col items-center justify-center text-center cursor-default",
              device === 'mobile' ? 'py-5 px-4' : 'py-6 px-4'
            )}
          >
            <span className={cn(
              "font-bold tracking-tight tabular-nums leading-none mb-1",
              device === 'mobile' ? 'text-2xl' : 'text-3xl md:text-4xl'
            )} style={{ color: brandColor }}>
              {item.value || '0'}
            </span>
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-600">
              {item.label || 'Label'}
            </h3>
          </div>
        ))}
      </div>
    </section>
    );
  };

  const renderCardsStyle = () => {
    const colors = getCardsColors(brandColor, secondary, mode);
    return (
    <section className={cn("w-full", device === 'mobile' ? 'p-3' : 'p-4')}>
      <div className={cn("grid gap-4", device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4')}>
        {items.slice(0, 4).map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 border rounded-xl p-5 flex flex-col items-center text-center shadow-sm"
            style={{ borderColor: colors.border }}
          >
            <span
              className={cn(
                "font-bold mb-1 tracking-tight tabular-nums",
                device === 'mobile' ? 'text-2xl' : 'text-3xl'
              )}
              style={{ color: brandColor }}
            >
              {item.value || '0'}
            </span>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {item.label || 'Label'}
            </h3>
            <div className="w-8 h-0.5 rounded-full mt-3" style={{ backgroundColor: colors.accent }} />
          </div>
        ))}
      </div>
    </section>
    );
  };

  const renderIconsStyle = () => {
    const colors = getIconsColors(brandColor, secondary, mode);
    return (
    <section className={cn("w-full", device === 'mobile' ? 'py-4 px-3' : 'py-6 px-4')}>
      <div className={cn("grid gap-6", device === 'mobile' ? 'grid-cols-2 gap-4' : 'grid-cols-4 md:gap-8')}>
        {items.slice(0, 4).map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div
              className={cn(
                "relative rounded-full flex items-center justify-center mb-3 border shadow-sm",
                device === 'mobile' ? 'w-20 h-20' : 'w-24 h-24 md:w-28 md:h-28'
              )}
              style={{
                backgroundColor: colors.circleBg,
                borderColor: colors.ring,
              }}
            >
              <span
                className={cn(
                  "font-bold tracking-tight z-10 tabular-nums",
                  device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
                )}
                style={{ color: colors.textOnCircle }}
              >
                {item.value || '0'}
              </span>
            </div>
            <h3
              className={cn(
                "font-semibold text-slate-800 dark:text-slate-200",
                device === 'mobile' ? 'text-sm' : 'text-base'
              )}
              style={{ color: colors.label }}
            >
              {item.label || 'Label'}
            </h3>
          </div>
        ))}
      </div>
    </section>
    );
  };

  const renderGradientStyle = () => {
    const colors = getGradientColors(brandColor, secondary, mode);
    return (
    <section className={cn("w-full", device === 'mobile' ? 'p-3' : 'p-6')}>
      <div
        className="rounded-2xl overflow-hidden border"
        style={{
          background: colors.background,
          borderColor: colors.border
        }}
      >
        <div className={cn(
          "grid",
          device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'
        )}>
          {items.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "relative flex flex-col items-center justify-center text-center p-6",
                device === 'mobile' ? 'p-4' : 'p-8',
                idx !== items.slice(0, 4).length - 1 && (device === 'mobile' ? '' : 'border-r border-white/10')
              )}
            >
              <span
                className={cn(
                  "font-extrabold tracking-tight tabular-nums leading-none mb-2",
                  device === 'mobile' ? 'text-3xl' : 'text-4xl md:text-5xl'
                )}
                style={{ color: colors.text }}
              >
                {item.value || '0'}
              </span>
              <h3
                className={cn(
                  "font-medium opacity-90 relative z-10",
                  device === 'mobile' ? 'text-xs' : 'text-sm'
                )}
                style={{ color: colors.label }}
              >
                {item.label || 'Label'}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
    );
  };

  const renderMinimalStyle = () => {
    const colors = getMinimalColors(brandColor, secondary, mode);
    return (
    <section className={cn("w-full bg-slate-50 dark:bg-slate-900", device === 'mobile' ? 'py-8 px-4' : 'py-12 px-6')}>
      <div className={cn(
        "max-w-5xl mx-auto grid",
        device === 'mobile' ? 'grid-cols-2 gap-6' : 'grid-cols-4 gap-8'
      )}>
        {items.slice(0, 4).map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-start"
          >
            <div
              className="w-12 h-1 rounded-full mb-4"
              style={{ backgroundColor: colors.accent }}
            />
            <span
              className={cn(
                "font-bold tracking-tight tabular-nums leading-none text-slate-900 dark:text-white",
                device === 'mobile' ? 'text-3xl' : 'text-4xl md:text-5xl'
              )}
              style={{ color: colors.value }}
            >
              {item.value || '0'}
            </span>
            <h3 className={cn(
              "font-medium text-slate-500 dark:text-slate-400 mt-2",
              device === 'mobile' ? 'text-sm' : 'text-base'
            )}>
              {item.label || 'Label'}
            </h3>
          </div>
        ))}
      </div>
    </section>
    );
  };

  const renderCounterStyle = () => {
    const colors = getCounterColors(brandColor, secondary, mode);
    return (
    <section className={cn("w-full", device === 'mobile' ? 'py-6 px-3' : 'py-10 px-6')}>
      <div className={cn(
        "max-w-5xl mx-auto grid",
        device === 'mobile' ? 'grid-cols-2 gap-4' : 'grid-cols-4 gap-6'
      )}>
        {items.slice(0, 4).map((item, idx) => (
          <div
            key={idx}
            className="relative bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-sm"
            style={{ borderColor: colors.border }}
          >
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full transition-all duration-500"
                style={{
                  backgroundColor: colors.progress,
                  width: `${Math.min(100, (idx + 1) * 25)}%`
                }}
              />
            </div>

            <div className={cn(
              "flex flex-col items-center justify-center text-center",
              device === 'mobile' ? 'p-4' : 'p-6'
            )}>
              <span
                className={cn(
                  "font-black tracking-tighter tabular-nums leading-none",
                  device === 'mobile' ? 'text-4xl' : 'text-5xl md:text-6xl'
                )}
                style={{ color: colors.value }}
              >
                {item.value || '0'}
              </span>
              <h3 className={cn(
                "font-semibold text-slate-600 dark:text-slate-300 mt-2",
                device === 'mobile' ? 'text-xs' : 'text-sm'
              )}>
                {item.label || 'Label'}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
    );
  };

  return (
    <>
      <PreviewWrapper
        title="Preview Stats"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={STATS_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {previewStyle === 'horizontal' && renderHorizontalStyle()}
          {previewStyle === 'cards' && renderCardsStyle()}
          {previewStyle === 'icons' && renderIconsStyle()}
          {previewStyle === 'gradient' && renderGradientStyle()}
          {previewStyle === 'minimal' && renderMinimalStyle()}
          {previewStyle === 'counter' && renderCounterStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
    </>
  );
};
