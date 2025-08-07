import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './common/modules/database.module'; // 🆕 Global Database Module
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ChatModule } from './modules/chat/chat.module';
import { FilesModule } from './modules/files/files.module';
import { PostsModule } from './modules/posts/posts.module'; // 🆕 Added
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
    DatabaseModule, // 🆕 Single PrismaClient instance for entire app
    EventEmitterModule.forRoot(), 
    AuthModule,
    UsersModule,
    AcademicModule,
    ChatModule,
    FilesModule,
    PostsModule, 
    NotificationModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
