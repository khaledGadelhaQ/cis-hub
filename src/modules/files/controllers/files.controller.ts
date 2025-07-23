import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  ParseUUIDPipe,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FilesService } from '../services/files.service';
import { StorageService } from '../services/storage.service';
import { UploadFileDto, FileQueryDto, BulkFileOperationDto } from '../dto/file.dto';

@Controller('files')
export class FilesController {
  constructor(
    private filesService: FilesService,
    private storageService: StorageService,
  ) {}

  /**
   * Upload a file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.filesService.uploadFile(file, uploadFileDto, req.user.id);
  }

  /**
   * Get files with filters
   */
  @Get()
  async getFiles(@Query() fileQueryDto: FileQueryDto, @Req() req: any) {
    return this.filesService.getFiles(fileQueryDto, req.user.id);
  }

  /**
   * Get single file by ID
   */
  @Get(':id')
  async getFileById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.filesService.getFileById(id, req.user.id);
  }

  /**
   * Get file metadata - mobile optimized endpoint
   */
  @Get(':id/metadata')
  async getFileMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const file = await this.filesService.getFileById(id, req.user.id);
    // Return only metadata without file content - useful for Flutter app file lists
    return {
      ...file,
      // Add mobile-friendly preview URL if it's an image
      previewUrl: file.fileCategory === 'image' && file.thumbnails?.small 
        ? `/files/${id}/thumbnail/small` 
        : null,
    };
  }

  /**
   * Serve file - optimized for Flutter app
   * Single endpoint that handles all file serving needs
   */
  @Get(':id/serve')
  async serveFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const file = await this.filesService.getFileById(id, req.user.id);
    const filePath = await this.storageService.getFilePath(file.filePath);

    // Essential headers for Flutter app
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.fileSize.toString());
    
    // Mobile-optimized caching
    res.setHeader('Cache-Control', 'public, max-age=7200'); // 2 hours cache
    res.setHeader('ETag', `"${file.id}-${file.uploadedAt.getTime()}"`);
    
    res.sendFile(filePath);
  }

  /**
   * Serve image thumbnails - optimized for Flutter app
   */
  @Get(':id/thumbnail/:size')
  async serveThumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('size') size: 'small' | 'medium' | 'large',
    @Req() req: any,
    @Res() res: Response,
  ) {
    const file = await this.filesService.getFileById(id, req.user.id);
    
    if (!file.thumbnails || !file.thumbnails[size]) {
      throw new BadRequestException(`Thumbnail size ${size} not available`);
    }

    const thumbnailPath = await this.storageService.getFilePath(file.thumbnails[size]);

    // Optimized headers for thumbnails
    res.setHeader('Content-Type', 'image/jpeg'); // Thumbnails are typically JPEG
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.sendFile(thumbnailPath);
  }

  /**
   * Delete file
   */
  @Delete(':id')
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    await this.filesService.deleteFile(id, req.user.id);
    return { message: 'File deleted successfully' };
  }

  /**
   * Get file statistics for a context
   */
  @Get('stats/:context')
  async getFileStats(
    @Param('context') context: string,
    @Query('contextId') contextId?: string,
  ) {
    return this.filesService.getFileStats(context as any, contextId);
  }

  /**
   * Bulk operations
   */
  @Post('bulk/:operation')
  async bulkOperation(
    @Param('operation') operation: string,
    @Body() dto: BulkFileOperationDto,
    @Req() req: any,
  ) {
    return this.filesService.bulkOperation(operation, dto, req.user.id);
  }

  /**
   * Associate files with a message (for chat)
   */
  @Post('associate/message/:messageId')
  async associateWithMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() body: { fileIds: string[] },
  ) {
    return this.filesService.associateFilesWithMessage(body.fileIds, messageId);
  }

  /**
   * Get files for specific messages (for chat)
   */
  @Post('chat/messages')
  async getChatFiles(
    @Body() body: { messageIds: string[] },
    @Req() req: any,
  ) {
    return this.filesService.getChatFiles(body.messageIds, req.user.id);
  }
}
