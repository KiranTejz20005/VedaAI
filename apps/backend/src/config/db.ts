/**
 * MongoDB connection singleton with retry logic and connection state management.
 * Prevents duplicate connections during hot reload in development.
 */
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// ── Connection state tracking (survives hot reload via global) ──────────────
const globalForMongoose = global as typeof globalThis & {
  _mongooseConnectionPromise?: Promise<typeof mongoose>;
};

const MAX_RETRIES = 5;
const RETRY_BASE_MS = 1_000;

async function createConnection(): Promise<typeof mongoose> {
  return mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    connectTimeoutMS: 10_000,
    heartbeatFrequencyMS: 10_000,
    retryWrites: true,
    // Ensure we use the correct authSource for Atlas
    authSource: 'admin',
  });
}

export async function connectDatabase(): Promise<void> {
  // Already connected — skip
  if (mongoose.connection.readyState === 1) {
    logger.info('MongoDB already connected — reusing existing connection');
    return;
  }

  // Connection in progress — wait for it
  if (globalForMongoose._mongooseConnectionPromise) {
    await globalForMongoose._mongooseConnectionPromise;
    return;
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      globalForMongoose._mongooseConnectionPromise = createConnection();
      await globalForMongoose._mongooseConnectionPromise;
      logger.info('✅ MongoDB connected successfully');
      return;
    } catch (error) {
      globalForMongoose._mongooseConnectionPromise = undefined;
      lastError = error;

      const isAuthError =
        error instanceof Error &&
        (error.message.includes('bad auth') ||
          error.message.includes('Authentication failed') ||
          error.message.includes('8000'));

      if (isAuthError) {
        logger.error(
          '❌ MongoDB authentication failed. Check your MONGODB_URI credentials in .env — ' +
            'ensure the password has no special characters that need URL-encoding, ' +
            'and that the URI format is correct (no angle brackets around the password).'
        );
        // Auth errors won't resolve with retries — fail fast
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        const delayMs = RETRY_BASE_MS * 2 ** (attempt - 1); // 1s, 2s, 4s, 8s
        logger.warn(
          `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  logger.error('❌ MongoDB connection failed after all retries:', lastError);
  throw lastError;
}

// ── Connection event listeners ────────────────────────────────────────────────
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (error: Error) => {
  logger.error('MongoDB connection error:', error.message);
  globalForMongoose._mongooseConnectionPromise = undefined;
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  globalForMongoose._mongooseConnectionPromise = undefined;
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    globalForMongoose._mongooseConnectionPromise = undefined;
    logger.info('MongoDB disconnected gracefully');
  }
}

/** Returns true if the database is currently connected */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
