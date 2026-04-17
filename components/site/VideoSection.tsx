'use client';

import React from 'react';
import {
  normalizeVideoConfig,
  normalizeVideoStyle,
} from '@/app/admin/home-components/video/_lib/constants';
import { getVideoColorTokens } from '@/app/admin/home-components/video/_lib/colors';
import { VideoSectionShared } from '@/app/admin/home-components/video/_components/VideoSectionShared';
import type { VideoBrandMode } from '@/app/admin/home-components/video/_types';

interface VideoSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: VideoBrandMode;
  title: string;
}

export function VideoSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: VideoSectionProps) {
  const normalizedConfig = normalizeVideoConfig(config);
  const style = normalizeVideoStyle(normalizedConfig.style);

  const tokens = React.useMemo(() => getVideoColorTokens({
    primary: brandColor,
    secondary,
    mode,
    style,
  }), [brandColor, secondary, mode, style]);

  return (
    <VideoSectionShared
      context="site"
      config={{ ...normalizedConfig, style }}
      style={style}
      tokens={tokens}
      title={title}
      device="desktop"
    />
  );
}
