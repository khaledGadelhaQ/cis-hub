import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import FilesModule for file integration
import { FilesModule } from '../files/files.module';

// 🆕 Import NotificationModule for push notification integration
import { NotificationModule } from '../notifications/notification.module';

// 🆕 Import QueueModule for async notification processing
import { QueueModule } from '../../queues/queue.module';

// Gateways
import { PrivateChatGateway } from './gateways/private-chat.gateway';
import { GroupChatGateway } from './gateways/group-chat.gateway';

// Controllers
import { ChatController } from './controllers/chat.controller';
import { ChatFileController } from './controllers/chat-file.controller';

// Services
import { ChatService } from './services/chat.service';
import { ChatAutomationService } from './services/chat-automation.service';
import { ChatEventEmitterService } from './services/chat-event-emitter.service';
import { NotificationAutomationService } from './services/notification-automation.service';
import { OnlineStatusService } from './services/online-status.service'; // 🆕 Phase 3

// Guards
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsJwtGroupGuard } from './guards/ws-jwt-group.guard';

@Module({
  imports: [
    FilesModule, // Import for file services
    NotificationModule, // 🆕 Import for push notification integration
    QueueModule, // 🆕 Import for async notification processing
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
  controllers: [ChatController, ChatFileController], // Add REST controllers
  providers: [
    // Services
    ChatService,
    ChatAutomationService,
    ChatEventEmitterService,
    NotificationAutomationService, // 🆕 Add notification automation service
    OnlineStatusService, // 🆕 Phase 3: Online status tracking
    
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
