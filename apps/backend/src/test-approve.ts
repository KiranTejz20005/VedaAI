import 'dotenv/config';
import prisma from './config/prisma';

async function test() {
  try {
    const id = 'b66248e3-3630-4265-b205-6760d8677760';
    const existing = await prisma.assignment.findUnique({ where: { id } });
    console.log('Exists?', !!existing);
    if (!existing) return;
    
    await prisma.$executeRaw`
      UPDATE "Assignment"
      SET "status" = 'PUBLISHED'
      WHERE id = ${id}
    `;
    console.log('Raw update successful');
  } catch (err: any) {
    require('fs').writeFileSync('prisma-error.json', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error('ERROR WRITTEN TO prisma-error.json');
  } finally {
    await prisma.$disconnect();
  }
}

test();
