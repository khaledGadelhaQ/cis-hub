import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
