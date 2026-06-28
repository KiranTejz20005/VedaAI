const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.assignment.findMany({
    select: { id: true, title: true, status: true, organizationId: true, createdBy: { select: { email: true, role: true } } }
  });
  console.log('Assignments:', JSON.stringify(assignments, null, 2));

  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'ORG_ADMIN', 'TEACHER', 'FACULTY'] } },
    select: { id: true, email: true, role: true, organizationId: true }
  });
  console.log('Users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
