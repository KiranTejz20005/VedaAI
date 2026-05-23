'use client';

import { useState, useEffect } from 'react';

const QUERY_CACHE = new Map<string, boolean>();

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    const cached = QUERY_CACHE.get(query);
    if (cached !== undefined) return cached;
    const mq = window.matchMedia(query);
    QUERY_CACHE.set(query, mq.matches);
    return mq.matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => {
      QUERY_CACHE.set(query, e.matches);
      setMatches(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
