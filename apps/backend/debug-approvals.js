const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pending = await prisma.assignment.findMany({
    where: { status: 'PENDING_APPROVAL' },
    select: { id: true, title: true, status: true, organizationId: true, createdBy: { select: { email: true } } }
  });
  console.log('Pending Assignments:', JSON.stringify(pending, null, 2));
  
  const users = await prisma.user.findMany({
    where: { role: 'ORG_ADMIN' },
    select: { email: true, organizationId: true }
  });
  console.log('Org Admins:', JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
