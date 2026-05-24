'use client';

import { useSyncExternalStore } from 'react';

/** True only after the component has mounted on the client (avoids SSR/client UI drift). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
