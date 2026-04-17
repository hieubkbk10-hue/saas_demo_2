'use client';

import React from 'react';
import { CTASectionShared } from '@/app/admin/home-components/cta/_components/CTASectionShared';
import { getCTAColors } from '@/app/admin/home-components/cta/_lib/colors';
import type { CTAConfig, CTAStyle } from '@/app/admin/home-components/cta/_types';
import type { HomeComponentSectionProps } from '../types';

export function CtaRuntimeSection({ config, brandColor, secondary, mode }: HomeComponentSectionProps) {
  const ctaConfig = config as Partial<CTAConfig> & { style?: CTAStyle };
  const style = ctaConfig.style ?? 'banner';
  const tokens = getCTAColors({ primary: brandColor, secondary, mode, style });

  return (
    <CTASectionShared
      config={{
        badge: ctaConfig.badge ?? '',
        buttonLink: ctaConfig.buttonLink ?? '',
        buttonText: ctaConfig.buttonText ?? '',
        description: ctaConfig.description ?? '',
        secondaryButtonLink: ctaConfig.secondaryButtonLink ?? '',
        secondaryButtonText: ctaConfig.secondaryButtonText ?? '',
        title: ctaConfig.title ?? '',
      }}
      style={style}
      tokens={tokens}
      context="site"
    />
  );
}
