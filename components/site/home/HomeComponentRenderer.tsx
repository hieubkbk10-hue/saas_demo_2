'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from '@/components/site/hooks';
import { resolveTypeOverrideColors } from '@/app/admin/home-components/_shared/lib/typeColorOverride';
import { resolveTypeOverrideFont } from '@/app/admin/home-components/_shared/lib/typeFontOverride';
import { getHomepageCategoryHeroColors } from '@/app/admin/home-components/homepage-category-hero/_lib/colors';
import { homeComponentRegistry } from './registry';
import type { HomeComponentRecord } from './types';

const LegacyComponentRenderer = dynamic(
  () => import('@/components/site/ComponentRenderer').then((mod) => ({ default: mod.ComponentRenderer })),
  { ssr: false, loading: () => null }
);

interface HomeComponentRendererProps {
  component: HomeComponentRecord;
}

export function HomeComponentRenderer({ component }: HomeComponentRendererProps) {
  const systemColors = useBrandColors();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const sectionType = component.type;

  const resolvedColors = resolveTypeOverrideColors({
    type: sectionType,
    systemColors,
    overrides: systemConfig?.typeColorOverrides ?? null,
  });

  const resolvedFont = resolveTypeOverrideFont({
    type: sectionType,
    overrides: systemConfig?.typeFontOverrides ?? null,
    globalOverride: systemConfig?.globalFontOverride ?? null,
  });

  const SectionComponent = homeComponentRegistry[sectionType];

  if (!SectionComponent) {
    return (
      <LegacyComponentRenderer
        component={{
          _id: component._id,
          active: component.active,
          config: component.config,
          order: component.order,
          title: component.title,
          type: component.type,
        }}
      />
    );
  }

  const sectionNode = sectionType === 'HomepageCategoryHero'
    ? (
      <SectionComponent
        config={component.config}
        brandColor={resolvedColors.primary}
        secondary={resolvedColors.secondary}
        mode={resolvedColors.mode}
        title={component.title}
        tokens={getHomepageCategoryHeroColors(
          resolvedColors.primary,
          resolvedColors.secondary,
          resolvedColors.mode,
        )}
      />
    )
    : (
      <SectionComponent
        config={component.config}
        brandColor={resolvedColors.primary}
        secondary={resolvedColors.secondary}
        mode={resolvedColors.mode}
        title={component.title}
      />
    );

  return (
    <div className="font-active" style={{ '--font-active': `var(${resolvedFont.fontVariable})` } as React.CSSProperties}>
      {sectionNode}
    </div>
  );
}
