import 'dotenv/config';
import prisma from './src/config/prisma';
import { CommunityService } from './src/services/community.service';

async function main() {
  const student = await prisma.user.findFirst({ where: { email: 'kiranteja@spec.com' } });
  if (!student) {
    console.log('Student not found');
    return;
  }
  console.log('Found student:', student.email);
  const groups = await CommunityService.getGroups(student.organizationId ?? undefined, student.id);
  console.log('Student Groups:');
  groups.forEach(g => console.log(g.id, g.name, g.isMember));
}

main().finally(() => prisma.$disconnect());
