'use client';

import React from 'react';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  getVideoColorTokens,
  type VideoColorTokens,
} from '../_lib/colors';
import { VIDEO_STYLES } from '../_lib/constants';
import type {
  VideoBrandMode,
  VideoConfig,
  VideoStyle,
} from '../_types';
import { VideoSectionShared } from './VideoSectionShared';

interface VideoPreviewProps {
  config: VideoConfig;
  brandColor: string;
  secondary: string;
  selectedStyle?: VideoStyle;
  onStyleChange?: (style: VideoStyle) => void;
  mode?: VideoBrandMode;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const getPreviewInfo = (style: VideoStyle, videoUrl: string) => {
  if (!videoUrl.trim()) {return 'Chưa có video';}

  switch (style) {
    case 'centered':
    case 'split':
    case 'minimal':
      return 'Tỉ lệ khuyến nghị: 1280×720 (16:9)';
    case 'fullwidth':
    case 'cinema':
      return 'Tỉ lệ khuyến nghị: 1920×820 (21:9)';
    case 'parallax':
      return 'Tỉ lệ khuyến nghị: 1920×1080 (16:9)';
    default:
      return 'Video preview';
  }
};

export const VideoPreview = ({
  config,
  brandColor,
  secondary,
  selectedStyle,
  onStyleChange,
  mode = 'dual',
  fontStyle,
  fontClassName,
}: VideoPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle ?? config.style ?? 'centered';

  const tokens: VideoColorTokens = React.useMemo(
    () => getVideoColorTokens({
      primary: brandColor,
      secondary,
      mode,
      style: previewStyle,
    }),
    [brandColor, secondary, mode, previewStyle],
  );

  return (
    <>
      <PreviewWrapper
        title="Preview Video"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(next) => onStyleChange?.(next as VideoStyle)}
        styles={VIDEO_STYLES}
        info={getPreviewInfo(previewStyle, config.videoUrl)}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          <VideoSectionShared
            context="preview"
            isPreview
            device={device}
            config={{ ...config, style: previewStyle }}
            style={previewStyle}
            title={config.heading}
            tokens={tokens}
          />
        </BrowserFrame>
      </PreviewWrapper>
      {mode === 'dual' ? (
        <ColorInfoPanel brandColor={tokens.primary} secondary={tokens.secondary} />
      ) : null}
    </>
  );
};
