import prisma from './src/config/prisma';

async function main() {
  try {
    // get a user
    const user = await prisma.user.findFirst({ where: { organizationId: { not: null } } });
    if (!user) {
      console.log("No user found");
      return;
    }
    const userId = user.id;
    const organizationId = user.organizationId || user.activeOrganizationId;
    
    console.log("User:", userId, "Org:", organizationId);

    const group = await prisma.group.create({
      data: { 
        name: "Test Group", 
        description: "Test Desc",
        subject: 'General', 
        classId: null,
        facultyId: userId,
        organizationId: organizationId as string
      },
    });
    console.log("Group created:", group.id);

    const communityGroup = await prisma.communityGroup.create({
      data: {
        name: "Test Group",
        description: "Test Desc",
        ownerId: userId,
        type: 'PRIVATE',
        organizationId: organizationId as string,
      }
    });
    console.log("CommunityGroup created:", communityGroup.id);

    await prisma.groupMember.create({
      data: {
        groupId: communityGroup.id,
        userId: userId,
        role: 'OWNER'
      }
    });
    console.log("GroupMember created");

  } catch (error) {
    console.error("PRISMA ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
