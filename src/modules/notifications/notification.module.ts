import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';
import { FCMService } from './services/fcm.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    FCMService,
  ],
  exports: [NotificationService, FCMService],
})
export class NotificationModule {}
