const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const session = await prisma.quizSession.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { questions: true }
  });
  console.log(JSON.stringify(session, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
