'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

function getSessionId(): string {
  if (typeof window === 'undefined') {return '';}
  
  let sessionId = sessionStorage.getItem('pv_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
    sessionStorage.setItem('pv_session_id', sessionId);
  }
  return sessionId;
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') {return 'desktop';}
  
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getOS(): string {
  if (typeof window === 'undefined') {return 'unknown';}
  
  const ua = navigator.userAgent;
  if (ua.includes('Win')) {return 'Windows';}
  if (ua.includes('Mac')) {return 'macOS';}
  if (ua.includes('Linux')) {return 'Linux';}
  if (ua.includes('Android')) {return 'Android';}
  if (ua.includes('iPhone') || ua.includes('iPad')) {return 'iOS';}
  return 'unknown';
}

function getBrowser(): string {
  if (typeof window === 'undefined') {return 'unknown';}
  
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) {return 'Firefox';}
  if (ua.includes('SamsungBrowser')) {return 'Samsung Browser';}
  if (ua.includes('Opera') || ua.includes('OPR')) {return 'Opera';}
  if (ua.includes('Edge')) {return 'Edge';}
  if (ua.includes('Chrome')) {return 'Chrome';}
  if (ua.includes('Safari')) {return 'Safari';}
  return 'unknown';
}

export function PageViewTracker() {
  const pathname = usePathname();
  const trackPageView = useMutation(api.pageViews.track);
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Skip system routes only (keep tracking /admin for bandwidth stats)
    if (pathname.startsWith('/system')) {
      return;
    }

    // Prevent duplicate tracking for same path in same render cycle
    if (trackedPaths.current.has(pathname)) {
      return;
    }

    const sessionId = getSessionId();
    if (!sessionId) {return;}

    trackedPaths.current.add(pathname);

    const shouldTrack = () => document.visibilityState === 'visible';
    const sendTracking = () => {
      if (!shouldTrack()) {
        return;
      }
      trackPageView({
        browser: getBrowser(),
        device: getDeviceType(),
        os: getOS(),
        path: pathname,
        referrer: document.referrer || undefined,
        sessionId,
        userAgent: navigator.userAgent,
      }).catch(console.error);
    };

    const canIdle = typeof window.requestIdleCallback === 'function';
    const handle = canIdle
      ? window.requestIdleCallback(sendTracking, { timeout: 1200 })
      : window.setTimeout(sendTracking, 1200);

    // Clear tracked path after some time to allow re-tracking on navigation back
    const timeout = setTimeout(() => {
      trackedPaths.current.delete(pathname);
    }, 5000);

    return () => {
      if (canIdle) {
        window.cancelIdleCallback(handle as number);
      } else {
        window.clearTimeout(handle as number);
      }
      clearTimeout(timeout);
    };
  }, [pathname, trackPageView]);

  return null;
}
