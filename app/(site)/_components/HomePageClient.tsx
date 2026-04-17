'use client';

import { HomeComponentRenderer } from '@/components/site/home/HomeComponentRenderer';
import { HomePageLoading } from '@/components/site/loading/HomePageLoading';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import React, { useEffect, useRef, useState } from 'react';

const EMPTY_COMPONENTS_COUNT = 0;
const LOADING_DELAY_MS = 120;
const LOADING_MIN_DISPLAY_MS = 320;
const MAX_CRITICAL_COMPONENTS = 3;

export default function HomePageClient({
  initialComponents,
}: {
  initialComponents?: Doc<'homeComponents'>[];
}): React.ReactElement {
  const [showDeferred, setShowDeferred] = useState(false);
  const [idleReady, setIdleReady] = useState(false);
  const [interactionReady, setInteractionReady] = useState(false);
  const [intersectionReady, setIntersectionReady] = useState(false);
  const shouldFetchLive = !initialComponents;
  const components = useQuery(
    api.homeComponents.listActive,
    shouldFetchLive ? undefined : 'skip'
  );
  const resolvedComponents = components ?? initialComponents;
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const deferredTriggerRef = useRef<HTMLDivElement | null>(null);
  const [criticalCount, setCriticalCount] = useState(() => {
    if (typeof window === 'undefined') {
      return MAX_CRITICAL_COMPONENTS;
    }
    return window.innerWidth < 768 ? 1 : MAX_CRITICAL_COMPONENTS;
  });

  const isDataReady = typeof resolvedComponents !== 'undefined';

  useEffect(() => {
    const canIdle = typeof window.requestIdleCallback === 'function';
    const handle = canIdle
      ? window.requestIdleCallback(() => setIdleReady(true), { timeout: 900 })
      : window.setTimeout(() => setIdleReady(true), 900);
    return () => {
      if (canIdle) {
        window.cancelIdleCallback(handle as number);
      } else {
        window.clearTimeout(handle as number);
      }
    };
  }, []);

  useEffect(() => {
    if (idleReady && (intersectionReady || interactionReady)) {
      setShowDeferred(true);
    }
  }, [idleReady, intersectionReady, interactionReady]);

  useEffect(() => {
    if (showDeferred) {
      return;
    }
    const node = deferredTriggerRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIntersectionReady(true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [showDeferred]);

  useEffect(() => {
    if (interactionReady || showDeferred) {
      return;
    }
    const handleInteract = () => {
      setInteractionReady(true);
    };
    window.addEventListener('scroll', handleInteract, { once: true, passive: true });
    window.addEventListener('pointerdown', handleInteract, { once: true });
    window.addEventListener('keydown', handleInteract, { once: true });
    return () => {
      window.removeEventListener('scroll', handleInteract);
      window.removeEventListener('pointerdown', handleInteract);
      window.removeEventListener('keydown', handleInteract);
    };
  }, [interactionReady, showDeferred]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const nextCount = window.innerWidth < 768 ? 1 : MAX_CRITICAL_COMPONENTS;
    setCriticalCount(nextCount);
  }, []);

  useEffect(() => {
    if (!isDataReady) {
      if (!loadingStartRef.current) {
        loadingStartRef.current = Date.now();
      }
      if (showLoading) {
        return;
      }
      if (LOADING_DELAY_MS <= 0) {
        setShowLoading(true);
        return;
      }
      if (delayTimerRef.current === null) {
        delayTimerRef.current = window.setTimeout(() => {
          setShowLoading(true);
          delayTimerRef.current = null;
        }, LOADING_DELAY_MS);
      }
      return;
    }

    if (delayTimerRef.current) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }

    if (!showLoading) {
      setShowLoading(false);
      loadingStartRef.current = null;
      return;
    }

    const startedAt = loadingStartRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, LOADING_MIN_DISPLAY_MS - elapsed);
    if (remaining <= 0) {
      setShowLoading(false);
      loadingStartRef.current = null;
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLoading(false);
      loadingStartRef.current = null;
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isDataReady, showLoading]);

  if (!isDataReady && !showLoading) {
    return <></>;
  }

  if (!isDataReady || showLoading) {
    return (
      <HomePageLoading />
    );
  }

  if (resolvedComponents.length === EMPTY_COMPONENTS_COUNT) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng!</h1>
          <p className="text-slate-500">
            Chưa có nội dung trang chủ. Vui lòng thêm components trong{' '}
            <a href="/admin/home-components" className="text-blue-600 hover:underline">
              Admin Panel
            </a>
          </p>
        </div>
      </div>
    );
  }

  const sortedComponents = [...resolvedComponents]
    .filter((componentItem) => {
      if (componentItem.type === 'Footer') {return false;}
      if (componentItem.type !== 'SpeedDial') {return true;}

      const config = componentItem.config as Record<string, unknown>;
      return config.showOnAllPages !== true;
    })
    .sort((firstComponent, secondComponent) => firstComponent.order - secondComponent.order);
  const criticalComponents = sortedComponents.slice(0, criticalCount);
  const deferredComponents = showDeferred ? sortedComponents.slice(criticalCount) : [];

  return (
    <>
      {criticalComponents.map((component) => (
        <HomeComponentRenderer
          key={component._id}
          component={{
            _id: component._id,
            active: component.active,
            config: component.config as Record<string, unknown>,
            order: component.order,
            title: component.title,
            type: component.type,
          }}
        />
      ))}
      {!showDeferred && <div ref={deferredTriggerRef} className="h-px w-px" aria-hidden />}
      {deferredComponents.map((component) => (
        <HomeComponentRenderer
          key={component._id}
          component={{
            _id: component._id,
            active: component.active,
            config: component.config as Record<string, unknown>,
            order: component.order,
            title: component.title,
            type: component.type,
          }}
        />
      ))}
    </>
  );
}
