'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { systemExperiences } from '../experiences/_constants';
import { useI18n } from '../i18n/context';

type SearchItem = {
  href: string;
  keywords?: string[];
  subtitle: string;
  title: string;
  type: 'experience' | 'module';
};

const MAX_RESULTS = 20;

const isEditableTarget = (element: Element | null) => {
  if (!element) {
    return false;
  }
  const tag = element.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') {
    return true;
  }
  return (element as HTMLElement).isContentEditable;
};

export function SystemGlobalSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modules = useQuery(api.admin.modules.listModules);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = useMemo<SearchItem[]>(() => {
    const moduleItems = (modules ?? []).map((moduleItem) => ({
      href: `/system/modules/${moduleItem.key}`,
      keywords: [moduleItem.key, moduleItem.category],
      subtitle: moduleItem.description,
      title: moduleItem.name,
      type: 'module' as const,
    }));

    const experienceItems = systemExperiences.map((experience) => ({
      href: experience.href,
      subtitle: experience.description,
      title: experience.title,
      type: 'experience' as const,
    }));

    return [...moduleItems, ...experienceItems];
  }, [modules]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, MAX_RESULTS);
    }
    return items.filter((item) => {
      const baseMatch = [item.title, item.subtitle, ...(item.keywords ?? [])]
        .join(' ')
        .toLowerCase();
      return baseMatch.includes(normalized);
    }).slice(0, MAX_RESULTS);
  }, [items, query]);

  const moduleResults = filteredItems.filter((item) => item.type === 'module');
  const experienceResults = filteredItems.filter((item) => item.type === 'experience');

  const handleSelect = (item: SearchItem) => {
    setOpen(false);
    setQuery('');
    router.push(item.href);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const rawKey = event.key;
      if (typeof rawKey !== 'string' || !rawKey) {
        return;
      }
      const key = rawKey.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        if (isEditableTarget(document.activeElement)) {
          return;
        }
        event.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
        return;
      }

      if (!open) {
        return;
      }

      if (key === 'escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (key === 'arrowdown') {
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
        return;
      }

      if (key === 'arrowup') {
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (key === 'enter' && filteredItems.length > 0) {
        event.preventDefault();
        const target = filteredItems[selectedIndex] ?? filteredItems[0];
        if (target) {
          handleSelect(target);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, open, selectedIndex]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setQuery('');
          setSelectedIndex(0);
        }}
        className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 focus-within:border-cyan-500/50 transition-colors"
      >
        <Search size={14} className="text-slate-400 dark:text-slate-500 mr-2" />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t.header.globalSearchPlaceholder}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-600 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-800 ml-2">
          Ctrl+K
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-50 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <Search size={16} className="text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.header.globalSearchPlaceholder}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-600">
                {t.header.globalSearchHint}
              </span>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {filteredItems.length === 0 && (
                <div className="px-4 py-6 text-sm text-slate-500">
                  {t.header.globalSearchNoResult}
                </div>
              )}

              {moduleResults.length > 0 && (
                <div className="px-4 pt-3 text-[10px] uppercase tracking-wider text-slate-400">
                  {t.header.globalSearchModules}
                </div>
              )}
              {moduleResults.map((item, index) => (
                <button
                  key={item.href}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-2 flex flex-col gap-1 transition-colors ${
                    selectedIndex === index
                      ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>
                </button>
              ))}

              {experienceResults.length > 0 && (
                <div className="px-4 pt-3 text-[10px] uppercase tracking-wider text-slate-400">
                  {t.header.globalSearchExperiences}
                </div>
              )}
              {experienceResults.map((item, index) => {
                const itemIndex = moduleResults.length + index;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-4 py-2 flex flex-col gap-1 transition-colors ${
                      selectedIndex === itemIndex
                        ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
