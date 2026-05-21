/**
 * Redis client singleton using ioredis.
 * Supports both local Redis and Upstash (rediss:// with TLS).
 * Designed to be safely instantiated only once (singleton pattern).
 */
import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

function buildRedisOptions(): RedisOptions {
  const isTls =
    env.REDIS_URL.startsWith('rediss://') || env.REDIS_URL.startsWith('redis+tls://');

  return {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,    // Required by BullMQ with Upstash
    lazyConnect: false,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error('Redis: max reconnection attempts reached');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 3_000); // 200ms → 3s exponential
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
            rejectUnauthorized: false, // Required for self-signed Upstash certs
          },
        }
      : {}),
  };
}

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, buildRedisOptions());

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('ready', () => logger.info('Redis client ready'));
  redisClient.on('error', (err: Error) => {
    // Suppress noisy ECONNREFUSED spam in dev when Redis is optional
    if (err.message.includes('ECONNREFUSED')) {
      logger.warn('Redis: connection refused — workers will be unavailable');
    } else {
      logger.error('Redis error:', err.message);
    }
  });
  redisClient.on('close', () => logger.warn('Redis connection closed'));
  redisClient.on('reconnecting', (delay: number) =>
    logger.info(`Redis reconnecting in ${delay}ms...`)
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

/** Returns true if the Redis client exists and is connected */
export function isRedisConnected(): boolean {
  return redisClient?.status === 'ready';
}
