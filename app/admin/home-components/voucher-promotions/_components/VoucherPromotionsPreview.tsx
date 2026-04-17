'use client';

import React from 'react';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  VOUCHER_PROMOTIONS_STYLES,
} from '../_lib/constants';
import { getVoucherPromotionsValidationResult } from '../_lib/colors';
import { VoucherPromotionsSectionShared } from './VoucherPromotionsSectionShared';
import type {
  VoucherPromotionItem,
  VoucherPromotionsBrandMode,
  VoucherPromotionsConfig,
} from '../_types';
import {
  DEFAULT_VOUCHER_STYLE,
  normalizeVoucherLimit,
  normalizeVoucherStyle,
  type VoucherPromotionsStyle,
} from '@/lib/home-components/voucher-promotions';

interface VoucherPromotionsPreviewProps {
  config: VoucherPromotionsConfig;
  brandColor: string;
  secondary: string;
  mode?: VoucherPromotionsBrandMode;
  selectedStyle?: VoucherPromotionsStyle;
  limit?: number;
  onStyleChange?: (style: VoucherPromotionsStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const voucherSamples: VoucherPromotionItem[] = [
  {
    code: 'EGA50',
    name: 'Giảm 15% đơn từ 500K',
    description: 'Áp dụng cho tất cả sản phẩm',
    maxDiscountAmount: 250000,
    endDate: new Date('2026-12-28').getTime(),
    discountType: 'percent',
    discountValue: 15,
  },
  {
    code: 'EGAT10',
    name: 'Giảm 10% cho đơn 1 triệu',
    description: 'Không áp dụng combo',
    maxDiscountAmount: 300000,
    endDate: new Date('2026-12-30').getTime(),
    discountType: 'percent',
    discountValue: 10,
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển nội thành',
    description: 'Áp dụng đơn từ 500K',
    maxDiscountAmount: 50000,
    endDate: new Date('2026-12-31').getTime(),
    discountType: 'free_shipping',
  },
  {
    code: 'EGA500K',
    name: 'Giảm 90K cho đơn 1 triệu',
    description: 'Tối đa 1 mã/đơn',
    maxDiscountAmount: 90000,
    endDate: new Date('2026-12-31').getTime(),
    discountType: 'fixed',
    discountValue: 90000,
  },
  {
    code: 'VIP150',
    name: 'Ưu đãi khách VIP',
    description: 'Chỉ áp dụng khách VIP',
    maxDiscountAmount: 150000,
    endDate: new Date('2027-01-05').getTime(),
    discountType: 'fixed',
    discountValue: 150000,
  },
  {
    code: 'NEW100',
    name: 'Ưu đãi khách mới',
    description: 'Áp dụng khách đăng ký mới',
    maxDiscountAmount: 100000,
    endDate: new Date('2027-01-10').getTime(),
    discountType: 'fixed',
    discountValue: 100000,
  },
];

export const VoucherPromotionsPreview = ({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  limit,
  onStyleChange,
  fontStyle,
  fontClassName,
}: VoucherPromotionsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const previewStyle = normalizeVoucherStyle(selectedStyle ?? DEFAULT_VOUCHER_STYLE);
  const previewLimit = normalizeVoucherLimit(limit);

  const heading = config.texts?.heading || 'Voucher khuyến mãi';
  const description = config.texts?.description || 'Áp dụng mã để nhận ưu đãi tốt nhất hôm nay.';
  const ctaLabel = config.texts?.ctaLabel || 'Xem tất cả ưu đãi';
  const ctaUrl = config.ctaUrl?.trim() || '/promotions';

  const vouchers = React.useMemo(() => voucherSamples.slice(0, previewLimit), [previewLimit]);

  const validation = React.useMemo(() => getVoucherPromotionsValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  const handleCopy = React.useCallback((code: string) => {
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 1200);
  }, []);

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Voucher khuyến mãi"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(nextStyle) => onStyleChange?.(nextStyle as VoucherPromotionsStyle)}
        styles={VOUCHER_PROMOTIONS_STYLES}
        info={`${vouchers.length} voucher mẫu`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <VoucherPromotionsSectionShared
          context="preview"
          style={previewStyle}
          heading={heading}
          description={description}
          ctaLabel={ctaLabel}
          ctaUrl={ctaUrl}
          vouchers={vouchers}
          tokens={validation.tokens}
          copiedCode={copiedCode}
          onCopy={handleCopy}
          currentIndex={currentIndex}
          onCurrentIndexChange={setCurrentIndex}
          device={device}
        />
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={validation.tokens.primary}
          secondary={validation.resolvedSecondary}
          description="Màu phụ được áp dụng cho: copy button, badge, accent line, carousel indicators."
        />
      )}
    </div>
  );
};
