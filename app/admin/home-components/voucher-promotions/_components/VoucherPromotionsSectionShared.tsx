'use client';

import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { VoucherPromotionItem, VoucherPromotionsStyle } from '../_types';
import type { VoucherPromotionsColorTokens } from '../_lib/colors';
import { formatVoucherExpiry } from '@/lib/home-components/voucher-promotions';

interface VoucherPromotionsSectionSharedProps {
  context: 'preview' | 'site';
  style: VoucherPromotionsStyle;
  heading: string;
  description: string;
  ctaLabel?: string;
  ctaUrl?: string;
  vouchers: VoucherPromotionItem[];
  tokens: VoucherPromotionsColorTokens;
  copiedCode?: string | null;
  onCopy?: (code: string) => void;
  currentIndex?: number;
  onCurrentIndexChange?: (index: number) => void;
  device?: PreviewDevice;
}

const clampByDevice = (device: PreviewDevice | undefined, desktop: number, tablet: number, mobile: number) => {
  if (device === 'mobile') {return mobile;}
  if (device === 'tablet') {return tablet;}
  return desktop;
};

const formatDiscount = (voucher: VoucherPromotionItem) => {
  if (voucher.discountType === 'percent' && voucher.discountValue) {
    return `Giảm ${voucher.discountValue}%`;
  }
  if (voucher.discountType === 'fixed' && voucher.discountValue) {
    return `Giảm ${voucher.discountValue.toLocaleString('vi-VN')}đ`;
  }
  if (voucher.discountType === 'free_shipping') {
    return 'Miễn phí vận chuyển';
  }
  return 'Ưu đãi đặc biệt';
};

const formatMaxDiscount = (voucher: VoucherPromotionItem) => {
  if (!voucher.maxDiscountAmount) {
    return '';
  }
  return `Tối đa ${voucher.maxDiscountAmount.toLocaleString('vi-VN')}đ`;
};

const CopyButton = ({
  code,
  copiedCode,
  onCopy,
  tokens,
  fullWidth = false,
}: {
  code: string;
  copiedCode?: string | null;
  onCopy?: (code: string) => void;
  tokens: VoucherPromotionsColorTokens;
  fullWidth?: boolean;
}) => (
  <button
    type="button"
    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${fullWidth ? 'w-full' : ''}`}
    style={{
      backgroundColor: tokens.copyButtonBg,
      borderColor: tokens.copyButtonBorder,
      color: tokens.copyButtonText,
    }}
    onClick={() => onCopy?.(code)}
  >
    {copiedCode === code ? 'Đã sao chép' : 'Sao chép mã'}
  </button>
);

const Header = ({
  heading,
  description,
  ctaLabel,
  ctaUrl,
  align,
  tokens,
}: {
  heading: string;
  description: string;
  ctaLabel?: string;
  ctaUrl?: string;
  align: 'left' | 'center';
  tokens: VoucherPromotionsColorTokens;
}) => (
  <div className={`space-y-2 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <h2 className="text-2xl md:text-3xl font-bold" style={{ color: tokens.heading }}>{heading}</h2>
    <p style={{ color: tokens.description }}>{description}</p>
    {ctaLabel && ctaUrl && (
      <a
        href={ctaUrl}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm md:text-base font-semibold border transition-colors"
        style={{
          color: tokens.ctaOutlineText,
          borderColor: tokens.ctaOutlineBorder,
          backgroundColor: tokens.ctaOutlineBg,
        }}
      >
        {ctaLabel}
        <ArrowRight size={16} />
      </a>
    )}
  </div>
);

const VoucherMeta = ({ voucher, tokens }: { voucher: VoucherPromotionItem; tokens: VoucherPromotionsColorTokens }) => (
  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: tokens.mutedText }}>
    <span>{formatDiscount(voucher)}</span>
    {formatMaxDiscount(voucher) && <span>• {formatMaxDiscount(voucher)}</span>}
    {voucher.endDate && <span>• Hết hạn {formatVoucherExpiry(voucher.endDate)}</span>}
  </div>
);

