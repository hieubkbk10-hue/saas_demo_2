'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { ABOUT_STYLES } from '../_lib/constants';
import {
  buildAboutWarningMessages,
  getAboutSectionColors,
  getAboutValidationResult,
} from '../_lib/colors';
import { AboutSectionShared } from './AboutSectionShared';
import type { AboutBrandMode, AboutConfig, AboutStyle } from '../_types';

interface AboutPreviewProps {
  config: AboutConfig;
  brandColor: string;
  secondary: string;
  mode?: AboutBrandMode;
  selectedStyle?: AboutStyle;
  onStyleChange?: (style: AboutStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const AboutPreview = ({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
}: AboutPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle ?? config.style ?? 'bento';
  const setPreviewStyle = (nextStyle: string) => {
    onStyleChange?.(nextStyle as AboutStyle);
  };

  const validation = React.useMemo(
    () => getAboutValidationResult({
      primary: brandColor,
      secondary,
      mode,
      style: previewStyle,
    }),
    [brandColor, secondary, mode, previewStyle],
  );

  const tokens = React.useMemo(
    () => getAboutSectionColors({
      primary: brandColor,
      secondary,
      mode,
    }),
    [brandColor, secondary, mode],
  );

  const warningMessages = React.useMemo(
    () => buildAboutWarningMessages({ mode, validation }),
    [mode, validation],
  );

  return (
    <>
      <PreviewWrapper
        title="Preview Về chúng tôi"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={ABOUT_STYLES}
        info={`${config.stats.length} số liệu • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/about">
          <AboutSectionShared
            context="preview"
            mode={mode}
            style={previewStyle}
            title={config.heading || 'Về chúng tôi'}
            subHeading={config.subHeading}
            heading={config.heading}
            description={config.description}
            image={config.image}
            imageCaption={config.imageCaption}
            buttonText={config.buttonText}
            buttonLink={config.buttonLink}
            stats={config.stats}
            tokens={tokens}
            device={device}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && warningMessages.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              {warningMessages.map((message, idx) => (
                <p key={`about-preview-warning-${idx}`}>{message}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={validation.tokens.primary}
          secondary={validation.tokens.secondary}
          description="Màu phụ áp dụng cho badge, timeline dot, chỉ số phụ và điểm nhấn điều hướng trong About."
        />
      ) : null}
    </>
  );
};
