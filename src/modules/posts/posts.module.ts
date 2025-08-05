import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserContextService } from './services/user-context.service';
import { PostVisibilityService } from './services/post-visibility.service';
import { PostSearchService } from './services/post-search.service';

@Module({
  controllers: [PostsController],
  providers: [
    PostsService, 
    PrismaService,
    UserContextService,
    PostVisibilityService,
    PostSearchService,
  ],
  exports: [PostsService],
})
export class PostsModule {}
