import 'dotenv/config';
import prisma from './src/config/prisma';

async function main() {
  const user = await prisma.user.findFirst({
    where: { firstName: 'Kiran Teja' }
  });

  if (!user) {
    console.log('User Kiran Teja not found');
    return;
  }
  
  console.log('User:', user.id, user.email);
  
  const groupStudents = await prisma.groupStudent.findMany({
    where: { email: user.email }
  });
  
  console.log('GroupStudents for user:', groupStudents.map(g => g.groupId));

  const groups = await prisma.group.findMany({
    where: {
      id: { in: groupStudents.map(g => g.groupId) }
    }
  });

  console.log('Academic Groups for user:', groups.map(g => g.name));
  
  const members = await prisma.groupMember.findMany({
    where: { userId: user.id }
  });
  
  console.log('GroupMember records for user:', members.map(m => m.groupId));
}

main().finally(() => prisma.$disconnect());
