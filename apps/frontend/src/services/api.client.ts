import axios from 'axios';

// NEXT_PUBLIC_API_URL must be set via Vercel env vars in production
// In development, it defaults to localhost
// Next.js replaces NEXT_PUBLIC_* at build time — missing vars in production
// will result in 'undefined' string, which we detect
const rawUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = rawUrl && rawUrl !== 'undefined' ? rawUrl : 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const inFlightRequests = new Map<string, Promise<unknown>>();

export function deduplicateRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) return existing as Promise<T>;
  const promise = factory().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, promise);
  return promise;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { error?: string })?.error ??
        error.message ??
        'An unexpected error occurred';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);
