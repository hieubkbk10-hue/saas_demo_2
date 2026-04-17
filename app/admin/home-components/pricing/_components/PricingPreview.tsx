'use client';

import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  PRICING_STYLES,
} from '../_lib/constants';
import {
  getPricingValidationResult,
} from '../_lib/colors';
import { PricingSectionShared } from './PricingSectionShared';
import type {
  PricingBrandMode,
  PricingConfig,
  PricingPlan,
  PricingStyle,
} from '../_types';

interface PricingPreviewProps {
  title?: string;
  plans: PricingPlan[];
  config?: Partial<PricingConfig>;
  brandColor: string;
  secondary: string;
  mode?: PricingBrandMode;
  selectedStyle?: PricingStyle;
  onStyleChange?: (style: PricingStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export function PricingPreview({
  title = 'Bảng giá',
  plans,
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'cards',
  onStyleChange,
  fontStyle,
  fontClassName,
}: PricingPreviewProps) {
  const { device, setDevice } = usePreviewDevice();
  const [isYearly, setIsYearly] = React.useState(false);

  const previewStyle = selectedStyle;
  const setPreviewStyle = (nextStyle: string) => {
    if (!onStyleChange) {return;}
    onStyleChange(nextStyle as PricingStyle);
  };

  const subtitle = String(config?.subtitle ?? 'Chọn gói phù hợp với nhu cầu của bạn');
  const showBillingToggle = config?.showBillingToggle !== false;
  const monthlyLabel = String(config?.monthlyLabel ?? 'Hàng tháng');
  const yearlyLabel = String(config?.yearlyLabel ?? 'Hàng năm');
  const yearlySavingText = String(config?.yearlySavingText ?? 'Tiết kiệm 17%');
  const texts = config?.texts ?? {};

  const validation = React.useMemo(() => getPricingValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  const warningMessages = React.useMemo(() => {
    const messages: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    return messages;
  }, [mode, validation]);

  const modeLabel = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Pricing"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={PRICING_STYLES}
        info={`${plans.length} gói • ${modeLabel}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/pricing">
          <PricingSectionShared
            context="preview"
            title={title}
            subtitle={subtitle}
            plans={plans}
            style={previewStyle}
            mode={mode}
            tokens={validation.tokens}
            texts={texts}
            isYearly={isYearly}
            showBillingToggle={showBillingToggle}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={setIsYearly}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho giá, badge và CTA của Pricing."
        />
      )}

      {warningMessages.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="space-y-2">
            {warningMessages.map((message) => (
              <div key={message} className="flex items-start gap-2">
                {message.includes('deltaE') ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> : <Eye size={14} className="mt-0.5 flex-shrink-0" />}
                <p>{message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
