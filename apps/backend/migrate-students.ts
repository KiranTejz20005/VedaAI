import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  let count = 0;
  for (const s of students) {
    const pref = s.preferences as any;
    if (pref && pref.classId && !s.classId) {
      await prisma.user.update({
        where: { id: s.id },
        data: { classId: pref.classId }
      });
      count++;
    }
  }
  console.log(`Successfully migrated ${count} students to use relational classId.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
