import { Injectable, Logger, ForbiddenException, NotFoundException, UseInterceptors } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { MessageType, RoomType, RoomMemberRole } from '@prisma/client';
import { SendPrivateMessageDto, MessageResponseDto } from '../dto/private-chat.dto';
import { SendGroupMessageDto } from '../dto/group-chat.dto';
import { FilesService } from '../../files/services/files.service';
import { FileValidationService } from '../../files/services/file-validation.service';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { Cache, CacheInvalidate } from '../../../common/decorators/cache.decorator';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private fileValidationService: FileValidationService,
  ) {}

  /**
   * Send a message to a group room
   */
  @CacheInvalidate({
    keys: [
      'chat:messages:{{sendGroupMessageDto.roomId}}:*',
      'chat:rooms:{{senderId}}:*',
      'chat:unread:*'
    ],
    condition: (result) => result && result.id
  })
  async sendGroupMessage(
    senderId: string,
    sendGroupMessageDto: SendGroupMessageDto,
  ): Promise<MessageResponseDto> {
    const { content, roomId, replyToId, attachments } = sendGroupMessageDto;

    // Verify user is a member of the room
    await this.verifyRoomMembership(senderId, roomId);

    // Check all message permissions (mute, block, slow mode, room settings)
    const permissionCheck = await this.checkMessagePermissions(senderId, roomId);
    if (!permissionCheck.canSend) {
      throw new ForbiddenException(permissionCheck.reason);
    }

    // Verify reply message exists and is in the same room
    if (replyToId) {
      await this.verifyReplyMessage(replyToId, roomId);
    }

    // Validate and verify file attachments if provided
    if (attachments && attachments.length > 0) {
      await this.validateMessageFiles(attachments, senderId);
    }

    // Determine message type based on content and attachments
    let messageType: MessageType = MessageType.TEXT;
    if (attachments && attachments.length > 0) {
      messageType = content ? MessageType.TEXT : MessageType.FILE; // Keep TEXT if mixed, FILE if only attachments
    }

    // Create the message
    const message = await this.prisma.chatMessage.create({
      data: {
        content,
        senderId,
        roomId,
        replyToId,
        messageType,
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
            file: {
              include: {
                uploader: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Associate files with the message if any
    if (attachments && attachments.length > 0) {
      await this.associateFilesWithMessage(message.id, attachments.map(a => a.fileId));
    }

    // Update lastMessageAt for slow mode tracking
    await this.prisma.roomMember.updateMany({
      where: {
        userId: senderId,
        roomId: roomId,
      },
      data: {
        lastMessageAt: new Date(),
      },
    });

    this.logger.log(`Message sent by ${senderId} to room ${roomId}`);
    return this.formatMessageResponse(message);
  }

  /**
   * Send private message between two users
   */
  @CacheInvalidate({
    keys: [
      'chat:messages:{{room.id}}:*',
      'chat:rooms:{{senderId}}:*',
      'chat:rooms:{{sendPrivateMessageDto.receiverId}}:*',
      'chat:private:{{senderId}}:{{sendPrivateMessageDto.receiverId}}:*',
      'chat:unread:*'
    ],
    condition: (result) => result && result.id
  })
  async sendPrivateMessage(
    senderId: string,
    sendPrivateMessageDto: SendPrivateMessageDto,
  ): Promise<MessageResponseDto> {
    const { recipientId, content, replyToId, attachments } = sendPrivateMessageDto;

    // Get or create private room
    const room = await this.getOrCreatePrivateRoom(senderId, recipientId);

    // Verify reply message exists and is in the same room
    if (replyToId) {
      await this.verifyReplyMessage(replyToId, room.id);
    }

    // Validate and verify file attachments if provided
    if (attachments && attachments.length > 0) {
      await this.validateMessageFiles(attachments, senderId);
    }

    // Determine message type based on content and attachments
    let messageType: MessageType = MessageType.TEXT;
    if (attachments && attachments.length > 0) {
      messageType = content ? MessageType.TEXT : MessageType.FILE; // Keep TEXT if mixed, FILE if only attachments
    }

    // Create the message
    const message = await this.prisma.chatMessage.create({
      data: {
        content,
        senderId,
        roomId: room.id,
        replyToId,
        messageType,
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
            file: {
              include: {
                uploader: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Associate files with the message if any
    if (attachments && attachments.length > 0) {
      await this.associateFilesWithMessage(message.id, attachments.map(a => a.fileId));
    }

    // Update lastMessageAt for slow mode tracking (if applicable for private rooms)
    await this.prisma.roomMember.updateMany({
      where: {
        userId: senderId,
        roomId: message.roomId,
      },
      data: {
        lastMessageAt: new Date(),
      },
    });

    this.logger.log(`Private message sent from ${senderId} to ${recipientId}`);
    return this.formatMessageResponse(message);
  }

  /**
   * Get messages from a room with cursor pagination
   */
  @Cache({
    key: 'chat:messages:{{roomId}}:{{limit}}:{{cursor}}:{{direction}}',
    ttl: 300 // 5 minutes
  })
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
            file: {
              include: {
                uploader: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
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
  @CacheInvalidate({
    keys: [
      'chat:unread:{{userId}}:*',
      'chat:rooms:{{userId}}:*'
    ]
  })
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
  @Cache({
    key: 'chat:rooms:{{userId}}',
    ttl: 600 // 10 minutes
  })
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
      editedAt: message.editedAt,
      isDeleted: message.isDeleted,
      deletedAt: message.deletedAt,
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
        fileSize: attachment.file.fileSize,
        fileCategory: this.fileValidationService.getFileCategory(attachment.file.mimeType),
        thumbnails: attachment.file.thumbnails || undefined,
        serveUrl: `/files/${attachment.file.id}/serve`,
      })),
    };
  }

  /**
   * Validate message file attachments
   */
  private async validateMessageFiles(attachments: Array<{fileId: string}>, senderId: string): Promise<void> {
    for (const attachment of attachments) {
      // Check if file exists and belongs to the sender
      const file = await this.prisma.file.findFirst({
        where: {
          id: attachment.fileId,
          uploadedBy: senderId, // Only allow sender's own files
          uploadContext: 'CHAT_MESSAGE', // Only chat files
        },
      });

      if (!file) {
        throw new NotFoundException(`File ${attachment.fileId} not found or access denied`);
      }
    }
  }

  /**
   * Associate files with a message
   */
  private async associateFilesWithMessage(messageId: string, fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) return;

    const associations = fileIds.map(fileId => ({
      messageId,
      fileId,
    }));

    await this.prisma.messageFile.createMany({
      data: associations,
      skipDuplicates: true,
    });

    // Update the contextId of files to reference the message
    await this.prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { contextId: messageId },
    });

    this.logger.log(`Associated ${fileIds.length} files with message ${messageId}`);
  }

  /**
   * Edit a message
   */
  @CacheInvalidate({
    keys: [
      'chat:messages:{{message.roomId}}:*',
      'chat:rooms:{{userId}}:*'
    ],
    condition: (result) => result && result.id
  })
  async editMessage(userId: string, messageId: string, newContent: string) {
    // First, verify the message exists and belongs to the user
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        isDeleted: false,
      },
      include: {
        room: true,
        sender: true,
      },
    });

    if (!message) {
      throw new Error('Message not found or you do not have permission to edit it');
    }

    // Update the message
    const updatedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: true,
        room: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    this.logger.log(`Message ${messageId} edited by user ${userId}`);

    return this.formatMessageResponse(updatedMessage);
  }

  /**
   * Delete a message (soft delete)
   */
  @CacheInvalidate({
    keys: [
      'chat:messages:{{message.roomId}}:*',
      'chat:rooms:{{userId}}:*'
    ],
    condition: (result) => result && result.id
  })
  async deleteMessage(userId: string, messageId: string) {
    // First, verify the message exists and belongs to the user
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        isDeleted: false,
      },
      include: {
        room: true,
        sender: true,
      },
    });

    if (!message) {
      throw new Error('Message not found or you do not have permission to delete it');
    }

    // Soft delete the message
    const deletedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null, // Clear content for privacy
      },
      include: {
        sender: true,
        room: true,
      },
    });

    this.logger.log(`Message ${messageId} deleted by user ${userId}`);

    return {
      id: deletedMessage.id,
      roomId: deletedMessage.roomId,
      senderId: deletedMessage.senderId,
      isDeleted: true,
      deletedAt: deletedMessage.deletedAt,
    };
  }

  // ==========================================
  // ADMIN FEATURES & MODERATION
  // ==========================================

  /**
   * Check if user has admin privileges in a room
   */
  private async verifyAdminAccess(userId: string, roomId: string): Promise<void> {
    // Check if user is system admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return; // System admins have access to all rooms
    }

    // Check room membership and role
    const membership = await this.prisma.roomMember.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
        role: 'ADMIN',
      },
    });

    if (!membership) {
      throw new ForbiddenException('Admin access required for this action');
    }
  }

  /**
   * Toggle room messaging on/off
   */
  async toggleRoomMessaging(adminId: string, roomId: string, isEnabled?: boolean): Promise<boolean> {
    await this.verifyAdminAccess(adminId, roomId);

    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { isMessagingEnabled: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const newState = isEnabled !== undefined ? isEnabled : !room.isMessagingEnabled;

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { isMessagingEnabled: newState },
    });

    this.logger.log(`Room ${roomId} messaging ${newState ? 'enabled' : 'disabled'} by admin ${adminId}`);
    return newState;
  }

  /**
   * Set slow mode for a room
   */
  async setSlowMode(adminId: string, roomId: string, slowModeSeconds: number): Promise<void> {
    await this.verifyAdminAccess(adminId, roomId);

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { slowModeSeconds: slowModeSeconds === 0 ? null : slowModeSeconds },
    });

    this.logger.log(`Room ${roomId} slow mode set to ${slowModeSeconds}s by admin ${adminId}`);
  }

  /**
   * Invite user to room
   */
  async inviteUser(adminId: string, roomId: string, userId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER'): Promise<void> {
    await this.verifyAdminAccess(adminId, roomId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.roomMember.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
      },
    });

    if (existingMembership) {
      if (existingMembership.isBlocked) {
        // Unblock and re-add user
        await this.prisma.roomMember.update({
          where: { id: existingMembership.id },
          data: {
            isBlocked: false,
            blockedAt: null,
            blockedBy: null,
            role: role,
            joinedAt: new Date(),
          },
        });
        this.logger.log(`User ${userId} unblocked and re-invited to room ${roomId} by admin ${adminId}`);
        return;
      } else {
        throw new ForbiddenException('User is already a member of this room');
      }
    }

    // Add user to room
    await this.prisma.roomMember.create({
      data: {
        userId: userId,
        roomId: roomId,
        role: role,
      },
    });

    this.logger.log(`User ${userId} invited to room ${roomId} with role ${role} by admin ${adminId}`);
  }

  /**
   * Remove/kick user from room
   */
  async removeUser(adminId: string, roomId: string, userId: string, reason?: string): Promise<void> {
    await this.verifyAdminAccess(adminId, roomId);

    if (adminId === userId) {
      throw new ForbiddenException('Cannot remove yourself from the room');
    }

    const membership = await this.prisma.roomMember.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
      },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this room');
    }

    // Block user (soft removal)
    await this.prisma.roomMember.update({
      where: { id: membership.id },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedBy: adminId,
      },
    });

    this.logger.log(`User ${userId} removed from room ${roomId} by admin ${adminId}. Reason: ${reason || 'No reason provided'}`);
  }

  /**
   * Mute user in room
   */
  async muteUser(adminId: string, roomId: string, userId: string, reason?: string): Promise<void> {
    await this.verifyAdminAccess(adminId, roomId);

    if (adminId === userId) {
      throw new ForbiddenException('Cannot mute yourself');
    }

    const membership = await this.prisma.roomMember.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
        isBlocked: false,
      },
    });

    if (!membership) {
      throw new NotFoundException('User is not an active member of this room');
    }

    if (membership.role === 'ADMIN') {
      throw new ForbiddenException('Cannot mute another admin');
    }

    await this.prisma.roomMember.update({
      where: { id: membership.id },
      data: {
        isMuted: true,
        mutedAt: new Date(),
        mutedBy: adminId,
      },
    });

    this.logger.log(`User ${userId} muted in room ${roomId} by admin ${adminId}. Reason: ${reason || 'No reason provided'}`);
  }

  /**
   * Unmute user in room
   */
  async unmuteUser(adminId: string, roomId: string, userId: string): Promise<void> {
    await this.verifyAdminAccess(adminId, roomId);

    const membership = await this.prisma.roomMember.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
        isMuted: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('User is not muted in this room');
    }

    await this.prisma.roomMember.update({
      where: { id: membership.id },
      data: {
        isMuted: false,
        mutedAt: null,
        mutedBy: null,
      },
    });

    this.logger.log(`User ${userId} unmuted in room ${roomId} by admin ${adminId}`);
  }

  /**
   * Pin a message
   */
  async pinMessage(adminId: string, roomId: string, messageId: string): Promise<void> {
    await this.verifyAdminAccess(adminId, roomId);

    // Check if message exists and belongs to the room
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        roomId: roomId,
        isDeleted: false,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found or already deleted');
    }

    // Check current pinned messages count (max 5)
    const pinnedCount = await this.prisma.pinnedMessage.count({
      where: { roomId: roomId },
    });

    if (pinnedCount >= 5) {
      throw new ForbiddenException('Maximum of 5 messages can be pinned per room');
    }

    // Check if already pinned
    const existingPin = await this.prisma.pinnedMessage.findFirst({
      where: {
        roomId: roomId,
        messageId: messageId,
      },
    });

    if (existingPin) {
      throw new ForbiddenException('Message is already pinned');
    }

    await this.prisma.pinnedMessage.create({
      data: {
        roomId: roomId,
        messageId: messageId,
        pinnedBy: adminId,
      },
    });

    this.logger.log(`Message ${messageId} pinned in room ${roomId} by admin ${adminId}`);
  }

  /**
   * Unpin a message
   */
  async unpinMessage(adminId: string, roomId: string, messageId: string): Promise<void> {
    await this.verifyAdminAccess(adminId, roomId);

    const pinnedMessage = await this.prisma.pinnedMessage.findFirst({
      where: {
        roomId: roomId,
        messageId: messageId,
      },
    });

    if (!pinnedMessage) {
      throw new NotFoundException('Message is not pinned in this room');
    }

    await this.prisma.pinnedMessage.delete({
      where: { id: pinnedMessage.id },
    });

    this.logger.log(`Message ${messageId} unpinned in room ${roomId} by admin ${adminId}`);
  }

  /**
   * Admin delete any message
   */
  async adminDeleteMessage(adminId: string, roomId: string, messageId: string, reason?: string): Promise<any> {
    await this.verifyAdminAccess(adminId, roomId);

    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        roomId: roomId,
        isDeleted: false,
      },
      include: {
        sender: true,
        room: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found or already deleted');
    }

    // Soft delete the message
    const deletedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null, // Clear content for privacy
      },
      include: {
        sender: true,
        room: true,
      },
    });

    this.logger.log(`Message ${messageId} deleted by admin ${adminId} in room ${roomId}. Reason: ${reason || 'No reason provided'}`);

    return {
      id: deletedMessage.id,
      roomId: deletedMessage.roomId,
      senderId: deletedMessage.senderId,
      isDeleted: true,
      deletedAt: deletedMessage.deletedAt,
      deletedBy: adminId,
      reason: reason,
    };
  }

  /**
   * Get pinned messages for a room
   */
  async getPinnedMessages(roomId: string): Promise<any[]> {
    const pinnedMessages = await this.prisma.pinnedMessage.findMany({
      where: { roomId: roomId },
      include: {
        message: {
          include: {
            sender: true,
            attachments: {
              include: {
                file: true,
              },
            },
          },
        },
        user: true, // Admin who pinned it
      },
      orderBy: { pinnedAt: 'desc' },
    });

    return pinnedMessages.map(pin => ({
      ...this.formatMessageResponse(pin.message),
      pinnedBy: pin.user.firstName + ' ' + pin.user.lastName,
      pinnedAt: pin.pinnedAt,
    }));
  }

  /**
   * Check if user can send message (not muted, not blocked, slow mode check)
   */
  async checkMessagePermissions(userId: string, roomId: string): Promise<{ canSend: boolean; reason?: string; waitTime?: number }> {
    const membership = await this.prisma.roomMember.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
      },
      include: {
        room: true,
      },
    });

    if (!membership) {
      return { canSend: false, reason: 'You are not a member of this room' };
    }

    if (membership.isBlocked) {
      return { canSend: false, reason: 'You have been removed from this room' };
    }

    if (membership.isMuted) {
      return { canSend: false, reason: 'You are muted in this room' };
    }

    if (!membership.room.isMessagingEnabled) {
      return { canSend: false, reason: 'Messaging is disabled in this room' };
    }

    // Check slow mode (only for MEMBERS)
    if (membership.room.slowModeSeconds && membership.role === 'MEMBER') {
      if (membership.lastMessageAt) {
        const timeSinceLastMessage = Date.now() - membership.lastMessageAt.getTime();
        const slowModeMs = membership.room.slowModeSeconds * 1000;
        
        if (timeSinceLastMessage < slowModeMs) {
          const waitTime = Math.ceil((slowModeMs - timeSinceLastMessage) / 1000);
          return { 
            canSend: false, 
            reason: `Slow mode active. Please wait ${waitTime} more seconds.`,
            waitTime: waitTime 
          };
        }
      }
    }

    return { canSend: true };
  }
}
