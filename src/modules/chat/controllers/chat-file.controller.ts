import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
  StreamableFile,
  Header,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FilesService } from '../../files/services/files.service';
import { StorageService } from '../../files/services/storage.service';
import { ChatService } from '../services/chat.service';
import { UploadContext } from '../../../common/enums/upload_context.enum';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('chat/files')
@UseGuards(JwtAuthGuard)
export class ChatFileController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: StorageService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Serve chat file with access control
   * This endpoint serves files directly for Flutter app
   */
  @Get(':fileId/serve')
  async serveChatFile(
    @Param('fileId') fileId: string,
    @Request() req: any,
  ): Promise<StreamableFile> {
    // Get file with access control
    const file = await this.filesService.getFileById(fileId, req.user.id);
    
    if (file.context !== UploadContext.CHAT_MESSAGE) {
      throw new NotFoundException('Chat file not found');
    }

    // Get file path and create stream
    const filePath = await this.storageService.getFilePath(file.filePath);
    const fileStream = createReadStream(filePath);

    return new StreamableFile(fileStream, {
      type: file.mimeType,
      disposition: `inline; filename="${file.originalName}"`,
    });
  }

  /**
   * Download chat file with proper headers
   */
  @Get(':fileId/download')
  @Header('Content-Disposition', 'attachment')
  async downloadChatFile(
    @Param('fileId') fileId: string,
    @Request() req: any,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getFileById(fileId, req.user.id);
    
    if (file.context !== UploadContext.CHAT_MESSAGE) {
      throw new NotFoundException('Chat file not found');
    }

    const filePath = await this.storageService.getFilePath(file.filePath);
    const fileStream = createReadStream(filePath);

    return new StreamableFile(fileStream, {
      type: file.mimeType,
      disposition: `attachment; filename="${file.originalName}"`,
    });
  }

  /**
   * Get chat file thumbnail (if available)
   */
  @Get(':fileId/thumbnails/:size')
  async getChatFileThumbnail(
    @Param('fileId') fileId: string,
    @Param('size') size: string,
    @Request() req: any,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getFileById(fileId, req.user.id);
    
    if (file.context !== UploadContext.CHAT_MESSAGE) {
      throw new NotFoundException('Chat file not found');
    }

    if (!file.thumbnails || !file.thumbnails[size]) {
      throw new NotFoundException('Thumbnail not available');
    }

    const thumbnailPath = await this.storageService.getFilePath(file.thumbnails[size]);
    const thumbnailStream = createReadStream(thumbnailPath);

    return new StreamableFile(thumbnailStream, {
      type: 'image/jpeg', // Thumbnails are converted to JPEG
      disposition: `inline; filename="thumb_${file.originalName}"`,
    });
  }

  /**
   * Get files from specific message
   */
  @Get('message/:messageId')
  async getMessageFiles(
    @Param('messageId') messageId: string,
    @Request() req: any,
  ) {
    // Get message files using the existing method
    const files = await this.filesService.getChatFiles([messageId], req.user.id);

    return {
      success: true,
      messageId,
      files: files.filter(f => f.messageId === messageId).map(f => f.file),
    };
  }

  /**
   * Get all files from user's accessible chat rooms
   */
  @Get('accessible')
  async getAccessibleChatFiles(
    @Request() req: any,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
    @Query('fileType') fileType?: 'image' | 'video' | 'document' | 'audio',
  ) {
    // Get user's rooms first
    const userRooms = await this.chatService.getUserRooms(req.user.id);
    const roomIds = userRooms.map(room => room.id);

    // Get files from those rooms
    const files = await this.filesService.getFiles(
      {
        context: UploadContext.CHAT_MESSAGE,
        limit: Math.min(limit, 100), // Cap at 100
        offset,
      },
      req.user.id,
    );

    // Filter by file type if specified
    let filteredFiles = files;
    if (fileType) {
      filteredFiles = files.filter(file => file.fileCategory === fileType);
    }

    return {
      success: true,
      files: filteredFiles,
      pagination: {
        limit,
        offset,
        hasMore: files.length === limit,
      },
      filter: fileType ? { fileType } : null,
    };
  }

  /**
   * Search chat files by name or type
   */
  @Get('search')
  async searchChatFiles(
    @Request() req: any,
    @Query('q') query: string,
    @Query('type') fileType?: 'image' | 'video' | 'document' | 'audio',
    @Query('limit') limit = 20,
  ) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    // Get user's files first
    const userFiles = await this.filesService.getFiles(
      {
        context: UploadContext.CHAT_MESSAGE,
        uploadedBy: req.user.id,
        limit: 1000, // Get many for searching
      },
      req.user.id,
    );

    // Filter by search query and type
    let results = userFiles.filter(file => 
      file.originalName.toLowerCase().includes(query.toLowerCase())
    );

    if (fileType) {
      results = results.filter(file => file.fileCategory === fileType);
    }

    // Limit results
    results = results.slice(0, limit);

    return {
      success: true,
      query,
      results,
      count: results.length,
      filter: fileType ? { fileType } : null,
    };
  }

  /**
   * Get file metadata without downloading
   */
  @Get(':fileId/metadata')
  async getChatFileMetadata(
    @Param('fileId') fileId: string,
    @Request() req: any,
  ) {
    const file = await this.filesService.getFileById(fileId, req.user.id);
    
    if (file.context !== UploadContext.CHAT_MESSAGE) {
      throw new NotFoundException('Chat file not found');
    }

    return {
      success: true,
      metadata: {
        id: file.id,
        originalName: file.originalName,
        fileSize: file.fileSize,
        formattedSize: file.formattedSize,
        mimeType: file.mimeType,
        fileCategory: file.fileCategory,
        uploadedAt: file.uploadedAt,
        uploader: file.uploader,
        thumbnails: file.thumbnails,
        hasThumbnails: !!(file.thumbnails && Object.keys(file.thumbnails).length > 0),
        serveUrl: file.serveUrl,
      },
    };
  }
}
