/**
 * Redis client singletons using ioredis.
 * Provides TWO separate connections:
 *   1. `getRedisClient()` — general purpose (caching, sessions). Supports Upstash.
 *   2. `getBullRedisClient()` — for BullMQ queues & workers only. MUST be local Redis.
 *
 * BullMQ requires blocking commands, persistent locks, and low-latency polling.
 * Upstash does NOT support blocking commands — using it for BullMQ causes silent
 * job stalls and heartbeat failures.
 */
import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// ── General-purpose Redis (caching, sessions) ─────────────────────────────

let redisClient: Redis | null = null;

function buildRedisOptions(): RedisOptions {
  const isTls =
    env.REDIS_URL.startsWith('rediss://') || env.REDIS_URL.startsWith('redis+tls://');

  return {
    maxRetriesPerRequest: 20,
    enableReadyCheck: false,
    lazyConnect: false,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error('Redis: max reconnection attempts reached');
        return null;
      }
      return Math.min(times * 200, 3_000);
    },
    reconnectOnError: (err: Error) => {
      const shouldReconnect =
        err.message.includes('READONLY') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT');
      return shouldReconnect ? 1 : false;
    },
    ...(isTls
      ? {
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  };
}

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, buildRedisOptions());

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('ready', () => logger.info('[REDIS] General client ready'));
  redisClient.on('error', (err: Error) => {
    if (err.message.includes('ECONNREFUSED')) {
      logger.warn('[REDIS] Connection refused — workers will be unavailable');
    } else {
      logger.error('[REDIS] Error:', err.message);
    }
  });
  redisClient.on('close', () => logger.warn('[REDIS] Connection closed'));
  redisClient.on('reconnecting', (delay: number) =>
    logger.info(`[REDIS] Reconnecting in ${delay}ms...`)
  );

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
}

export function isRedisConnected(): boolean {
  return redisClient?.status === 'ready';
}

// ── BullMQ-dedicated Redis (MUST be local Redis — Upstash kills BullMQ) ──

let bullRedisClient: Redis | null = null;

/**
 * BullMQ connection URL — ALWAYS uses REDIS_BULLMQ_URL.
 *
 * Upstash serverless Redis does NOT support the blocking commands (BLPOP, etc.)
 * that BullMQ workers depend on for reliable job processing. Using Upstash
 * for BullMQ causes:
 *   - Silent job stalls
 *   - Heartbeat failures
 *   - Lock expiration corruption
 *   - Infinite frontend polling
 *
 * REDIS_BULLMQ_URL defaults to redis://localhost:6379. If local Redis is not
 * available at startup, BullMQ workers will fail fast rather than silently
 * corrupting job state via Upstash.
 */
function bullRedisUrl(): string {
  return env.REDIS_BULLMQ_URL;
}

function buildBullRedisOptions(): RedisOptions {
  const url = bullRedisUrl();
  const isTls = url.startsWith('rediss://') || url.startsWith('redis+tls://');

  return {
    // maxRetriesPerRequest: null is REQUIRED by BullMQ — it handles retries internally
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true,
    lazyConnect: false,
    retryStrategy: (times: number) => {
      if (times > 20) {
        logger.error('[REDIS:BullMQ] Max reconnection attempts reached');
        return null;
      }
      return Math.min(times * 200, 5_000);
    },
    reconnectOnError: (err: Error) => {
      const shouldReconnect =
        err.message.includes('READONLY') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('CLUSTERDOWN');
      return shouldReconnect ? 2 : false;
    },
    ...(isTls
      ? {
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  };
}

// Connection event counters for diagnostics
export interface BullRedisDiagnostics {
  connected: boolean;
  status: string;
  connectCount: number;
  reconnectCount: number;
  errorCount: number;
  lastError: string | null;
  url: string;
}

const bullRedisDiag: BullRedisDiagnostics = {
  connected: false,
  status: 'initializing',
  connectCount: 0,
  reconnectCount: 0,
  errorCount: 0,
  lastError: null,
  url: 'not-connected',
};

export function getBullRedisDiagnostics(): BullRedisDiagnostics {
  return { ...bullRedisDiag, connected: isBullRedisConnected(), status: bullRedisClient?.status ?? 'disconnected' };
}

export function getBullRedisClient(): Redis {
  if (bullRedisClient) return bullRedisClient;

  const url = bullRedisUrl();
  bullRedisDiag.url = url;
  bullRedisClient = new Redis(url, buildBullRedisOptions());

  bullRedisClient.on('connect', () => {
    bullRedisDiag.connectCount++;
    logger.info('[REDIS:BullMQ] Connected to LOCAL Redis on localhost:6379');
  });
  bullRedisClient.on('ready', () => {
    logger.info('[REDIS:BullMQ] Client ready (blocking commands OK — BullMQ stable)');
  });
  bullRedisClient.on('error', (err: Error) => {
    bullRedisDiag.errorCount++;
    bullRedisDiag.lastError = err.message;
    if (err.message.includes('ECONNREFUSED')) {
      logger.error('[REDIS:BullMQ] Connection REFUSED — is local Redis running on localhost:6379? Workers UNAVAILABLE.');
    } else {
      logger.error('[REDIS:BullMQ] Error:', err.message);
    }
  });
  bullRedisClient.on('close', () => logger.warn('[REDIS:BullMQ] Connection closed'));
  bullRedisClient.on('reconnecting', (delay: number) => {
    bullRedisDiag.reconnectCount++;
    logger.info(`[REDIS:BullMQ] Reconnecting in ${delay}ms... (attempt ${bullRedisDiag.reconnectCount})`);
  });

  return bullRedisClient;
}

export async function closeBullRedis(): Promise<void> {
  if (bullRedisClient) {
    try {
      await bullRedisClient.quit();
    } catch {
      bullRedisClient.disconnect();
    } finally {
      bullRedisClient = null;
    }
  }
}

export function isBullRedisConnected(): boolean {
  return bullRedisClient?.status === 'ready';
}
