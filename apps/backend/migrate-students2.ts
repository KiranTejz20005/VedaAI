import prisma from './src/config/prisma';

async function main() {
  try {
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
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
