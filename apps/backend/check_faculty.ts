import 'dotenv/config';
import prisma from './src/config/prisma';

async function main() {
  const user = await prisma.user.findFirst({
    where: { firstName: 'Arul', lastName: 'Thalaiva' }
  });

  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User ID:', user.id, user.email);
}

main().finally(() => prisma.$disconnect());
