import React from 'react';
import {
  DEFAULT_CAREER_HARMONY,
  normalizeCareerHarmony,
} from '@/app/admin/home-components/career/_lib/constants';
import { getCareerColorTokens } from '@/app/admin/home-components/career/_lib/colors';
import {
  normalizeCareerConfig,
  normalizeCareerJobs,
  normalizeCareerStyle,
} from '@/app/admin/home-components/career/_lib/normalize';
import { CareerSectionShared } from '@/app/admin/home-components/career/_components/CareerSectionShared';
import type { CareerBrandMode } from '@/app/admin/home-components/career/_types';

interface CareerSectionProps {
  title: string;
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: CareerBrandMode;
}

export function CareerSection({
  title,
  config,
  brandColor,
  secondary,
  mode,
}: CareerSectionProps) {
  const normalizedConfig = normalizeCareerConfig(config);
  const normalizedStyle = normalizeCareerStyle(normalizedConfig.style);
  const normalizedJobs = normalizeCareerJobs(normalizedConfig.jobs);
  const harmony = normalizeCareerHarmony(normalizedConfig.harmony ?? DEFAULT_CAREER_HARMONY);

  const tokens = getCareerColorTokens({
    primary: brandColor,
    secondary,
    mode,
    harmony,
  });

  return (
    <CareerSectionShared
      context="site"
      jobs={normalizedJobs}
      style={normalizedStyle}
      title={title}
      tokens={tokens}
    />
  );
}
