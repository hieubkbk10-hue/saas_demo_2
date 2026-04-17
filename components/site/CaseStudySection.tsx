'use client';

import React from 'react';
import { CaseStudySectionShared } from '@/app/admin/home-components/case-study/_components/CaseStudySectionShared';
import { getCaseStudyColors } from '@/app/admin/home-components/case-study/_lib/colors';
import type { CaseStudyBrandMode, CaseStudyProject } from '@/app/admin/home-components/case-study/_types';

interface CaseStudySectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: CaseStudyBrandMode;
  title: string;
}

const normalizeProjects = (input: unknown): CaseStudyProject[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, idx) => {
    const record = (typeof item === 'object' && item !== null) ? item as Record<string, unknown> : {};

    const toText = (value: unknown) => {
      if (typeof value === 'string') {return value;}
      if (typeof value === 'number') {return String(value);}
      return '';
    };

    const rawId = record.id;
    const id = typeof rawId === 'number' || typeof rawId === 'string'
      ? rawId
      : idx + 1;

    return {
      id,
      title: toText(record.title),
      category: toText(record.category),
      image: toText(record.image),
      description: toText(record.description),
      link: toText(record.link),
    };
  });
};

export function CaseStudySection({ config, brandColor, secondary, mode, title }: CaseStudySectionProps) {
  const style = (typeof config.style === 'string'
    && ['grid', 'featured', 'list', 'masonry', 'carousel', 'timeline'].includes(config.style)
      ? config.style
      : 'grid') as 'grid' | 'featured' | 'list' | 'masonry' | 'carousel' | 'timeline';

  const projects = React.useMemo(() => normalizeProjects(config.projects), [config.projects]);

  const tokens = React.useMemo(() => (
    getCaseStudyColors(brandColor, secondary, mode)
  ), [brandColor, secondary, mode]);

  return (
    <CaseStudySectionShared
      projects={projects}
      style={style}
      mode={mode}
      tokens={tokens}
      context="site"
      title={title}
    />
  );
}
