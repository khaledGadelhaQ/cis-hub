import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ChatModule } from './modules/chat/chat.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationModule } from './modules/notifications/notification.module'; // 🆕 Added
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      expandVariables: true,
    }),
    EventEmitterModule.forRoot(), 
    AuthModule,
    UsersModule,
    AcademicModule,
    ChatModule,
    FilesModule,
    NotificationModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
