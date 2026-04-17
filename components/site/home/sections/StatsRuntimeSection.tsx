'use client';

import React from 'react';
import { getCardsColors, getCounterColors, getGradientColors, getHorizontalColors, getIconsColors, getMinimalColors } from '@/app/admin/home-components/stats/_lib/colors';
import type { StatsItem, StatsStyle } from '@/app/admin/home-components/stats/_types';
import type { HomeComponentSectionProps } from '../types';

export function StatsRuntimeSection({ config, brandColor, secondary, mode }: HomeComponentSectionProps) {
  const items = (config.items as StatsItem[]) || [];
  const style = (config.style as StatsStyle) || 'horizontal';

  if (style === 'horizontal') {
    const colors = getHorizontalColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="w-full rounded-lg shadow-sm overflow-hidden border" style={{ backgroundColor: 'white', borderColor: colors.border }}>
            <div className="flex flex-col md:flex-row items-center justify-between divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {items.map((item, idx) => (
                <div key={idx} className="flex-1 w-full py-6 px-4 flex flex-col items-center justify-center text-center cursor-default">
                  <span className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums leading-none mb-1" style={{ color: brandColor }}>
                    {item.value}
                  </span>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    {item.label}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'cards') {
    const colors = getCardsColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white border rounded-xl p-5 flex flex-col items-center text-center shadow-sm" style={{ borderColor: colors.border }}>
                <span className="text-3xl font-bold mb-1 tracking-tight tabular-nums" style={{ color: brandColor }}>
                  {item.value}
                </span>
                <h3 className="text-sm font-semibold text-slate-700">{item.label}</h3>
                <div className="w-8 h-0.5 rounded-full mt-3" style={{ backgroundColor: colors.accent }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'icons') {
    const colors = getIconsColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-3 border shadow-sm" style={{ backgroundColor: colors.circleBg, borderColor: colors.ring }}>
                  <span className="text-2xl md:text-3xl font-bold tracking-tight z-10 tabular-nums" style={{ color: colors.textOnCircle }}>
                    {item.value}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-800" style={{ color: colors.label }}>
                  {item.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'gradient') {
    const colors = getGradientColors(brandColor, secondary, mode);
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden border" style={{ background: colors.background, borderColor: colors.border }}>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {items.map((item, idx) => (
                <div key={idx} className={`relative flex flex-col items-center justify-center text-center p-6 md:p-8 ${idx !== items.length - 1 ? 'md:border-r md:border-white/10' : ''}`}>
                  <span className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums leading-none mb-2" style={{ color: colors.text }}>
                    {item.value}
                  </span>
                  <h3 className="text-sm font-medium opacity-90 relative z-10" style={{ color: colors.label }}>
                    {item.label}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    const colors = getMinimalColors(brandColor, secondary, mode);
    return (
      <section className="py-12 md:py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-start">
                <div className="w-12 h-1 rounded-full mb-4" style={{ backgroundColor: colors.accent }} />
                <span className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums leading-none" style={{ color: colors.value }}>
                  {item.value}
                </span>
                <h3 className="text-base font-medium text-slate-500 mt-2">{item.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const colors = getCounterColors(brandColor, secondary, mode);
  return (
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="relative bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: colors.border }}>
              <div className="h-1 w-full bg-slate-100">
                <div className="h-full transition-all duration-500" style={{ backgroundColor: colors.progress, width: `${Math.min(100, (idx + 1) * 25)}%` }} />
              </div>
              <div className="flex flex-col items-center justify-center text-center p-6">
                <span className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums leading-none" style={{ color: colors.value }}>
                  {item.value}
                </span>
                <h3 className="text-sm font-semibold text-slate-600 mt-2">{item.label}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
