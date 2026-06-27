import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });
import prisma from './src/config/prisma';
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'arulthalaiva@spec.com' } });
  console.log('User:', user);
  if (user && user.organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    console.log('Org in DB:', org);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
