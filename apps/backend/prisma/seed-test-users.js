/* eslint-disable */
// Plain JS seed — runs with node directly via @prisma/client + argon2
// Usage: node prisma/seed-test-users.js

const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');
const argon2           = require('argon2');
const dotenv           = require('dotenv');
const path             = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_o0OQsB4nRHTU@ep-small-bird-attn88l3-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

async function upsertUser({ email, password, firstName, lastName, role, organizationId, departmentId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('  ✓ Already exists: ' + email + ' (' + role + ')');
    return existing;
  }

  const pwdHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: pwdHash,
      firstName,
      lastName,
      role,
      organizationId: organizationId || null,
      departmentId: departmentId || null,
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date(),
      status: 'ACTIVE',
      preferences: { emailNotifications: true, inAppAlerts: true, autoSave: true },
    },
  });

  console.log('  ✓ Created: ' + email + ' (' + role + ')');
  return user;
}

async function main() {
  console.log('\n🌱  Seeding test users for VedaAI Platform...\n');

  // 1. Ensure the VedaAI Platform organisation exists
  let org = await prisma.organization.findFirst({ where: { code: 'VEDA' } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'VedaAI Platform',
        code: 'VEDA',
        email: 'platform@vedaai.com',
        status: 'ACTIVE',
        subscriptionPlan: 'PRO',
      },
    });
    console.log('  ✓ Organization created: VedaAI Platform (VEDA)');
  } else {
    console.log('  ✓ Organization found:   VedaAI Platform (VEDA)  id=' + org.id);
  }

  // 2. Ensure a demo department inside the org
  let dept = await prisma.department.findFirst({
    where: { organizationId: org.id, name: 'Computer Science' },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: 'Computer Science', code: 'CS', organizationId: org.id, status: 'ACTIVE' },
    });
    console.log('  ✓ Department created: Computer Science');
  } else {
    console.log('  ✓ Department found:   Computer Science  id=' + dept.id);
  }

  // 3. Super Admin
  console.log('\n[SUPER ADMIN]');
  await upsertUser({
    email: 'superadmin@vedaai.com',
    password: 'SuperAdmin@123',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    organizationId: org.id,
  });

  // 4. Org Admin (ADMIN role)
  console.log('\n[ORG ADMIN]');
  await upsertUser({
    email: 'admin@vedaai.com',
    password: 'OrgAdmin@123',
    firstName: 'Org',
    lastName: 'Admin',
    role: 'ADMIN',
    organizationId: org.id,
  });

  // 5. Faculty / Teacher
  console.log('\n[FACULTY / TEACHER]');
  await upsertUser({
    email: 'faculty@vedaai.com',
    password: 'Faculty@123',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'TEACHER',
    organizationId: org.id,
    departmentId: dept.id,
  });

  // 6. Student
  console.log('\n[STUDENT]');
  await upsertUser({
    email: 'student@vedaai.com',
    password: 'Student@123',
    firstName: 'Rahul',
    lastName: 'Verma',
    role: 'STUDENT',
    organizationId: org.id,
    departmentId: dept.id,
  });

  // Summary
  const line = '═'.repeat(57);
  console.log('\n' + line);
  console.log('  ✅  Test users ready!\n');
  console.log('  ROLE          EMAIL                     PASSWORD');
  console.log('  ' + '─'.repeat(53));
  console.log('  Super Admin   superadmin@vedaai.com     SuperAdmin@123');
  console.log('  Org Admin     admin@vedaai.com          OrgAdmin@123');
  console.log('  Faculty       faculty@vedaai.com        Faculty@123');
  console.log('  Student       student@vedaai.com        Student@123');
  console.log(line);
  console.log('\n  Login at: http://localhost:3000/login\n');
}

main()
  .catch((e) => { console.error('\n❌  Error:', e.message || e); process.exit(1); })
  .finally(() => prisma.$disconnect());
