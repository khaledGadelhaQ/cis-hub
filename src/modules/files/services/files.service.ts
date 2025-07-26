import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UploadContext } from '../../../common/enums/upload_context.enum';
import { UploadFileDto, FileQueryDto, FileResponseDto, BulkFileOperationDto } from '../dto/file.dto';
import { StorageService } from './storage.service';
import { FileValidationService } from './file-validation.service';
import { ImageProcessingService } from './image-processing.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private validationService: FileValidationService,
    private imageService: ImageProcessingService,
  ) {}

  /**
   * Upload and store a file with context
   */
  async uploadFile(
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
    uploaderId: string,
  ) {
    // Validate file based on context
    await this.validationService.validateFile(file, uploadFileDto.context);

    // Store file (S3, local, etc.)
    const storedFile = await this.storageService.storeFile(file, uploadFileDto.context);

    // Save to database
    const fileRecord = await this.prisma.file.create({
      data: {
        originalName: file.originalname,
        storedName: storedFile.storedName,
        filePath: storedFile.filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: uploaderId,
        uploadContext: uploadFileDto.context,
        contextId: uploadFileDto.contextId || null, // Explicitly set to null if undefined
        isPublic: uploadFileDto.isPublic || false,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Process image if applicable
    let thumbnails;
    if (this.imageService.isImageFile(file.mimetype)) {
      thumbnails = await this.imageService.generateThumbnails(fileRecord.id, storedFile.filePath);
    }

    this.logger.log(`File uploaded: ${fileRecord.id} by user ${uploaderId}`);

    return this.formatFileResponse(fileRecord, thumbnails);
  }

  /**
   * Get files by context and filters
   */
  async getFiles(fileQueryDto: FileQueryDto, requesterId: string) {
    const files = await this.prisma.file.findMany({
      where: {
        ...(fileQueryDto.context && { uploadContext: fileQueryDto.context }),
        ...(fileQueryDto.contextId && { contextId: fileQueryDto.contextId }),
        ...(fileQueryDto.uploadedBy && { uploadedBy: fileQueryDto.uploadedBy }),
        OR: [
          { isPublic: true },
          { uploadedBy: requesterId },
          // Add more access logic based on context
        ],
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: fileQueryDto.limit,
      skip: fileQueryDto.offset,
    });

    return files.map(file => this.formatFileResponse(file));
  }

  /**
   * Get single file by ID with permission check
   */
  async getFileById(fileId: string, requesterId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check access permissions
    const hasAccess = await this.checkFileAccess(file, requesterId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this file');
    }

    return this.formatFileResponse(file);
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(fileId: string, requesterId: string) {
    const file = await this.getFileById(fileId, requesterId);

    // Only file owner or admin can delete
    if (file.uploader.id !== requesterId) {
      // Add admin check here if needed
      throw new ForbiddenException('Only file owner can delete this file');
    }

    await this.prisma.file.delete({
      where: { id: fileId },
    });

    // Delete from storage
    await this.storageService.deleteFile(file.filePath);

    this.logger.log(`File deleted: ${fileId} by user ${requesterId}`);
  }

  /**
   * Bulk operations on files
   */
  async bulkOperation(operation: string, dto: BulkFileOperationDto, requesterId: string) {
    switch (operation) {
      case 'delete':
        return this.bulkDelete(dto.fileIds, requesterId);
      case 'move':
        if (!dto.newContextId) {
          throw new BadRequestException('newContextId is required for move operation');
        }
        return this.bulkMove(dto.fileIds, dto.newContextId, requesterId);
      default:
        throw new BadRequestException('Invalid bulk operation');
    }
  }

  /**
   * Get file usage statistics for a context
   */
  async getFileStats(context: UploadContext, contextId?: string) {
    const stats = await this.prisma.file.aggregate({
      where: {
        uploadContext: context,
        ...(contextId && { contextId }),
      },
      _sum: { fileSize: true },
      _count: { id: true },
    });

    return {
      totalFiles: stats._count.id,
      totalSize: stats._sum.fileSize || 0,
      totalSizeFormatted: this.formatFileSize(stats._sum.fileSize || 0),
    };
  }

  /**
   * Get files for chat messages
   */
  async getChatFiles(messageIds: string[], requesterId: string) {
    const files = await this.prisma.messageFile.findMany({
      where: {
        messageId: { in: messageIds },
      },
      include: {
        file: {
          include: {
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Check access to each file
    const accessibleFiles: Array<{
      messageId: string;
      file: FileResponseDto;
    }> = [];
    for (const messageFile of files) {
      const hasAccess = await this.checkFileAccess(messageFile.file, requesterId);
      if (hasAccess) {
        accessibleFiles.push({
          messageId: messageFile.messageId,
          file: this.formatFileResponse(messageFile.file),
        });
      }
    }

    return accessibleFiles;
  }

  /**
   * Associate files with a message (for chat)
   */
  async associateFilesWithMessage(fileIds: string[], messageId: string) {
    const associations = fileIds.map(fileId => ({
      fileId,
      messageId,
    }));

    await this.prisma.messageFile.createMany({
      data: associations,
      skipDuplicates: true,
    });

    this.logger.log(`Associated ${fileIds.length} files with message ${messageId}`);
  }

  // Private helper methods
  private async checkFileAccess(file: any, requesterId: string): Promise<boolean> {
    // Public files are accessible to everyone
    if (file.isPublic) return true;

    // File owner always has access
    if (file.uploadedBy === requesterId) return true;

    // Context-specific access control
    switch (file.uploadContext) {
      case UploadContext.CHAT_MESSAGE:
        return this.checkChatFileAccess(file, requesterId);
      case UploadContext.PROFILE:
        return true; // Profile pictures are generally accessible
      case UploadContext.POST:
        return this.checkPostFileAccess(file, requesterId);
      default:
        return false;
    }
  }

  private async checkChatFileAccess(file: any, requesterId: string): Promise<boolean> {
    // Check if user has access to the chat room
    const messageFile = await this.prisma.messageFile.findFirst({
      where: { fileId: file.id },
      include: {
        message: {
          include: {
            room: {
              include: {
                members: {
                  where: { userId: requesterId },
                },
              },
            },
          },
        },
      },
    });

    return (messageFile?.message?.room?.members?.length ?? 0) > 0;
  }

  private async checkPostFileAccess(file: any, requesterId: string): Promise<boolean> {
    // Implement post access logic when post module is created
    return true; // Placeholder
  }

  private async bulkDelete(fileIds: string[], requesterId: string) {
    const files = await this.prisma.file.findMany({
      where: { 
        id: { in: fileIds },
        uploadedBy: requesterId, // Only owner can bulk delete
      },
    });

    await this.prisma.file.deleteMany({
      where: { id: { in: files.map(f => f.id) } },
    });

    // Delete from storage
    await Promise.all(files.map(file => this.storageService.deleteFile(file.filePath)));

    return { deletedCount: files.length };
  }

  private async bulkMove(fileIds: string[], newContextId: string, requesterId: string) {
    await this.prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        uploadedBy: requesterId, // Only owner can move
      },
      data: { contextId: newContextId },
    });

    return { movedCount: fileIds.length };
  }

  private formatFileResponse(file: any, thumbnails?: any): FileResponseDto {
    return {
      id: file.id,
      originalName: file.originalName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      context: file.uploadContext,
      contextId: file.contextId,
      isPublic: file.isPublic,
      uploadedAt: file.uploadedAt,
      uploader: {
        id: file.uploader.id,
        name: `${file.uploader.firstName} ${file.uploader.lastName}`,
      },
      thumbnails,
      // Mobile-specific enhancements
      fileCategory: this.validationService.getFileCategory(file.mimeType),
      isMobileCameraFormat: this.validationService.isMobileCameraFormat(file.mimeType),
      serveUrl: `/files/${file.id}/serve`, // Direct URL for Flutter app
      formattedSize: this.formatFileSize(file.fileSize),
    };
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
