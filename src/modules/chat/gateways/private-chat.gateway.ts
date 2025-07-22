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
import { SendPrivateMessageDto, TypingDto, GetPrivateMessagesDto } from '../dto/private-chat.dto';

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

  constructor(private chatService: ChatService) {}

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
