import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

// Gateways
import { PrivateChatGateway } from './gateways/private-chat.gateway';
import { GroupChatGateway } from './gateways/group-chat.gateway';

// Services
import { ChatService } from './services/chat.service';
import { ChatAutomationService } from './services/chat-automation.service';
import { ChatEventEmitterService } from './services/chat-event-emitter.service';

// Guards
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsJwtGroupGuard } from './guards/ws-jwt-group.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Services
    PrismaService,
    ChatService,
    ChatAutomationService,
    ChatEventEmitterService,
    
    // Gateways
    PrivateChatGateway,
    GroupChatGateway,
    
    // Guards
    WsJwtGuard,
    WsJwtGroupGuard,
  ],
  exports: [ChatService, ChatEventEmitterService],
})
export class ChatModule {}
