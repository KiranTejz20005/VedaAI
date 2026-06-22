import prisma from '../config/prisma';

export class ChatService {
  /**
   * Save a message to the database
   */
  static async saveMessage(
    conversationId: string,
    senderId: string,
    message: string,
    attachments: any[] = []
  ) {
    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        message,
        attachments,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  /**
   * Fetch chat history for a conversation
   */
  static async getMessages(conversationId: string, limit: number = 50, cursor?: string) {
    return prisma.message.findMany({
      where: { conversationId },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'asc' }, // Order asc for sequential rendering in chat bubbles
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  /**
   * Get all users in the same organization, excluding the current user
   */
  static async getOrgUsers(organizationId: string | null, currentUserId: string) {
    if (!organizationId) {
      // In development, if organizationId is not set, return all other active users
      return prisma.user.findMany({
        where: {
          id: { not: currentUserId },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
      });
    }

    return prisma.user.findMany({
      where: {
        organizationId,
        id: { not: currentUserId },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });
  }

  /**
   * List all conversations (chats) that the current user has interacted in
   */
  static async getConversations(userId: string) {
    // 1. Get all group IDs the user belongs to
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const groupIds = memberships.map(m => m.groupId);

    // 2. Find unique conversationIds where user is participating
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { conversationId: { in: groupIds } },
          {
            AND: [
              { conversationId: { startsWith: 'dm_' } },
              { conversationId: { contains: userId } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['conversationId'],
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // 3. Populate details for each conversation (recipient name/avatar for DMs, group names for Groups)
    const conversations = await Promise.all(messages.map(async (msg) => {
      const isDM = msg.conversationId.startsWith('dm_');
      let name = '';
      let recipientId = '';
      let role = '';

      if (isDM) {
        const ids = msg.conversationId.replace('dm_', '').split('_');
        const otherId = ids.find(id => id !== userId) || '';
        recipientId = otherId;

        const otherUser = await prisma.user.findUnique({
          where: { id: otherId },
          select: { firstName: true, lastName: true, role: true }
        });

        if (otherUser) {
          name = `${otherUser.firstName} ${otherUser.lastName}`;
          role = otherUser.role;
        } else {
          name = 'Unknown Builder';
        }
      } else {
        const group = await prisma.communityGroup.findUnique({
          where: { id: msg.conversationId },
          select: { name: true }
        });
        name = group?.name || 'Unknown Group';
      }

      return {
        id: msg.conversationId,
        name,
        isDM,
        recipientId,
        role,
        lastMessage: msg.message,
        lastMessageTime: msg.createdAt,
        unreadCount: 0
      };
    }));

    return conversations;
  }
}
