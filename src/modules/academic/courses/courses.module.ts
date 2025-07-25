import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ChatModule } from '../../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [CoursesController],
  providers: [CoursesService, PrismaService],
  exports: [CoursesService],
})
export class CoursesModule {}
