import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { MessageType, RoomType, RoomMemberRole } from '@prisma/client';
import { SendPrivateMessageDto, MessageResponseDto } from '../dto/private-chat.dto';
import { SendGroupMessageDto } from '../dto/group-chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send a message to a group room
   */
  async sendGroupMessage(
    senderId: string,
    sendGroupMessageDto: SendGroupMessageDto,
  ): Promise<MessageResponseDto> {
    const { content, roomId, replyToId } = sendGroupMessageDto;

    // Verify user is a member of the room
    await this.verifyRoomMembership(senderId, roomId);

    // Check if messaging is enabled in the room
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { isMessagingEnabled: true, slowModeSeconds: true },
    });

    if (!room?.isMessagingEnabled) {
      throw new ForbiddenException('Messaging is disabled in this room');
    }

    // Check slow mode if enabled (only for MEMBERS, not ADMINS)
    if (room.slowModeSeconds) {
      // Get user's role in the room
      const memberRole = await this.prisma.roomMember.findFirst({
        where: {
          userId: senderId,
          roomId: roomId,
        },
        select: { role: true },
      });

      // Only apply slow mode to MEMBERS (ADMIN bypass slow mode)
      if (memberRole?.role === 'MEMBER') {
        await this.checkSlowMode(senderId, roomId, room.slowModeSeconds);
      }
    }

    // Verify reply message exists and is in the same room
    if (replyToId) {
      await this.verifyReplyMessage(replyToId, roomId);
    }

    // Create the message
    const message = await this.prisma.chatMessage.create({
      data: {
        content,
        senderId,
        roomId,
        replyToId,
        messageType: MessageType.TEXT,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    this.logger.log(`Message sent by ${senderId} to room ${roomId}`);
    return this.formatMessageResponse(message);
  }

  /**
   * Send private message between two users
   */
  async sendPrivateMessage(
    senderId: string,
    sendPrivateMessageDto: SendPrivateMessageDto,
  ): Promise<MessageResponseDto> {
    const { recipientId, content, replyToId } = sendPrivateMessageDto;

    // Get or create private room
    const room = await this.getOrCreatePrivateRoom(senderId, recipientId);

    // Verify reply message exists and is in the same room
    if (replyToId) {
      await this.verifyReplyMessage(replyToId, room.id);
    }

    // Create the message
    const message = await this.prisma.chatMessage.create({
      data: {
        content,
        senderId,
        roomId: room.id,
        replyToId,
        messageType: MessageType.TEXT,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    this.logger.log(`Private message sent from ${senderId} to ${recipientId}`);
    return this.formatMessageResponse(message);
  }

  /**
   * Get messages from a room with cursor pagination
   */
  async getMessages(
    roomId: string, 
    limit: number = 50, 
    cursor?: string, // ISO timestamp string to start from
    direction: 'before' | 'after' = 'before'
  ) {
    // Convert cursor string to Date if provided
    const cursorDate = cursor ? new Date(cursor) : null;
    
    const cursorCondition = cursorDate ? {
      sentAt: direction === 'before' ? { lt: cursorDate } : { gt: cursorDate }
    } : {};

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        roomId,
        isDeleted: false,
        ...cursorCondition,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
      orderBy: {
        sentAt: direction === 'before' ? 'desc' : 'asc',
      },
      take: limit + 1, // Get one extra to check if there are more
    });

    const hasMore = messages.length > limit;
    const actualMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: actualMessages.map(message => this.formatMessageResponse(message)),
      hasMore,
      // Return timestamp cursors for next/prev pagination
      nextCursor: hasMore ? actualMessages[actualMessages.length - 1].sentAt.toISOString() : null,
      prevCursor: actualMessages.length > 0 ? actualMessages[0].sentAt.toISOString() : null,
    };
  }

  /**
   * Get private chat history between two users (wrapper for getMessages)
   */
  async getPrivateChatHistory(
    userId: string, 
    recipientId: string, 
    limit: number = 50, 
    cursor?: string,
    direction: 'before' | 'after' = 'before'
  ) {
    // Get or create the private room to ensure it exists
    const room = await this.getOrCreatePrivateRoom(userId, recipientId);
    
    // Use the consolidated getMessages function
    const result = await this.getMessages(room.id, limit, cursor, direction);
    
    return {
      ...result,
      roomId: room.id,
      recipientId,
    };
  }

  /**
   * Get a single message by ID for reply preview
   */
  async getMessageById(messageId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: {
        id: messageId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!message) {
      return null;
    }

    return this.formatMessageResponse(message);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: string, roomId: string, messageIds: string[]) {
    // Verify user is a member of the room
    await this.verifyRoomMembership(userId, roomId);

    // Verify all messages belong to the room
    const messagesInRoom = await this.prisma.chatMessage.findMany({
      where: {
        id: { in: messageIds },
        roomId: roomId,
      },
      select: { id: true },
    });

    if (messagesInRoom.length !== messageIds.length) {
      throw new NotFoundException('Some messages not found in this room');
    }

    // Create read receipts
    const readReceipts = messageIds.map(messageId => ({
      messageId,
      userId,
    }));

    await this.prisma.messageReadReceipt.createMany({
      data: readReceipts,
      skipDuplicates: true,
    });

    this.logger.log(`User ${userId} marked ${messageIds.length} messages as read`);
  }

  /**
   * Get user's rooms
   */
  async getUserRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        courseClass: {
          select: {
            id: true,
            course: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      roomType: room.type,
      memberCount: room._count.members,
      course: room.courseClass?.course || room.course,
      createdAt: room.createdAt,
    }));
  }

  /**
   * Validate user access to a group room (CLASS or SECTION)
   */
  async validateGroupAccess(userId: string, roomId: string): Promise<boolean> {
    try {
      // Check if user is a member of the room
      const membership = await this.prisma.roomMember.findFirst({
        where: {
          userId,
          roomId,
        },
        include: {
          room: {
            select: {
              type: true,
              courseClassId: true,
              courseId: true,
              taId: true,
            },
          },
        },
      });

      if (!membership) {
        return false;
      }

      // For CLASS rooms, verify access
      if (membership.room.type === 'CLASS' && membership.room.courseClassId) {
        // Check if user is a student enrolled in the class
        const studentEnrollment = await this.prisma.courseEnrollment.findFirst({
          where: {
            userId,
            classId: membership.room.courseClassId,
          },
        });
        
        if (studentEnrollment) {
          return true;
        }

        // Check if user is a professor of this class
        const professorAssignment = await this.prisma.classProfessor.findFirst({
          where: {
            professorId: userId,
            classId: membership.room.courseClassId,
          },
        });
        
        return !!professorAssignment;
      }

      // For SECTION rooms, verify access
      if (membership.room.type === 'SECTION') {
        // Check if user is the TA for this room
        if (membership.room.taId === userId) {
          return true;
        }

        // Check if user is a student enrolled in this course/section
        if (membership.room.courseId) {
          const studentEnrollment = await this.prisma.courseEnrollment.findFirst({
            where: {
              userId,
              courseId: membership.room.courseId,
            },
          });
          return !!studentEnrollment;
        }
      }

      // For PRIVATE rooms, membership is sufficient
      return membership.room.type === 'PRIVATE';
    } catch (error) {
      this.logger.error(`Error validating group access: ${error.message}`);
      return false;
    }
  }

  /**
   * Get room members with their details
   */
  async getRoomMembers(roomId: string) {
    const members = await this.prisma.roomMember.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            isActive: true,
          },
        },
      },
    });

    return members.map(member => ({
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: `${member.user.firstName} ${member.user.lastName}`,
        avatar: member.user.profileImageUrl,
        isActive: member.user.isActive,
      },
    }));
  }

  private async verifyRoomMembership(userId: string, roomId: string) {
    const membership = await this.prisma.roomMember.findFirst({
      where: {
        userId,
        roomId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this room');
    }
  }

  private async checkSlowMode(senderId: string, roomId: string, slowModeSeconds: number) {
    const cutoff = new Date(Date.now() - slowModeSeconds * 1000);

    const recentMessage = await this.prisma.chatMessage.findFirst({
      where: {
        senderId,
        roomId,
        sentAt: {
          gte: cutoff,
        },
      },
    });

    if (recentMessage) {
      throw new ForbiddenException(`Slow mode active. Please wait ${slowModeSeconds} seconds between messages.`);
    }
  }

  private async verifyReplyMessage(replyToId: string, roomId: string) {
    const replyMessage = await this.prisma.chatMessage.findFirst({
      where: {
        id: replyToId,
        roomId,
        isDeleted: false,
      },
    });

    if (!replyMessage) {
      throw new NotFoundException('Reply message not found in this room');
    }
  }

  /**
   * Get or create a private room between two users
   */
  private async getOrCreatePrivateRoom(user1Id: string, user2Id: string) {
    // Sort user IDs to ensure consistent room lookup
    const [firstUserId, secondUserId] = [user1Id, user2Id].sort();

    // Check if room already exists
    let room = await this.prisma.chatRoom.findFirst({
      where: {
        type: RoomType.PRIVATE,
        members: {
          every: {
            userId: {
              in: [firstUserId, secondUserId],
            },
          },
        },
        AND: [
          {
            members: {
              some: {
                userId: firstUserId,
              },
            },
          },
          {
            members: {
              some: {
                userId: secondUserId,
              },
            },
          },
        ],
      },
    });

    // Create room if it doesn't exist
    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          name: `Private Chat`,
          description: `Private conversation between two users`,
          type: RoomType.PRIVATE,
          members: {
            create: [
              { userId: user1Id, role: RoomMemberRole.MEMBER },
              { userId: user2Id, role: RoomMemberRole.MEMBER },
            ],
          },
        },
      });

      this.logger.log(`Created private room between ${user1Id} and ${user2Id}`);
    }

    return room;
  }

  private formatMessageResponse(message: any): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      roomId: message.roomId,
      messageType: message.messageType,
      sentAt: message.sentAt,
      isEdited: message.isEdited,
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        senderName: `${message.replyTo.sender.firstName} ${message.replyTo.sender.lastName}`,
      } : undefined,
      attachments: message.attachments?.map((attachment: any) => ({
        id: attachment.file.id,
        originalName: attachment.file.originalName,
        filePath: attachment.file.filePath,
        mimeType: attachment.file.mimeType,
      })),
    };
  }
}
