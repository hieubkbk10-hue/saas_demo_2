'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CustomerAuthProvider } from '@/app/(site)/auth/context';
import { CartProvider } from '@/lib/cart';

const Toaster = dynamic(
  () => import('sonner').then((mod) => ({ default: mod.Toaster })),
  { ssr: false, loading: () => null }
);

export function SiteProviders({ children }: { children: React.ReactNode }) {
  const previousThemeRef = useRef<{
    colorScheme: string;
    dataTheme: string | null;
    hasDarkClass: boolean;
  } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    previousThemeRef.current = {
      colorScheme: root.style.colorScheme,
      dataTheme: root.getAttribute('data-theme'),
      hasDarkClass: root.classList.contains('dark'),
    };

    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    root.classList.remove('dark');

    return () => {
      const previous = previousThemeRef.current;
      if (!previous) {return;}
      if (previous.dataTheme) {
        root.setAttribute('data-theme', previous.dataTheme);
      } else {
        root.removeAttribute('data-theme');
      }
      root.style.colorScheme = previous.colorScheme;
      root.classList.toggle('dark', previous.hasDarkClass);
    };
  }, []);

  return (
    <CustomerAuthProvider>
      <CartProvider>
        {children}
        <Toaster richColors position="top-right" />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
