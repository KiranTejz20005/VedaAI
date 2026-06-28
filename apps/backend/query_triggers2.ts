import prisma from './src/config/prisma.js';

async function main() {
  try {
    const res = await prisma.$queryRaw\`SELECT event_object_table, trigger_name FROM information_schema.triggers;\`;
    console.log(res);
  } finally {
    await prisma.$disconnect();
  }
}
main();
