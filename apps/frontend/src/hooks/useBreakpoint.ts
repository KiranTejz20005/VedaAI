'use client';

import { useMediaQuery } from './useMediaQuery';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

const BREAKPOINTS: Record<Breakpoint, string> = {
  xs: '(max-width: 374px)',
  sm: '(min-width: 375px) and (max-width: 639px)',
  md: '(min-width: 640px) and (max-width: 1023px)',
  lg: '(min-width: 1024px) and (max-width: 1279px)',
  xl: '(min-width: 1280px) and (max-width: 1535px)',
  '2xl': '(min-width: 1536px) and (max-width: 1919px)',
  '3xl': '(min-width: 1920px)',
};

const UP_BREAKPOINTS: Record<string, string> = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 375px)',
  md: '(min-width: 640px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  '3xl': '(min-width: 1920px)',
};

export function useBreakpoint(): Breakpoint {
  const xs = useMediaQuery(BREAKPOINTS.xs);
  const sm = useMediaQuery(BREAKPOINTS.sm);
  const md = useMediaQuery(BREAKPOINTS.md);
  const lg = useMediaQuery(BREAKPOINTS.lg);
  const xl = useMediaQuery(BREAKPOINTS.xl);
  const xl2 = useMediaQuery(BREAKPOINTS['2xl']);
  const xl3 = useMediaQuery(BREAKPOINTS['3xl']);

  if (xs) return 'xs';
  if (sm) return 'sm';
  if (md) return 'md';
  if (lg) return 'lg';
  if (xl) return 'xl';
  if (xl2) return '2xl';
  if (xl3) return '3xl';
  return 'lg';
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useBreakpointUp(bp: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'): boolean {
  return useMediaQuery(UP_BREAKPOINTS[bp]);
}

export function useBreakpointDown(bp: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): boolean {
  const values: Record<string, string> = {
    xs: '(max-width: 374px)',
    sm: '(max-width: 639px)',
    md: '(max-width: 1023px)',
    lg: '(max-width: 1279px)',
    xl: '(max-width: 1535px)',
    '2xl': '(max-width: 1919px)',
  };
  return useMediaQuery(values[bp]);
}
