import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });
import prisma from './src/config/prisma';
async function main() {
  const userId = '08c528f1-7e23-4624-b539-a1ba27e7b593';
  const orgId = '3cb17cc1-00c4-4eff-9f68-42dd5526f98f';
  try {
    const assignment = await prisma.assignment.create({
      data: {
        title: 'Machine Learning Basics',
        subject: 'Computer Science',
        dueDate: new Date('2026-06-29T00:00:00.000Z'),
        duration: 60,
        totalMarks: 60,
        status: 'DRAFT',
        organizationId: orgId,
        createdById: userId,
        classId: null,
        questionConfig: { types: ['mcq'], count: 10, difficulty: { easy: 34, medium: 33, hard: 33 } }
      }
    });
    console.log('Assignment created!', assignment.id);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
