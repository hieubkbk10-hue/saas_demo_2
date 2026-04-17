'use client';

import React from 'react';
import { usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getCountdownColorTokens } from '../_lib/colors';
import { useCountdownTimer } from '../_lib/timer';
import { normalizeCountdownConfig } from '../_lib/normalize';
import { CountdownSectionShared } from './CountdownSectionShared';
import type {
  CountdownBrandMode,
  CountdownConfig,
  CountdownStyle,
} from '../_types';

interface CountdownPreviewProps {
  config: CountdownConfig;
  brandColor: string;
  secondary: string;
  mode?: CountdownBrandMode;
  selectedStyle?: CountdownStyle;
  onStyleChange?: (style: CountdownStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const CountdownPreview = ({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
}: CountdownPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();

  const normalizedConfig = React.useMemo(() => {
    const normalized = normalizeCountdownConfig(config);
    if (selectedStyle) {
      normalized.style = selectedStyle;
    }
    return normalized;
  }, [config, selectedStyle]);

  const tokens = React.useMemo(
    () => getCountdownColorTokens({
      primary: brandColor,
      secondary,
      mode,
    }),
    [brandColor, secondary, mode],
  );

  const timeLeft = useCountdownTimer(normalizedConfig.endDate);

  return (
    <CountdownSectionShared
      config={normalizedConfig}
      title={normalizedConfig.heading}
      mode={mode}
      tokens={tokens}
      timeLeft={timeLeft}
      context="preview"
      includePreviewWrapper
      previewDevice={device}
      setPreviewDevice={setDevice}
      previewStyle={normalizedConfig.style}
      onPreviewStyleChange={onStyleChange}
      showColorInfo={mode === 'dual'}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
    />
  );
};
