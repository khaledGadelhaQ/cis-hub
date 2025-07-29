import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { WsJwtGroupGuard } from '../guards/ws-jwt-group.guard';
import { ChatService } from '../services/chat.service';
import {
  SendGroupMessageDto,
  GetGroupMessagesDto,
  JoinGroupDto,
  MarkMessagesReadDto,
  EditGroupMessageDto,
  DeleteGroupMessageDto,
} from './../dto/group-chat.dto';

@WebSocketGateway({
  namespace: '/chat/groups',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class GroupChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GroupChatGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId (single session)

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      this.logger.log(`Group chat client connecting: ${client.id}`);
      
      // JWT validation will be handled by guards on message handlers
      // Store socket for potential use
      client.data.connectionTime = new Date();
      
    } catch (error) {
      this.logger.error(`Group chat connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Group chat client disconnected: ${client.id}`);
    
    // Find and remove user from connected users
    for (const [key, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(key);
        break;
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_group')
  async handleJoinGroup(
    @MessageBody() data: JoinGroupDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roomId } = data;
      const userId = client.data.user.id;

      // Validate user has access to this group room
      const hasAccess = await this.chatService.validateGroupAccess(userId, roomId);
      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to this group' });
        return;
      }

      // Join the socket room
      await client.join(roomId);
      
      // Store user connection
      this.connectedUsers.set(`${userId}-${roomId}`, client.id);

      // Notify group members that user joined
      client.to(roomId).emit('user_joined_group', {
        userId,
        roomId,
        timestamp: new Date(),
      });

      // Send confirmation to user
      client.emit('joined_group', {
        roomId,
        message: 'Successfully joined group',
        timestamp: new Date(),
      });

      this.logger.log(`User ${userId} joined group room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error joining group: ${error.message}`);
      client.emit('error', { message: 'Failed to join group' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave_group')
  async handleLeaveGroup(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roomId } = data;
      const userId = client.data.user.id;

      // Leave the socket room
      await client.leave(roomId);
      
      // Remove user connection
      this.connectedUsers.delete(`${userId}-${roomId}`);

      // Notify group members that user left
      client.to(roomId).emit('user_left_group', {
        userId,
        roomId,
        timestamp: new Date(),
      });

      client.emit('left_group', {
        roomId,
        message: 'Successfully left group',
      });

      this.logger.log(`User ${userId} left group room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error leaving group: ${error.message}`);
      client.emit('error', { message: 'Failed to leave group' });
    }
  }

  @UseGuards(WsJwtGroupGuard)
  @SubscribeMessage('send_group_message')
  async handleSendGroupMessage(
    @MessageBody() data: SendGroupMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      const { roomId, content, replyToId, messageType, attachments } = data;

      // Send message through chat service (access already validated by guard)
      const message = await this.chatService.sendGroupMessage(userId, data);

      // Get reply preview if replying to a message
      let replyPreview: { id: string; content: string; senderName: string } | null = null;
      if (replyToId) {
        const replyMessage = await this.chatService.getMessageById(replyToId);
        if (replyMessage) {
          replyPreview = {
            id: replyMessage.id,
            content: replyMessage.content?.substring(0, 50) + (replyMessage.content?.length > 50 ? '...' : ''),
            senderName: replyMessage.senderName,
          };
        }
      }

      // Broadcast message to all group members (including sender for confirmation)
      this.server.to(roomId).emit('group_message_received', {
        messageId: message.id,
        senderId: userId,
        senderName: message.senderName,
        roomId,
        content,
        messageType: message.messageType,
        attachments: message.attachments || [],
        replyPreview,
        timestamp: message.sentAt,
        readBy: [], // Will be updated as users read
      });

      this.logger.log(`Group message sent by ${userId} to room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error sending group message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @UseGuards(WsJwtGroupGuard)
  @SubscribeMessage('get_group_messages')
  async handleGetGroupMessages(
    @MessageBody() data: GetGroupMessagesDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      const { roomId, limit = 50, cursor, direction = 'before' } = data;

      // Get messages using cursor pagination (access already validated by guard)
      const result = await this.chatService.getMessages(roomId, limit, cursor, direction);

      client.emit('group_messages', {
        roomId,
        messages: result.messages,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
      });

    } catch (error) {
      this.logger.error(`Error getting group messages: ${error.message}`);
      client.emit('error', { message: 'Failed to get messages' });
    }
  }

  @UseGuards(WsJwtGroupGuard)
  @SubscribeMessage('mark_group_messages_read')
  async handleMarkGroupMessagesRead(
    @MessageBody() data: MarkMessagesReadDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      const { roomId, messageIds } = data;

      // Mark messages as read (access already validated by guard)
      await this.chatService.markMessagesAsRead(userId, roomId, messageIds);

      // Notify group members about read status (for read receipts)
      client.to(roomId).emit('messages_read', {
        userId,
        messageIds,
        timestamp: new Date(),
      });

      client.emit('messages_marked_read', {
        roomId,
        messageIds,
      });

    } catch (error) {
      this.logger.error(`Error marking messages read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  @UseGuards(WsJwtGroupGuard)
  @SubscribeMessage('get_group_members')
  async handleGetGroupMembers(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      const { roomId } = data;

      // Access already validated by WsJwtGroupGuard

      // Get room members
      const members = await this.chatService.getRoomMembers(roomId);

      client.emit('group_members', {
        roomId,
        members,
      });

    } catch (error) {
      this.logger.error(`Error getting group members: ${error.message}`);
      client.emit('error', { message: 'Failed to get group members' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_user_groups')
  async handleGetUserGroups(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.user.id;

      // Get all groups/rooms the user is a member of
      const groups = await this.chatService.getUserRooms(userId);

      client.emit('user_groups', {
        groups,
      });

    } catch (error) {
      this.logger.error(`Error getting user groups: ${error.message}`);
      client.emit('error', { message: 'Failed to get user groups' });
    }
  }

  // Utility method to broadcast to specific group
  broadcastToGroup(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  // Get online members for a specific group
  getOnlineGroupMembers(roomId: string): string[] {
    const onlineUsers: string[] = [];
    for (const [key, socketId] of this.connectedUsers.entries()) {
      if (key.includes(roomId)) {
        // Extract userId from key format "userId-roomId"
        const userId = key.split('-')[0];
        onlineUsers.push(userId);
      }
    }
    return onlineUsers;
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @MessageBody() data: EditGroupMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      
      // Edit the message
      const editedMessage = await this.chatService.editMessage(userId, data.messageId, data.newContent);

      // Broadcast to all room members
      this.server.to(data.roomId).emit('message_edited', {
        message: editedMessage,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Message ${data.messageId} edited by user ${userId} in room ${data.roomId}`);

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
    @MessageBody() data: DeleteGroupMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;
      
      // Delete the message
      const deletedMessage = await this.chatService.deleteMessage(userId, data.messageId);

      // Broadcast to all room members
      this.server.to(data.roomId).emit('message_deleted', {
        message: deletedMessage,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Message ${data.messageId} deleted by user ${userId} in room ${data.roomId}`);

    } catch (error) {
      this.logger.error(`Failed to delete message: ${error.message}`);
      client.emit('message_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
