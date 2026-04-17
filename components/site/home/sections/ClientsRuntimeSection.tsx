'use client';

import React from 'react';
import { ClientsSectionShared } from '@/app/admin/home-components/clients/_components/ClientsSectionShared';
import { getClientsColorTokens } from '@/app/admin/home-components/clients/_lib/colors';
import type { ClientItem, ClientsConfig, ClientsStyle } from '@/app/admin/home-components/clients/_types';
import type { HomeComponentSectionProps } from '../types';

export function ClientsRuntimeSection({ config, brandColor, secondary, mode, title }: HomeComponentSectionProps) {
  const clientsConfig = config as Partial<ClientsConfig> & { items?: ClientItem[]; style?: ClientsStyle };
  const style = clientsConfig.style ?? 'simpleGrid';
  const tokens = getClientsColorTokens({ primary: brandColor, secondary, mode });
  const texts = clientsConfig.texts?.[style] ?? undefined;

  return (
    <ClientsSectionShared
      context="site"
      title={title}
      style={style}
      items={clientsConfig.items ?? []}
      tokens={tokens}
      texts={texts}
    />
  );
}
