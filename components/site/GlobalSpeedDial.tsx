'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors } from './hooks';
import { resolveTypeOverrideColors } from '@/app/admin/home-components/_shared/lib/typeColorOverride';
import { SpeedDialSection } from './SpeedDialSection';

const normalizeBoolean = (value: unknown, fallback: boolean) => (
  typeof value === 'boolean' ? value : fallback
);

export function GlobalSpeedDial() {
  const components = useQuery(api.homeComponents.listActive);
  const systemColors = useBrandColors();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);

  const resolvedColors = resolveTypeOverrideColors({
    type: 'SpeedDial',
    systemColors,
    overrides: systemConfig?.typeColorOverrides ?? null,
  });

  const speedDialComponent = React.useMemo(() => {
    if (!components) {return null;}

    const speedDials = components
      .filter((item) => item.type === 'SpeedDial' && item.active)
      .sort((a, b) => a.order - b.order);

    return speedDials.find((item) => {
      const config = item.config as Record<string, unknown>;
      return normalizeBoolean(config.showOnAllPages, false);
    }) ?? null;
  }, [components]);

  if (!speedDialComponent) {
    return null;
  }

  return (
    <SpeedDialSection
      config={speedDialComponent.config as Record<string, unknown>}
      brandColor={resolvedColors.primary}
      secondary={resolvedColors.secondary}
      mode={resolvedColors.mode}
      title={speedDialComponent.title}
    />
  );
}
