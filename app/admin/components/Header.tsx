'use client';

import { ChevronRight, Home, Menu as MenuIcon, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '../auth/context';
import { AdminHeaderSearchAutocomplete } from './AdminHeaderSearchAutocomplete';

const FIRST_INDEX = 0;
const INDEX_OFFSET = 1;

function formatRemaining(remainingMs: number) {
  if (remainingMs <= 0) {
    return '00h 00m';
  }

  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h`;
  }

  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, setMobileMenuOpen }) => {
  const pathname = usePathname();
  const { user } = useAdminAuth();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!user?.trial?.expiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [user?.trial?.expiresAt]);

  const trialBadge = useMemo(() => {
    if (!user?.trial?.expiresAt) {
      return null;
    }

    return formatRemaining(Math.max(user.trial.expiresAt - now, 0));
  }, [now, user?.trial?.expiresAt]);

  let themeTitle = 'Chế độ tối';
  let ThemeIcon = Moon;
  if (isDarkMode) {
    themeTitle = 'Chế độ sáng';
    ThemeIcon = Sun;
  }

  return (
    <header className="h-[54px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 transition-colors">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-1.5 -ml-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-md" onClick={() =>{  setMobileMenuOpen(true); }}>
          <MenuIcon size={24} />
        </button>
        <nav className="hidden md:flex items-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/admin/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
          <Breadcrumbs pathname={pathname} />
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <AdminHeaderSearchAutocomplete />
        </div>

        {trialBadge && (
          <div className="hidden md:flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            Trial còn {trialBadge}
          </div>
        )}
        
        <Link
          href="/"
          target="_blank"
          className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Mở trang chủ"
        >
          <Home size={18} />
        </Link>
        
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
          title={themeTitle}
        >
          <ThemeIcon size={18} />
        </button>
      </div>
    </header>
  );
};

const Breadcrumbs = ({ pathname }: { pathname: string }): React.ReactElement => {
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean);
  const items: Array<{ href: string; label: string; isLast: boolean }> = [];

  segments.forEach((segment, index) => {
    const isRootDashboard = segment === 'dashboard' && index === FIRST_INDEX;
    if (isRootDashboard) {
      return;
    }

    const href = `/admin/${segments.slice(FIRST_INDEX, index + INDEX_OFFSET).join('/')}`;
    items.push({
      href,
      isLast: index === segments.length - INDEX_OFFSET,
      label: segment.replaceAll('-', ' '),
    });
  });

  return (
    <>
      {items.map((item) => {
        let linkClassName = 'capitalize hover:text-blue-600 transition-colors';
        if (item.isLast) {
          linkClassName += ' font-medium text-slate-900 dark:text-slate-100';
        }

        return (
          <React.Fragment key={item.href}>
            <ChevronRight size={14} className="mx-2 text-slate-300" />
            <Link href={item.href} className={linkClassName}>
              {item.label}
            </Link>
          </React.Fragment>
        );
      })}
    </>
  );
};
