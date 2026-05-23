import { env } from '../../config/env';
import type { StorageAdapter } from './storage-adapter';
import { LocalStorageAdapter } from './local-storage';

let adapter: StorageAdapter | null = null;

export function getStorageAdapter(subDir = ''): StorageAdapter {
  if (adapter) return adapter;

  switch (env.STORAGE_TYPE) {
    case 'local':
    default:
      adapter = new LocalStorageAdapter(subDir);
      break;
  }

  return adapter;
}

export function getPdfStorage(): StorageAdapter {
  return getStorageAdapter('pdfs');
}

export { StorageAdapter } from './storage-adapter';
