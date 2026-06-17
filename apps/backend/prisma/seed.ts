import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { id: 'demo-faculty-id' } });
  if (existing) {
    console.log('Demo data already seeded, skipping.');
    return;
  }

  const inst = await prisma.institution.create({
    data: {
      id: 'demo-inst-id',
      name: 'VedaAI Demo School',
      domain: 'vedaai.demo',
    },
  });

  await prisma.user.create({
    data: {
      id: 'demo-faculty-id',
      email: 'demo@bloomverify.com',
      passwordHash: 'demo-hash',
      firstName: 'Demo',
      lastName: 'Faculty',
      role: 'FACULTY',
      institutionId: inst.id,
      preferences: {
        emailNotifications: true,
        inAppAlerts: true,
        autoSave: true,
        weeklyDigest: false,
      },
    },
  });

  const group = await prisma.classGroup.create({
    data: {
      id: 'demo-group-1',
      name: 'Class 10-A',
      subject: 'Computer Science',
      userId: 'demo-faculty-id',
    },
  });

  await prisma.student.createMany({
    data: [
      { id: 'demo-student-1', groupId: group.id, name: 'Alice Johnson', rollNo: 'R-101', email: 'alice.johnson@school.edu' },
      { id: 'demo-student-2', groupId: group.id, name: 'Bob Smith', rollNo: 'R-102', email: 'bob.smith@school.edu' },
      { id: 'demo-student-3', groupId: group.id, name: 'Charlie Brown', rollNo: 'R-103', email: 'charlie.brown@school.edu' },
    ],
  });

  await prisma.syllabus.create({
    data: {
      id: 'demo-syllabus-1',
      title: 'Class 10 Computer Science Syllabus',
      subject: 'Computer Science',
      grade: 'Class 10',
      userId: 'demo-faculty-id',
      topics: {
        create: [
          {
            id: 'demo-topic-1',
            title: 'Introduction to Programming',
            description: 'Basics of programming languages and logic',
            duration: 120,
            topicOrder: 0,
            subtopics: {
              create: [
                { id: 'demo-subtopic-1', title: 'What is Programming?', topicOrder: 0 },
                { id: 'demo-subtopic-2', title: 'Variables & Data Types', topicOrder: 1 },
                { id: 'demo-subtopic-3', title: 'Control Structures', topicOrder: 2 },
              ],
            },
          },
          {
            id: 'demo-topic-2',
            title: 'Data Structures',
            description: 'Arrays, Lists, and Dictionaries',
            duration: 180,
            topicOrder: 1,
            subtopics: {
              create: [
                { id: 'demo-subtopic-4', title: 'Arrays', topicOrder: 0 },
                { id: 'demo-subtopic-5', title: 'Linked Lists', topicOrder: 1 },
                { id: 'demo-subtopic-6', title: 'Stacks & Queues', topicOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seed complete: demo Institution, User, Group (3 students), and Syllabus (2 topics, 6 subtopics).');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
