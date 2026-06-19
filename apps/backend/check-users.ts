import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({ select: { id: true, email: true, role: true, organizationId: true, hasCompletedOnboarding: true } })
  .then(u => { console.log(JSON.stringify(u, null, 2)); return prisma.$disconnect(); })
  .catch(e => { console.error(e.message); return prisma.$disconnect(); });
