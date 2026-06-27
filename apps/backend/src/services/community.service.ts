import prisma from '../config/prisma';


export class CommunityService {
  /**
   * List community groups visible to the current user.
   */
  static async getGroups(organizationId: string | undefined, userId: string) {
    const groups = await prisma.communityGroup.findMany({
      where: {
        OR: [
          // Public and invite-only groups in the organization
          {
            type: { in: ['PUBLIC', 'INVITE_ONLY'] },
            ...(organizationId ? { organizationId } : {}),
          },
          // Private groups the user is already a member of
          {
            type: 'PRIVATE',
            members: { some: { userId } }
          }
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
    if (group.type === 'INVITE_ONLY' || group.type === 'PRIVATE') {
      throw new Error('This group requires an invitation to join.');
    }

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

  /**
   * Search for users to invite to a group
   */
  static async searchUsers(query: string, excludeGroupId?: string) {
    if (!query || query.length < 2) return [];
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        ...(excludeGroupId ? {
          NOT: {
            groupMemberships: {
              some: { groupId: excludeGroupId }
            }
          }
        } : {})
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      take: 10
    });
    
    return users;
  }

  /**
   * Invite a user to a group (by owner)
   */
  static async inviteToGroup(groupId: string, ownerId: string, inviteeIdentifier: string) {
    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new Error('Group not found');
    if (group.ownerId !== ownerId) throw new Error('Only the group owner can invite members');

    // Find the user to invite (by email or ID)
    const userToInvite = await prisma.user.findFirst({
      where: {
        OR: [
          { email: inviteeIdentifier },
          { id: inviteeIdentifier }
        ]
      }
    });

    if (!userToInvite) throw new Error('User not found');

    return prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: userToInvite.id,
        },
      },
      update: {},
      create: {
        groupId,
        userId: userToInvite.id,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Get all members of a group
   */
  static async getGroupMembers(groupId: string, userId: string) {
    // Validate if the user has access to see members (owner or member of private groups)
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    
    if (!group) throw new Error('Group not found');
    if (group.type === 'PRIVATE' && !membership) {
      throw new Error('Unauthorized');
    }

    return prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { joinedAt: 'asc' }
    });
  }

  // --- New Methods for Posts ---

  static async getPost(postId: string) {
    return prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        }
      }
    });
  }

  static async updatePost(postId: string, userId: string, data: { title?: string, content?: string, status?: string }) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== userId) throw new Error('Unauthorized');
    return prisma.communityPost.update({
      where: { id: postId },
      data
    });
  }

  static async deletePost(postId: string, userId: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== userId) throw new Error('Unauthorized');
    return prisma.communityPost.delete({ where: { id: postId } });
  }

  // --- Comments ---

  static async getComments(postId: string) {
    return prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      }
    });
  }

  static async addComment(postId: string, authorId: string, content: string) {
    const comment = await prisma.communityComment.create({
      data: {
        postId,
        authorId,
        content
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      }
    });

    // Update comment count
    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } }
    });

    return comment;
  }

  // --- Save / Bookmark ---

  static async toggleSavePost(postId: string, userId: string) {
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });

    if (existing) {
      await prisma.savedPost.delete({
        where: { id: existing.id }
      });
      return { saved: false };
    } else {
      await prisma.savedPost.create({
        data: { userId, postId }
      });
      return { saved: true };
    }
  }

  // --- New Methods for Group Chat ---

  static async getGroupMessages(groupId: string, userId: string, limit = 50, cursor?: string) {
    // Validate if the user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (!membership) {
      const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
      if (!group || (group.type === 'PRIVATE' && group.ownerId !== userId)) {
        throw new Error('Unauthorized');
      }
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: groupId },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      }
    });

    return messages.reverse();
  }

  static async sendGroupMessage(groupId: string, userId: string, content: string, attachments: any[] = []) {
    // Validate membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (!membership) {
      const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
      if (!group || (group.type === 'PRIVATE' && group.ownerId !== userId)) {
        throw new Error('Unauthorized');
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: groupId,
        senderId: userId,
        message: content,
        attachments
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      }
    });

    return message;
  }
}
