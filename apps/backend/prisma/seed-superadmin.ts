import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_o0OQsB4nRHTU@ep-small-bird-attn88l3-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'superadmin@vedaai.com' } });
  if (existing) {
    console.log('Super admin already exists:');
    console.log('  Email:    superadmin@vedaai.com');
    console.log('  Password: SuperAdmin@123');
    console.log('  ID:       ' + existing.id);
    return;
  }

  let org = await prisma.organization.findFirst({ where: { code: 'VEDA' } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'VedaAI Platform',
        code: 'VEDA',
        email: 'admin@vedaai.com',
        status: 'ACTIVE',
      },
    });
    console.log('Organization created:', org.id);
  }

  const pwdHash = await argon2.hash('SuperAdmin@123');
  const user = await prisma.user.create({
    data: {
      email: 'superadmin@vedaai.com',
      passwordHash: pwdHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date(),
      organizationId: org.id,
    },
  });

  console.log('SUPER_ADMIN created successfully!');
  console.log('');
  console.log('  Email:    superadmin@vedaai.com');
  console.log('  Password: SuperAdmin@123');
  console.log('  ID:       ' + user.id);
  console.log('  Role:     SUPER_ADMIN');
  console.log('');
  console.log('Login at http://localhost:3000/login');
}

main().catch(console.error).finally(() => prisma.$disconnect());
