'use client';

import { useState, useEffect } from 'react';

interface ViewportSize {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  scrollbarWidth: number;
}

function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0, isLandscape: false, isPortrait: true, scrollbarWidth: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isLandscape: window.innerWidth > window.innerHeight,
      isPortrait: window.innerWidth <= window.innerHeight,
      scrollbarWidth: getScrollbarWidth(),
    };
  });

  useEffect(() => {
    let rafId: number;

    const handler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
          isLandscape: window.innerWidth > window.innerHeight,
          isPortrait: window.innerWidth <= window.innerHeight,
          scrollbarWidth: getScrollbarWidth(),
        });
      });
    };

    window.addEventListener('resize', handler, { passive: true });
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return size;
}
