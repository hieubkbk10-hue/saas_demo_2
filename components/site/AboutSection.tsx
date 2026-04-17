'use client';

import React from 'react';
import { AboutSectionShared } from '@/app/admin/home-components/about/_components/AboutSectionShared';
import { getAboutSectionColors } from '@/app/admin/home-components/about/_lib/colors';
import {
  normalizeAboutPersistStats,
  normalizeAboutStyle,
} from '@/app/admin/home-components/about/_lib/constants';
import type {
  AboutBrandMode,
  AboutConfig,
} from '@/app/admin/home-components/about/_types';

interface AboutSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: AboutBrandMode;
  title: string;
}

export function AboutSection({ config, brandColor, secondary, mode, title }: AboutSectionProps) {
  const safeConfig = config as Partial<AboutConfig>;
  const style = normalizeAboutStyle(safeConfig.style);

  const tokens = getAboutSectionColors({
    primary: brandColor,
    secondary,
    mode,
  });

  return (
    <AboutSectionShared
      context="site"
      mode={mode}
      style={style}
      title={title}
      subHeading={typeof safeConfig.subHeading === 'string' ? safeConfig.subHeading : ''}
      heading={typeof safeConfig.heading === 'string' ? safeConfig.heading : title}
      description={typeof safeConfig.description === 'string' ? safeConfig.description : ''}
      image={typeof safeConfig.image === 'string' ? safeConfig.image : ''}
      imageCaption={typeof safeConfig.imageCaption === 'string' ? safeConfig.imageCaption : ''}
      buttonText={typeof safeConfig.buttonText === 'string' ? safeConfig.buttonText : ''}
      buttonLink={typeof safeConfig.buttonLink === 'string' ? safeConfig.buttonLink : '/about'}
      stats={normalizeAboutPersistStats(safeConfig.stats)}
      tokens={tokens}
      imagePriority
    />
  );
}
