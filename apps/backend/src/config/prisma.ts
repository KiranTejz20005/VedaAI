import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/bloom_verify?schema=public';
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    const globalForPrisma = global as typeof globalThis & { __prisma?: PrismaClient };
    if (globalForPrisma.__prisma) return globalForPrisma.__prisma;
    globalForPrisma.__prisma = client;
  }

  return client;
}

const prisma = createPrisma();

export default prisma;
