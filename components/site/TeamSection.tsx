'use client';

import React from 'react';
import {
  normalizeTeamConfig,
  normalizeTeamStyle,
} from '@/app/admin/home-components/team/_lib/constants';
import { getTeamColorTokens } from '@/app/admin/home-components/team/_lib/colors';
import { TeamSectionShared } from '@/app/admin/home-components/team/_components/TeamSectionShared';
import type {
  TeamBrandMode,
  TeamStyle,
} from '@/app/admin/home-components/team/_types';

interface TeamSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: TeamBrandMode;
  title: string;
}

export function TeamSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: TeamSectionProps) {
  const normalizedConfig = normalizeTeamConfig(config);
  const style = normalizeTeamStyle((normalizedConfig.style as TeamStyle | undefined) ?? 'grid');

  const tokens = React.useMemo(() => getTeamColorTokens({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  const sectionTitle = (title || '').trim().length > 0
    ? title
    : 'Đội ngũ của chúng tôi';

  const safeMembers = Array.isArray(normalizedConfig.members)
    ? normalizedConfig.members
    : normalizeTeamConfig({}).members;

  return (
    <TeamSectionShared
      context="site"
      members={safeMembers}
      style={style}
      title={sectionTitle}
      tokens={tokens}
      mode={mode}
      carouselId="team-site-carousel"
    />
  );
}
