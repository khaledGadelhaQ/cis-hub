import { Module } from '@nestjs/common';
import { FilesService } from './services/files.service';
import { FilesController } from './controllers/files.controller';
import { ImageProcessingService } from './services/image-processing.service'; // Requires Sharp
import { FileValidationService } from './services/file-validation.service';
import { StorageService } from './services/storage.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    ImageProcessingService,
    FileValidationService,
    StorageService,
    PrismaService,
  ],
  exports: [
    FilesService,
    ImageProcessingService,
    FileValidationService,
    StorageService,
  ], // Export for other modules to use
})
export class FilesModule {}
