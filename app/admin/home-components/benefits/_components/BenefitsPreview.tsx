'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { BENEFITS_STYLES } from '../_lib/constants';
import {
  buildBenefitsWarningMessages,
  getBenefitsSectionColors,
  getBenefitsValidationResult,
  normalizeBenefitsHarmony,
} from '../_lib/colors';
import { BenefitsSectionShared } from './BenefitsSectionShared';
import type { BenefitItem, BenefitsBrandMode, BenefitsConfig, BenefitsStyle } from '../_types';

interface BenefitsPreviewProps {
  items: BenefitItem[];
  brandColor: string;
  secondary: string;
  mode?: BenefitsBrandMode;
  selectedStyle?: BenefitsStyle;
  onStyleChange?: (style: BenefitsStyle) => void;
  config?: Partial<BenefitsConfig>;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const BenefitsPreview = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  config,
  fontStyle,
  fontClassName,
}: BenefitsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle ?? 'cards';
  const setPreviewStyle = (nextStyle: string) => {
    onStyleChange?.(nextStyle as BenefitsStyle);
  };

  const harmony = normalizeBenefitsHarmony(config?.harmony);

  const validation = React.useMemo(
    () => getBenefitsValidationResult({
      harmony,
      mode,
      primary: brandColor,
      secondary,
      style: previewStyle,
    }),
    [brandColor, secondary, mode, harmony, previewStyle],
  );

  const tokens = React.useMemo(
    () => getBenefitsSectionColors({
      harmony,
      mode,
      primary: brandColor,
      secondary,
    }),
    [brandColor, secondary, mode, harmony],
  );

  const warningMessages = React.useMemo(
    () => buildBenefitsWarningMessages({ mode, validation }),
    [mode, validation],
  );

  const sectionConfig = React.useMemo(
    () => ({
      buttonLink: config?.buttonLink,
      buttonText: config?.buttonText,
      gridColumnsDesktop: config?.gridColumnsDesktop,
      gridColumnsMobile: config?.gridColumnsMobile,
      heading: config?.heading,
      headerAlign: config?.headerAlign,
      subHeading: config?.subHeading,
    }),
    [
      config?.buttonLink,
      config?.buttonText,
      config?.gridColumnsDesktop,
      config?.gridColumnsMobile,
      config?.heading,
      config?.headerAlign,
      config?.subHeading,
    ],
  );

  return (
    <>
      <PreviewWrapper
        title="Preview Lợi ích"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={BENEFITS_STYLES}
        info={`${items.length} lợi ích • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/benefits">
          <BenefitsSectionShared
            items={items}
            style={previewStyle}
            title={config?.heading || 'Giá trị cốt lõi'}
            config={sectionConfig}
            tokens={tokens}
            mode={mode}
            context="preview"
            previewDevice={device}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && warningMessages.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              {warningMessages.map((message, idx) => (
                <p key={`benefits-preview-warning-${idx}`}>{message}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={validation.tokens.primary}
          secondary={validation.tokens.secondary}
          description="Màu phụ áp dụng cho badge, icon phụ, accent line và điểm nhấn điều hướng trong Benefits."
        />
      ) : null}
    </>
  );
};
