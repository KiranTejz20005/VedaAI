import axios from 'axios';
import { joinUrl, normalizeBaseUrl } from '@/utils/url';

const FALLBACK_API_ORIGIN = 'http://localhost:5000';
const rawApiOrigin = process.env.NEXT_PUBLIC_API_URL;
const apiOrigin =
  rawApiOrigin && rawApiOrigin !== 'undefined'
    ? normalizeBaseUrl(rawApiOrigin)
    : FALLBACK_API_ORIGIN;
const baseURL = joinUrl(apiOrigin, '/api');
const isApiDebugEnabled = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_API_DEBUG === 'true';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const endpoint = config.url ?? '';
  const finalURL = config.baseURL ? joinUrl(config.baseURL, endpoint) : endpoint;
  (config as typeof config & { metadata?: { startedAt: number } }).metadata = {
    startedAt: Date.now(),
  };

  if (isApiDebugEnabled) {
    console.log('[API REQUEST]', {
      method: config.method?.toUpperCase() ?? 'GET',
      baseURL: config.baseURL,
      endpoint,
      finalURL,
    });
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (isApiDebugEnabled) {
      const startedAt = (
        response.config as typeof response.config & { metadata?: { startedAt?: number } }
      ).metadata?.startedAt;
      const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
      console.log('[API RESPONSE]', {
        method: response.config.method?.toUpperCase() ?? 'GET',
        status: response.status,
        url: response.config.url,
        durationMs,
      });
    }
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const backendMessage =
        (error.response?.data as { error?: string; message?: string } | undefined)?.error ??
        (error.response?.data as { error?: string; message?: string } | undefined)?.message;
      const message = backendMessage ?? error.message ?? 'An unexpected error occurred';

      if (isApiDebugEnabled) {
        console.warn('[API ERROR]', {
          status,
          method: error.config?.method?.toUpperCase(),
          baseURL: error.config?.baseURL,
          endpoint: error.config?.url,
          finalURL: error.config?.baseURL && error.config?.url ? joinUrl(error.config.baseURL, error.config.url) : error.config?.url,
          code: error.code,
          message: error.message,
          response: error.response?.data,
        });
      }

      return Promise.reject(new Error(message));
    }

    if (isApiDebugEnabled) {
      console.warn('[API ERROR]', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return Promise.reject(error);
  }
);

export const API_ORIGIN = apiOrigin;
export const API_BASE_URL = baseURL;
