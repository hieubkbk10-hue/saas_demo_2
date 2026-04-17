'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ContactSectionShared } from '@/app/admin/home-components/contact/_components/ContactSectionShared';
import { getContactValidationResult } from '@/app/admin/home-components/contact/_lib/colors';
import { normalizeContactConfig } from '@/app/admin/home-components/contact/_lib/normalize';
import type { ContactBrandMode } from '@/app/admin/home-components/contact/_types';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';

interface ContactSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: ContactBrandMode;
  title: string;
}

export function ContactSection({ config, brandColor, secondary, mode, title }: ContactSectionProps) {
  const normalizedConfig = React.useMemo(() => normalizeContactConfig(config), [config]);
  const pathname = usePathname();
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const mapData = React.useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);

  const validation = React.useMemo(() => getContactValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  return (
    <ContactSectionShared
      config={normalizedConfig}
      style={normalizedConfig.style}
      tokens={validation.tokens}
      mode={mode}
      context="site"
      title={title}
      mapData={mapData}
      sourcePath={pathname}
    />
  );
}
