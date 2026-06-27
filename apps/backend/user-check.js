const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findUnique({ where: { email: 'arulthalaiva@spec.com' } });
  console.log(user);
  prisma.$disconnect();
}
run();
