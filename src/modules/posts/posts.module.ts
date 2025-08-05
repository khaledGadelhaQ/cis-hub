import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostFilesController } from './controllers/post-files.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserContextService } from './services/user-context.service';
import { PostVisibilityService } from './services/post-visibility.service';
import { PostSearchService } from './services/post-search.service';
import { PostFileService } from './services/post-file.service';
import { PostNotificationService } from './services/post-notification.service';
import { FilesModule } from '../files/files.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [FilesModule, NotificationModule],
  controllers: [PostsController, PostFilesController],
  providers: [
    PostsService, 
    PrismaService,
    UserContextService,
    PostVisibilityService,
    PostSearchService,
    PostFileService,
    PostNotificationService,
  ],
  exports: [PostsService, PostFileService],
})
export class PostsModule {}
