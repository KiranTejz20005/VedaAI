import prisma from '../config/prisma';


export class CommunityService {
  /**
   * List community groups visible to the current user.
   */
  static async getGroups(organizationId: string | undefined, userId: string) {
    const groups = await prisma.communityGroup.findMany({
      where: {
        OR: [
          { type: 'PUBLIC' },
          ...(organizationId ? [{ organizationId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        members: {
          select: { userId: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      avatar: group.avatar,
      owner: group.owner,
      organizationId: group.organizationId,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      isMember: group.members.some((member) => member.userId === userId),
    }));
  }

  /**
   * Create a new community post
   */
  static async createPost(
    authorId: string,
    content: string,
    type: string,
    visibility: string,
    attachments: any[] = [],
    organizationId?: string,
    title?: string,
    tags?: string[]
  ) {
    return prisma.communityPost.create({
      data: {
        authorId,
        title,
        content,
        type,
        visibility,
        attachments,
        tags: tags ?? [],
        organizationId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  /**
   * Fetch a feed of posts
   */
  static async getFeed(organizationId?: string, limit: number = 20, cursor?: string) {
    const whereClause: any = {};
    if (organizationId) {
      whereClause.OR = [
        { visibility: 'PUBLIC' },
        { organizationId, visibility: 'ORG_ONLY' },
      ];
    } else {
      whereClause.visibility = 'PUBLIC';
    }

    return prisma.communityPost.findMany({
      where: whereClause,
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  /**
   * Create a community group
   */
  static async createGroup(
    ownerId: string,
    name: string,
    description: string,
    type: string,
    organizationId?: string
  ) {
    return prisma.communityGroup.create({
      data: {
        name,
        description,
        type,
        ownerId,
        organizationId,
        members: {
          create: [{ userId: ownerId, role: 'OWNER' }],
        },
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Join a community group
   */
  static async joinGroup(groupId: string, userId: string) {
    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new Error('Group not found');
    if (group.type === 'INVITE_ONLY') throw new Error('Group is invite-only');

    return prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      update: {},
      create: {
        groupId,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
