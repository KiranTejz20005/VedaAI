'use client';

import dynamic from 'next/dynamic';

const AppChrome = dynamic(() => import('./AppChrome').then((mod) => mod.AppChrome), {
  ssr: false,
  loading: () => null,
});

/**
 * Loads sidebar/topbar/toaster client-only so extension-injected attributes
 * (e.g. Bitdefender bis_skin_checked) never mismatch SSR HTML.
 */
export function AppChromeGate({ children }: { children: React.ReactNode }) {
  return <AppChrome>{children}</AppChrome>;
}
