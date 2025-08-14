import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './common/modules/database.module'; // 🆕 Global Database Module
import { CacheModule } from './common/modules/cache.module'; // 🆕 Global Cache Module
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ChatModule } from './modules/chat/chat.module';
import { FilesModule } from './modules/files/files.module';
import { PostsModule } from './modules/posts/posts.module'; // 🆕 Added
import { NotificationModule } from './modules/notifications/notification.module'; // 🆕 Added
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheTestController } from './cache-test.controller'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      expandVariables: true,
    }),
    DatabaseModule, // 🆕 Single PrismaClient instance for entire app
    CacheModule, // 🆕 Redis-based caching
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    AcademicModule,
    ChatModule,
    FilesModule,
    PostsModule, 
    NotificationModule, 
  ],
  controllers: [CacheTestController], // 🆕 Test controller for cache validation
  providers: [],
})
export class AppModule {}