'use client';

import React from 'react';
import { BenefitsSectionShared } from '@/app/admin/home-components/benefits/_components/BenefitsSectionShared';
import { getBenefitsSectionColors, normalizeBenefitsHarmony } from '@/app/admin/home-components/benefits/_lib/colors';
import type { BenefitItem, BenefitsBrandMode, BenefitsConfig, BenefitsStyle } from '@/app/admin/home-components/benefits/_types';
import type { HomeComponentSectionProps } from '../types';

export function BenefitsRuntimeSection({ config, brandColor, secondary, mode, title }: HomeComponentSectionProps) {
  const benefitsConfig = config as unknown as Partial<BenefitsConfig>;
  const items: BenefitItem[] = (benefitsConfig.items ?? []).map((item, idx) => ({
    description: item.description ?? '',
    icon: item.icon ?? 'Check',
    id: `benefits-site-${idx}`,
    title: item.title ?? '',
  }));

  const style: BenefitsStyle = (
    benefitsConfig.style === 'cards'
    || benefitsConfig.style === 'list'
    || benefitsConfig.style === 'bento'
    || benefitsConfig.style === 'row'
    || benefitsConfig.style === 'carousel'
    || benefitsConfig.style === 'timeline'
  )
    ? benefitsConfig.style
    : 'cards';

  const harmony = normalizeBenefitsHarmony(benefitsConfig.harmony);
  const tokens = getBenefitsSectionColors({
    harmony,
    mode: mode as BenefitsBrandMode,
    primary: brandColor,
    secondary,
  });

  return (
    <BenefitsSectionShared
      context="site"
      style={style}
      title={title}
      config={{
        buttonLink: benefitsConfig.buttonLink,
        buttonText: benefitsConfig.buttonText,
        gridColumnsDesktop: benefitsConfig.gridColumnsDesktop,
        gridColumnsMobile: benefitsConfig.gridColumnsMobile,
        heading: benefitsConfig.heading,
        headerAlign: benefitsConfig.headerAlign,
        subHeading: benefitsConfig.subHeading,
      }}
      items={items}
      tokens={tokens}
      mode={mode as BenefitsBrandMode}
    />
  );
}
