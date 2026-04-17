'use client';

import React from 'react';
import { FeaturesSectionShared } from '@/app/admin/home-components/features/_components/FeaturesSectionShared';
import type { FeatureItem, FeaturesStyle } from '@/app/admin/home-components/features/_types';
import type { HomeComponentSectionProps } from '../types';

export function FeaturesRuntimeSection({ config, brandColor, secondary, mode, title }: HomeComponentSectionProps) {
  const items = Array.isArray(config.items) ? (config.items as FeatureItem[]) : [];
  const style = (config.style as FeaturesStyle) ?? 'iconGrid';

  return (
    <FeaturesSectionShared
      items={items}
      style={style}
      title={title}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      context="site"
    />
  );
}
