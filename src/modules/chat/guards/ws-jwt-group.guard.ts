import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatService } from '../services/chat.service';

@Injectable()
export class WsJwtGroupGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGroupGuard.name);

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const data = context.switchToWs().getData();
      
      // First, verify JWT token (same as WsJwtGuard)
      const token = this.extractTokenFromClient(client);
      
      if (!token) {
        this.logger.warn('No token provided in WebSocket connection');
        throw new WsException('Unauthorized: No token provided');
      }

      // Verify and decode JWT
      const payload = await this.jwtService.verifyAsync(token);
      
      // Attach user information to the socket for later use
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Extract roomId from message data
      const roomId = data?.roomId;
      if (!roomId) {
        this.logger.warn('No roomId provided in message data');
        throw new WsException('Bad Request: roomId is required');
      }

      // Validate group access
      const hasAccess = await this.chatService.validateGroupAccess(payload.sub, roomId);
      if (!hasAccess) {
        this.logger.warn(`User ${payload.sub} denied access to room ${roomId}`);
        throw new WsException('Forbidden: Access denied to this group');
      }

      this.logger.log(`WebSocket authenticated and authorized for user: ${payload.email} in room: ${roomId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`WebSocket authentication/authorization failed: ${error.message}`);
      throw new WsException(error.message || 'Unauthorized');
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    // Try to get token from different sources
    
    // 1. From handshake auth header
    const authHeader = client.handshake?.auth?.token;
    if (authHeader) {
      return authHeader;
    }

    // 2. From handshake query parameters
    const queryToken = client.handshake?.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // 3. From authorization header in handshake headers
    const authorizationHeader = client.handshake?.headers?.authorization;
    if (authorizationHeader && typeof authorizationHeader === 'string') {
      const parts = authorizationHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
    }

    return null;
  }
}
