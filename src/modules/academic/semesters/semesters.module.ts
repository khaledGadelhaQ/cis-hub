import { Module } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { SemestersController } from './semesters.controller';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  controllers: [SemestersController],
  providers: [SemestersService, PrismaService],
  exports: [SemestersService],
})
export class SemestersModule {}
