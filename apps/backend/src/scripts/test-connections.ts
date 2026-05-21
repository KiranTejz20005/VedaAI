/**
 * Quick connectivity test script.
 * Run with: npx ts-node src/scripts/test-connections.ts
 *
 * Tests MongoDB and Redis connections independently so you can diagnose
 * which service is failing without starting the full server.
 */
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Redis } from 'ioredis';

const MONGODB_URI = process.env.MONGODB_URI ?? '';
const REDIS_URL = process.env.REDIS_URL ?? '';

async function testMongoDB(): Promise<void> {
  console.log('\n🔍 Testing MongoDB connection...');
  console.log('   URI (password redacted):', MONGODB_URI.replace(/:([^@]+)@/, ':***@'));

  if (!MONGODB_URI) {
    console.error('   ❌ MONGODB_URI is not set in .env');
    return;
  }

  if (MONGODB_URI.includes('<') || MONGODB_URI.includes('>')) {
    console.error(
      '   ❌ MONGODB_URI contains < or > angle brackets!\n' +
        '      These break authentication (error code 8000).\n' +
        '      Fix: Remove the angle brackets and use the raw password.'
    );
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
      authSource: 'admin',
    });
    console.log('   ✅ MongoDB connected successfully!');
    console.log('   📊 Host:', mongoose.connection.host);
    console.log('   📊 Database:', mongoose.connection.name);
    await mongoose.disconnect();
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('bad auth') || error.message.includes('8000')) {
      console.error(
        '   ❌ Authentication failed (code 8000)!\n' +
          '      → Verify the username is correct\n' +
          '      → Verify the password is correct\n' +
          '      → Ensure no special chars need URL-encoding (@ # % must be encoded)\n' +
          '      → Ensure the database name is in the URI (/vedaai before the ?)\n' +
          '      → Check that your IP is whitelisted in Atlas → Network Access'
      );
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   ❌ Connection refused — is the MongoDB server running?');
    } else if (error.message.includes('timed out')) {
      console.error(
        '   ❌ Connection timed out — check your IP whitelist in Atlas Network Access'
      );
    } else {
      console.error('   ❌ MongoDB error:', error.message);
    }
  }
}

async function testRedis(): Promise<void> {
  console.log('\n🔍 Testing Redis connection...');

  if (!REDIS_URL) {
    console.error('   ❌ REDIS_URL is not set in .env');
    return;
  }

  if (!REDIS_URL.startsWith('redis://') && !REDIS_URL.startsWith('rediss://')) {
    console.error(
      '   ❌ REDIS_URL does not look like a valid URL!\n' +
        '      Expected: redis:// or rediss:// (with double-s for TLS)\n' +
        '      Got: ' + REDIS_URL.substring(0, 50)
    );
    return;
  }

  console.log('   URL (password redacted):', REDIS_URL.replace(/:([^@]+)@/, ':***@'));

  const isTls = REDIS_URL.startsWith('rediss://');
  const client = new Redis(REDIS_URL, {
    tls: isTls ? { rejectUnauthorized: false } : undefined,
    lazyConnect: true,
    connectTimeout: 8_000,
  });

  try {
    await client.connect();
    const pong = await client.ping();
    console.log('   ✅ Redis connected! PING response:', pong);
    await client.quit();
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   ❌ Connection refused — is Redis running?');
    } else if (error.message.includes('WRONGPASS') || error.message.includes('NOAUTH')) {
      console.error('   ❌ Authentication failed — check the password in REDIS_URL');
    } else {
      console.error('   ❌ Redis error:', error.message);
    }
    client.disconnect();
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  VedaAI Backend Connection Test');
  console.log('═══════════════════════════════════════════════');
  console.log('  NODE_ENV:', process.env.NODE_ENV ?? 'not set');

  await testMongoDB();
  await testRedis();

  console.log('\n═══════════════════════════════════════════════');
  console.log('  Test complete');
  console.log('═══════════════════════════════════════════════\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