export function VoucherPromotionsSectionShared({
  context,
  style,
  heading,
  description,
  ctaLabel,
  ctaUrl,
  vouchers,
  tokens,
  copiedCode,
  onCopy,
  currentIndex = 0,
  onCurrentIndexChange,
  device,
}: VoucherPromotionsSectionSharedProps) {
  if (vouchers.length === 0) {
    return null;
  }

  const normalizedIndex = ((currentIndex % vouchers.length) + vouchers.length) % vouchers.length;
  const visibleCards = clampByDevice(device, 4, 2, 1);
  const visibleCoupons = clampByDevice(device, 2, 2, 1);

  const nextIndex = (index: number) => {
    if (!onCurrentIndexChange) {return;}
    onCurrentIndexChange(((index % vouchers.length) + vouchers.length) % vouchers.length);
  };

  const wrapper = (content: React.ReactNode) => {
    if (context === 'preview') {
      return <BrowserFrame>{content}</BrowserFrame>;
    }
    return content;
  };

  if (style === 'ticketHorizontal') {
    return wrapper(
      <section className="py-8 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <Header heading={heading} description={description} ctaLabel={ctaLabel} ctaUrl={ctaUrl} align="left" tokens={tokens} />
          <div className="space-y-4">
            {vouchers.map((voucher) => (
              <div key={voucher.code} className="relative rounded-2xl border overflow-hidden" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                <div className="absolute left-24 top-3 bottom-3 w-px border-l border-dashed" style={{ borderColor: tokens.neutralBorder }} />
                <div className="flex">
                  <div className="w-24 shrink-0 flex flex-col items-center justify-center py-4" style={{ backgroundColor: tokens.ticketStripeBg, color: tokens.ticketCodeText }}>
                    <span className="text-[10px] uppercase tracking-wider">Mã</span>
                    <span className="text-base font-bold">{voucher.code}</span>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{voucher.name}</div>
                      {voucher.description && <p className="text-xs mt-1" style={{ color: tokens.mutedText }}>{voucher.description}</p>}
                      <VoucherMeta voucher={voucher} tokens={tokens} />
                    </div>
                    <CopyButton code={voucher.code} copiedCode={copiedCode} onCopy={onCopy} tokens={tokens} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'couponGrid') {
    return wrapper(
      <section className="py-8 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <Header heading={heading} description={description} ctaLabel={ctaLabel} ctaUrl={ctaUrl} align="center" tokens={tokens} />
          <div className={`grid gap-4 ${visibleCoupons === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {vouchers.map((voucher) => (
              <div key={voucher.code} className="rounded-2xl border overflow-hidden" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                <div className="flex h-full">
                  <div className="w-1" style={{ backgroundColor: tokens.accentLine }} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider" style={{ color: tokens.badgeText }}>Voucher</div>
                        <div className="text-xl font-bold" style={{ color: tokens.bodyText }}>{voucher.code}</div>
                        <div className="text-sm font-medium" style={{ color: tokens.bodyText }}>{voucher.name}</div>
                      </div>
                      <CopyButton code={voucher.code} copiedCode={copiedCode} onCopy={onCopy} tokens={tokens} />
                    </div>
                    {voucher.description && <p className="text-xs mt-2" style={{ color: tokens.mutedText }}>{voucher.description}</p>}
                    <VoucherMeta voucher={voucher} tokens={tokens} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'stackedBanner') {
    return wrapper(
      <section className="py-8 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <Header heading={heading} description={description} ctaLabel={ctaLabel} ctaUrl={ctaUrl} align="left" tokens={tokens} />
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.accentSoft }}>
            {vouchers.map((voucher, index) => (
              <div
                key={voucher.code}
                className={`flex items-center justify-between gap-4 px-4 py-4 ${index < vouchers.length - 1 ? 'border-b border-dashed' : ''}`}
                style={index < vouchers.length - 1 ? { borderColor: tokens.neutralBorder } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: tokens.badgeBg }}>
                    <Tag size={18} style={{ color: tokens.badgeText }} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: tokens.badgeText }}>Voucher</div>
                    <div className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{voucher.code} • {voucher.name}</div>
                    {voucher.description && <div className="text-xs mt-1" style={{ color: tokens.mutedText }}>{voucher.description}</div>}
                    <VoucherMeta voucher={voucher} tokens={tokens} />
                  </div>
                </div>
                <CopyButton code={voucher.code} copiedCode={copiedCode} onCopy={onCopy} tokens={tokens} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'carousel') {
    return wrapper(
      <section className="py-8 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <Header heading={heading} description={description} ctaLabel={ctaLabel} ctaUrl={ctaUrl} align="left" tokens={tokens} />
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
              {vouchers.map((voucher, index) => (
                <div
                  key={voucher.code}
                  className={`min-w-[260px] max-w-[260px] snap-start rounded-2xl border p-4 shadow-sm ${index === normalizedIndex ? 'ring-2' : ''}`}
                  style={{
                    borderColor: tokens.cardBorder,
                    backgroundColor: tokens.cardBg,
                    ...(index === normalizedIndex ? { boxShadow: `0 0 0 2px ${tokens.carouselRing}` } : {}),
                  }}
                >
                  <div className="h-2 w-16 rounded-full" style={{ backgroundColor: tokens.accentLine }} />
                  <div className="mt-4 text-xs uppercase tracking-wider" style={{ color: tokens.badgeText }}>Voucher</div>
                  <div className="text-xl font-bold" style={{ color: tokens.bodyText }}>{voucher.code}</div>
                  <div className="text-sm font-medium mt-1" style={{ color: tokens.bodyText }}>{voucher.name}</div>
                  {voucher.description && <p className="text-xs mt-2" style={{ color: tokens.mutedText }}>{voucher.description}</p>}
                  <VoucherMeta voucher={voucher} tokens={tokens} />
                  <div className="mt-4">
                    <CopyButton code={voucher.code} copiedCode={copiedCode} onCopy={onCopy} tokens={tokens} fullWidth />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                {vouchers.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => nextIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === normalizedIndex ? 'w-6' : 'w-2'}`}
                    style={{ backgroundColor: index === normalizedIndex ? tokens.carouselDotActive : tokens.carouselDotInactive }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => nextIndex(normalizedIndex - 1)}
                  className="h-8 w-8 rounded-full border flex items-center justify-center"
                  style={{ borderColor: tokens.neutralBorder, color: tokens.ctaOutlineText }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => nextIndex(normalizedIndex + 1)}
                  className="h-8 w-8 rounded-full border flex items-center justify-center"
                  style={{ borderColor: tokens.neutralBorder, color: tokens.ctaOutlineText }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    return wrapper(
      <section className="py-8 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-1 w-16 rounded-full" style={{ backgroundColor: tokens.accentLine }} />
          <Header heading={heading} description={description} ctaLabel={ctaLabel} ctaUrl={ctaUrl} align="left" tokens={tokens} />
          <div className="space-y-3">
            {vouchers.map((voucher, index) => (
              <div key={voucher.code} className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-semibold" style={{ color: tokens.mutedText }}>{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{voucher.code} • {voucher.name}</div>
                    {voucher.description && <div className="text-xs mt-1" style={{ color: tokens.mutedText }}>{voucher.description}</div>}
                    <VoucherMeta voucher={voucher} tokens={tokens} />
                  </div>
                </div>
                <CopyButton code={voucher.code} copiedCode={copiedCode} onCopy={onCopy} tokens={tokens} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return wrapper(
    <section className="py-8 px-4" style={{ backgroundColor: tokens.sectionBg }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <Header heading={heading} description={description} ctaLabel={ctaLabel} ctaUrl={ctaUrl} align="center" tokens={tokens} />
        <div className={`grid gap-4 ${visibleCards === 1 ? 'grid-cols-1' : (visibleCards === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')}`}>
          {vouchers.map((voucher) => (
            <div key={voucher.code} className="rounded-2xl border p-4" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: tokens.badgeBg }}>
                    {voucher.thumbnail ? (
                      <PreviewImage
                        src={voucher.thumbnail}
                        alt={voucher.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Tag size={18} style={{ color: tokens.badgeText }} />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tokens.badgeText }}>Voucher</div>
                    <div className="text-lg font-bold" style={{ color: tokens.bodyText }}>{voucher.code}</div>
                    <div className="text-xs" style={{ color: tokens.mutedText }}>{voucher.name}</div>
                  </div>
                </div>
                <CopyButton code={voucher.code} copiedCode={copiedCode} onCopy={onCopy} tokens={tokens} />
              </div>
              <VoucherMeta voucher={voucher} tokens={tokens} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
