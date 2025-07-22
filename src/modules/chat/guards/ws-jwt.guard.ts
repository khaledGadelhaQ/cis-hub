import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // Extract token from handshake auth or query
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

      this.logger.log(`WebSocket authenticated for user: ${payload.email}`);
      return true;
      
    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    // Try to get token from different sources
    
    // 1. From handshake auth header
    const authHeader = client.handshake?.auth?.token;
    if (authHeader) {
      return authHeader;
    }

    // 2. From query parameters
    const queryToken = client.handshake?.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // 3. From headers (Authorization: Bearer <token>)
    const headerAuth = client.handshake?.headers?.authorization;
    if (headerAuth && headerAuth.startsWith('Bearer ')) {
      return headerAuth.substring(7);
    }

    return null;
  }
}
