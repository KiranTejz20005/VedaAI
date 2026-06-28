import prisma from './src/config/prisma';
async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true, organizationId: true, activeOrganizationId: true } });
  console.log('USERS:', JSON.stringify(users, null, 2));

  const pending = await prisma.assignment.findMany({ select: { id: true, title: true, status: true, organizationId: true } });
  console.log('ASSIGNMENTS:', JSON.stringify(pending, null, 2));
}
main().finally(() => prisma.$disconnect());
