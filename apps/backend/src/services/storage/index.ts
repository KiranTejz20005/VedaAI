import { env } from '../../config/env';
import type { StorageAdapter } from './storage-adapter';
import { LocalStorageAdapter } from './local-storage';
import { S3StorageAdapter } from './s3-storage';
import { SupabaseStorageAdapter } from './supabase-storage';

let adapter: StorageAdapter | null = null;

export function getStorageAdapter(subDir = ''): StorageAdapter {
  if (adapter) return adapter;

  switch (env.STORAGE_TYPE) {
    case 'supabase':
      adapter = new SupabaseStorageAdapter();
      break;
    case 's3':
      adapter = new S3StorageAdapter();
      break;
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
