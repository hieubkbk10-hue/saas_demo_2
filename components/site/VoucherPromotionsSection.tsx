'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { normalizeVoucherLimit, normalizeVoucherStyle } from '@/lib/home-components/voucher-promotions';
import {
  normalizeVoucherPromotionsTexts,
} from '@/app/admin/home-components/voucher-promotions/_lib/constants';
import { getVoucherPromotionsColorTokens } from '@/app/admin/home-components/voucher-promotions/_lib/colors';
import { VoucherPromotionsSectionShared } from '@/app/admin/home-components/voucher-promotions/_components/VoucherPromotionsSectionShared';
import type {
  VoucherPromotionItem,
  VoucherPromotionsBrandMode,
  VoucherPromotionsTexts,
} from '@/app/admin/home-components/voucher-promotions/_types';

interface VoucherPromotionsSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: VoucherPromotionsBrandMode;
  title: string;
}

export function VoucherPromotionsSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: VoucherPromotionsSectionProps) {
  const texts = normalizeVoucherPromotionsTexts({
    heading: (config.texts as VoucherPromotionsTexts | undefined)?.heading ?? (config.heading as string | undefined),
    description: (config.texts as VoucherPromotionsTexts | undefined)?.description ?? (config.description as string | undefined),
    ctaLabel: (config.texts as VoucherPromotionsTexts | undefined)?.ctaLabel ?? (config.ctaLabel as string | undefined),
  });

  const heading = texts.heading || title || 'Voucher khuyến mãi';
  const description = texts.description;
  const ctaLabel = texts.ctaLabel;
  const ctaUrl = (config.ctaUrl as string) || '/promotions';
  const limit = normalizeVoucherLimit(config.limit as number | undefined);
  const style = normalizeVoucherStyle(config.style as string | undefined);

  const vouchers = useQuery(api.promotions.listPublicVouchers, { limit }) as VoucherPromotionItem[] | undefined;
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const tokens = React.useMemo(() => getVoucherPromotionsColorTokens({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  if (!vouchers) {
    return null;
  }

  if (vouchers.length === 0) {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto text-center">
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-slate-200 p-3">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có voucher nào</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Component này sẽ hiển thị khi có ít nhất 1 promotion với:
                  <br />• Status = "Active"
                  <br />• Có mã voucher (code)
                  <br />• Chưa hết hạn
                </p>
                <p className="text-sm text-slate-600 mt-3">
                  Vào <a href="/admin/promotions" className="text-blue-600 hover:underline font-medium">Quản lý Promotions</a> để tạo voucher mới.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 1800);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <VoucherPromotionsSectionShared
      context="site"
      style={style}
      heading={heading}
      description={description}
      ctaLabel={ctaLabel}
      ctaUrl={ctaUrl}
      vouchers={vouchers}
      tokens={tokens}
      copiedCode={copiedCode}
      onCopy={(code) => {
        void handleCopy(code);
      }}
      currentIndex={currentIndex}
      onCurrentIndexChange={setCurrentIndex}
    />
  );
}
