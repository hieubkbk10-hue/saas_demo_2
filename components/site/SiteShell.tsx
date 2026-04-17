'use client';

import React from 'react';
import { DynamicFooter } from '@/components/site/DynamicFooter';
import { Header, type HeaderInitialData } from '@/components/site/Header';
import { CartDrawer } from '@/components/site/CartDrawer';
import { SiteProviders } from '@/components/site/SiteProviders';
import { GlobalSpeedDial } from '@/components/site/GlobalSpeedDial';

export function SiteShell({
  children,
  initialHeaderData,
}: {
  children: React.ReactNode;
  initialHeaderData?: HeaderInitialData;
}) {
  return (
    <SiteProviders>
      <div className="min-h-screen flex flex-col">
        <Header initialData={initialHeaderData} />
        <CartDrawer />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
        <DynamicFooter />
        <GlobalSpeedDial />
      </div>
    </SiteProviders>
  );
}
