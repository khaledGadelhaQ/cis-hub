import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FilesService } from '../../files/services/files.service';
import { ChatService } from '../services/chat.service';
import { UploadContext } from '../../../common/enums/upload_context.enum';
import { ChatFileUploadDto, AttachFilesToMessageDto } from '../dto/chat-file.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly filesService: FilesService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Upload a file for chat usage
   * Files are uploaded first, then referenced in messages
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: ChatFileUploadDto,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Force chat context
    const chatUploadDto = {
      context: UploadContext.CHAT_MESSAGE,
      contextId: uploadDto.contextId, // Optional, will be set when message is created
      isPublic: false, // Chat files are private by default
      description: uploadDto.description,
    };

    // Use existing FilesService upload functionality
    const uploadedFile = await this.filesService.uploadFile(
      file,
      chatUploadDto,
      req.user.id,
    );

    return {
      success: true,
      message: 'File uploaded successfully for chat',
      file: uploadedFile,
    };
  }

  /**
   * Upload multiple files for chat (batch upload)
   */
  @Post('upload/batch')
  @UseInterceptors(FileInterceptor('files'))
  async uploadMultipleChatFiles(
    @UploadedFile() files: Express.Multer.File[],
    @Body() uploadDto: ChatFileUploadDto,
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadedFiles: any[] = [];
    const chatUploadDto = {
      context: UploadContext.CHAT_MESSAGE,
      contextId: uploadDto.contextId,
      isPublic: false,
      description: uploadDto.description,
    };

    // Upload each file
    for (const file of files) {
      const uploadedFile = await this.filesService.uploadFile(
        file,
        chatUploadDto,
        req.user.id,
      );
      uploadedFiles.push(uploadedFile);
    }

    return {
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully for chat`,
      files: uploadedFiles,
    };
  }

  /**
   * Get file by ID with chat-specific access control
   */
  @Get('files/:fileId')
  async getChatFile(
    @Param('fileId') fileId: string,
    @Request() req: any,
  ) {
    // Use existing FilesService with access control
    const file = await this.filesService.getFileById(fileId, req.user.id);
    
    // Ensure it's a chat file
    if (file.context !== UploadContext.CHAT_MESSAGE) {
      throw new NotFoundException('Chat file not found');
    }

    return {
      success: true,
      file,
    };
  }

  /**
   * Get user's uploaded chat files
   */
  @Get('files/my/uploads')
  async getMyChatFiles(@Request() req: any) {
    const files = await this.filesService.getFiles(
      {
        context: UploadContext.CHAT_MESSAGE,
        uploadedBy: req.user.id,
        limit: 50,
        offset: 0,
      },
      req.user.id,
    );

    return {
      success: true,
      files,
      message: 'Your uploaded chat files',
    };
  }

  /**
   * Get files for specific room (with permission check)
   */
  @Get('rooms/:roomId/files')
  async getRoomFiles(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ) {
    // Validate user has access to the room
    const hasAccess = await this.chatService.validateGroupAccess(req.user.id, roomId);
    if (!hasAccess) {
      throw new BadRequestException('Access denied to this room');
    }

    const files = await this.filesService.getFiles(
      {
        context: UploadContext.CHAT_MESSAGE,
        contextId: roomId, // Files associated with room messages
        limit: 50,
        offset: 0,
      },
      req.user.id,
    );

    return {
      success: true,
      files,
      roomId,
      message: 'Files from this room',
    };
  }

  /**
   * Delete chat file (only file owner)
   */
  @Post('files/:fileId/delete')
  async deleteChatFile(
    @Param('fileId') fileId: string,
    @Request() req: any,
  ) {
    // Check if file exists and belongs to user
    const file = await this.filesService.getFileById(fileId, req.user.id);
    
    if (file.uploader.id !== req.user.id) {
      throw new BadRequestException('You can only delete your own files');
    }

    if (file.context !== UploadContext.CHAT_MESSAGE) {
      throw new BadRequestException('Not a chat file');
    }

    await this.filesService.deleteFile(fileId, req.user.id);

    return {
      success: true,
      message: 'Chat file deleted successfully',
    };
  }

  /**
   * Get file usage statistics for chat
   */
  @Get('files/stats')
  async getChatFileStats(@Request() req: any) {
    const stats = await this.filesService.getFileStats(UploadContext.CHAT_MESSAGE);
    
    // Get user-specific stats
    const userFiles = await this.filesService.getFiles(
      {
        context: UploadContext.CHAT_MESSAGE,
        uploadedBy: req.user.id,
        limit: 1000, // Just for counting
      },
      req.user.id,
    );

    const userTotalSize = userFiles.reduce((total, file) => total + file.fileSize, 0);

    return {
      success: true,
      globalStats: stats,
      userStats: {
        totalFiles: userFiles.length,
        totalSize: userTotalSize,
        totalSizeFormatted: this.formatFileSize(userTotalSize),
      },
    };
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
