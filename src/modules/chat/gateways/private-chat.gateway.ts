import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { ChatService } from '../services/chat.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { OnlineStatusService } from '../services/online-status.service'; // 🆕 Phase 3
import { PrismaService } from '../../../../prisma/prisma.service'; // 🆕 For user queries
import { SendPrivateMessageDto, TypingDto, GetPrivateMessagesDto, EditMessageDto, DeleteMessageDto } from '../dto/private-chat.dto';

@WebSocketGateway({
  namespace: '/chat/private',
  cors: {
    origin: '*', // Configure this properly for production
  },
})
@UseGuards(WsJwtGuard)
export class PrivateChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PrivateChatGateway.name);
  private userSockets = new Map<string, string>(); // userId -> socketId (single session)

  constructor(
    private chatService: ChatService,
    private notificationService: NotificationService, // 🆕 Inject notification service
    private onlineStatusService: OnlineStatusService, // 🆕 Phase 3: Online status tracking
    private prisma: PrismaService, // 🆕 For user queries
  ) {}

  // Connection handlers
  async handleConnection(client: Socket) {
    try {
      const userId = client.data.user?.id;
      
      if (!userId) {
        this.logger.warn('Client connected without user data');
        client.disconnect();
        return;
      }

      // Disconnect existing session if any (single session per user)
      const existingSocketId = this.userSockets.get(userId);
      if (existingSocketId) {
        const existingSocket = this.server.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.emit('session_replaced', {
            message: 'Your session has been replaced by a new login',
            timestamp: new Date().toISOString(),
          });
          existingSocket.disconnect(true);
        }
      }

      // Track new socket connection
      this.userSockets.set(userId, client.id);

      // 🆕 Mark user as online in online status service
      this.onlineStatusService.setUserOnline(userId, client.id, 'private');

      this.logger.log(`Private chat client connected: ${userId} (${client.id})`);

      // Join user to their personal room for private message notifications
      await client.join(`user:${userId}`);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to private chat',
        userId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.id;
    
    if (userId) {
      // Remove user socket if it matches the disconnecting socket
      const currentSocketId = this.userSockets.get(userId);
      if (currentSocketId === client.id) {
        this.userSockets.delete(userId);
        
        // 🆕 Mark user as offline in online status service
        this.onlineStatusService.setUserOffline(userId);
      }
    }

    this.logger.log(`Private chat client disconnected: ${userId || 'unknown'} (${client.id})`);
  }

  // Message handlers
  @SubscribeMessage('send_private_message')
  async handlePrivateMessage(
    @MessageBody() data: SendPrivateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const senderId = client.data.user.id;
      
      // Send the message
      const message = await this.chatService.sendPrivateMessage(senderId, data);

      // Emit to sender
      client.emit('message_sent', {
        success: true,
        message,
        timestamp: new Date().toISOString(),
      });

      // Emit to recipient if they're online
      this.server.to(`user:${data.recipientId}`).emit('new_private_message', {
        message,
        timestamp: new Date().toISOString(),
      });

      // 🆕 Smart notification logic - only send push notification if recipient needs it
      if (this.onlineStatusService.shouldNotifyUser(data.recipientId)) {
        try {
          // Get sender details for notification
          const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: { firstName: true, lastName: true },
          });
          
          if (sender) {
            const senderName = `${sender.firstName} ${sender.lastName}`;
            const messageContent = data.content || '';
            
            await this.notificationService.sendChatNotification({
              recipientId: data.recipientId,
              senderId,
              senderName,
              messageContent: messageContent.length > 50 ? `${messageContent.substring(0, 50)}...` : messageContent,
              chatType: 'private',
              messageId: message.id,
            });

            this.logger.log(`Push notification sent to ${data.recipientId} for private message from ${senderId}`);
          }
        } catch (notificationError) {
          this.logger.error(`Failed to send push notification: ${notificationError.message}`);
          // Don't fail the message sending if notification fails
        }
      } else {
        this.logger.log(`Skipped notification for ${data.recipientId} - user is online and active`);
      }

      // Update sender activity
      this.onlineStatusService.updateActivity(senderId);

      this.logger.log(`Private message sent from ${senderId} to ${data.recipientId}`);

    } catch (error) {
      this.logger.error(`Failed to send private message: ${error.message}`);
      client.emit('message_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_private_messages')
  async handleGetPrivateMessages(
    @MessageBody() data: GetPrivateMessagesDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      
      // Use the updated private chat history method with cursor pagination
      const chatHistory = await this.chatService.getPrivateChatHistory(
        userId,
        data.recipientId,
        data.limit || 50,
        data.cursor,
        data.direction || 'before',
      );

      client.emit('private_messages', {
        ...chatHistory,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Failed to get private messages: ${error.message}`);
      client.emit('message_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @MessageBody() data: { messageIds: string[]; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      
      await this.chatService.markMessagesAsRead(userId, data.roomId, data.messageIds);

      client.emit('messages_marked_read', {
        success: true,
        messageIds: data.messageIds,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Failed to mark messages as read: ${error.message}`);
      client.emit('message_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('typing_private')
  async handleTypingPrivate(
    @MessageBody() data: { recipientId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;

      // Send typing indicator to recipient (simplified - just isTyping status)
      this.server.to(`user:${data.recipientId}`).emit('typing_indicator_private', {
        userId,
        isTyping: data.isTyping,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Failed to handle typing indicator: ${error.message}`);
    }
  }

  @SubscribeMessage('get_online_status')
  async handleGetOnlineStatus(
    @MessageBody() data: { userIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const onlineStatus = data.userIds.map(userId => ({
        userId,
        isOnline: this.userSockets.has(userId), // Single session: has userId key
      }));

      client.emit('online_status', {
        status: onlineStatus,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Failed to get online status: ${error.message}`);
    }
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @MessageBody() data: EditMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      
      // Edit the message
      const editedMessage = await this.chatService.editMessage(userId, data.messageId, data.newContent);

      // Emit to sender (confirmation)
      client.emit('message_edited', {
        success: true,
        message: editedMessage,
        timestamp: new Date().toISOString(),
      });

      // Emit to recipient using the provided recipientId
      this.server.to(`user:${data.recipientId}`).emit('message_edited', {
        message: editedMessage,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Message ${data.messageId} edited by user ${userId}`);

    } catch (error) {
      this.logger.error(`Failed to edit message: ${error.message}`);
      client.emit('message_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() data: DeleteMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      
      // Delete the message
      const deletedMessage = await this.chatService.deleteMessage(userId, data.messageId);

      // Emit to sender (confirmation)
      client.emit('message_deleted', {
        success: true,
        message: deletedMessage,
        timestamp: new Date().toISOString(),
      });

      // Emit to recipient using the provided recipientId
      this.server.to(`user:${data.recipientId}`).emit('message_deleted', {
        message: deletedMessage,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Message ${data.messageId} deleted by user ${userId}`);

    } catch (error) {
      this.logger.error(`Failed to delete message: ${error.message}`);
      client.emit('message_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  public sendNotificationToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
