require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org-id' },
    update: {},
    create: {
      id: 'demo-org-id',
      name: 'VidyaAI Demo Organization',
      code: 'VEDAAI_DEMO_ORG_2',
      status: 'ACTIVE'
    }
  });

  const dept = await prisma.department.upsert({
    where: { id: 'dept-demo' },
    update: {},
    create: {
      id: 'dept-demo',
      name: 'Demo Department',
      organizationId: 'demo-org-id',
      status: 'ACTIVE'
    }
  });
  
  await prisma.user.updateMany({
    where: { id: 'demo-faculty-id' },
    data: { organizationId: 'demo-org-id', activeOrganizationId: 'demo-org-id', departmentId: 'dept-demo' }
  });
  console.log('Seeded demo-org-id and dept-demo');
}
main().catch(console.error).finally(() => prisma.$disconnect());
