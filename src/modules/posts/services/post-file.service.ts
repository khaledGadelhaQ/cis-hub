import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FilesService } from '../../files/services/files.service';
import { FileValidationService } from '../../files/services/file-validation.service';
import { StorageService } from '../../files/services/storage.service';
import { UploadContext } from '../../../common/enums/upload_context.enum';
import { UserRole } from '../../../common/enums/user_role.enum';
import { PostFileUploadDto, PostFileAttachmentDto } from './../dto/post-file.dto';

@Injectable()
export class PostFileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly fileValidationService: FileValidationService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload files for a post with enhanced validation
   */
  async uploadPostFiles(
    files: Express.Multer.File[],
    dto: PostFileUploadDto,
    userId: string,
  ) {
    // Validate post exists and user has permission
    await this.validatePostAccess(dto.postId, userId);

    // Validate file count limits
    await this.validateFileCountLimits(dto.postId, files.length);

    const uploadResults: any[] = [];

    for (const file of files) {
      // Enhanced validation for post context
      await this.validatePostFile(file, dto);

      // Upload file using the files service
      const uploadResult = await this.filesService.uploadFile(
        file,
        {
          context: UploadContext.POST,
          contextId: dto.postId,
          isPublic: dto.isPublic || false,
        },
        userId,
      );

      uploadResults.push(uploadResult);
    }

    // Update post attachments count and emit event
    await this.updatePostAttachmentsMetadata(dto.postId);

    return uploadResults;
  }

  /**
   * Associate existing files with a post
   */
  async associateFilesWithPost(
    fileIds: string[],
    postId: string,
    userId: string,
  ) {
    // Validate post access
    await this.validatePostAccess(postId, userId);

    // Verify all files exist and belong to the user
    const files = await this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploadedBy: userId,
        uploadContext: UploadContext.POST,
        contextId: null, // Only unassociated files
      },
    });

    if (files.length !== fileIds.length) {
      throw new BadRequestException('Some files not found or already associated');
    }

    // Validate file count limits
    await this.validateFileCountLimits(postId, files.length);

    // Associate files with the post
    await this.prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { contextId: postId },
    });

    await this.updatePostAttachmentsMetadata(postId);

    return { associatedCount: files.length };
  }

  /**
   * Remove file attachments from a post
   */
  async removePostAttachments(
    attachmentDto: PostFileAttachmentDto,
    userId: string,
  ) {
    // Validate post access
    await this.validatePostAccess(attachmentDto.postId, userId);

    const whereClause: any = {
      contextId: attachmentDto.postId,
      uploadContext: UploadContext.POST,
    };

    // If specific file IDs provided, remove only those
    if (attachmentDto.fileIds && attachmentDto.fileIds.length > 0) {
      whereClause.id = { in: attachmentDto.fileIds };
      
      // Verify files belong to user (unless admin)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== UserRole.ADMIN) {
        whereClause.uploadedBy = userId;
      }
    }

    // Remove associations (set contextId to null)
    const updateResult = await this.prisma.file.updateMany({
      where: whereClause,
      data: { contextId: null },
    });

    await this.updatePostAttachmentsMetadata(attachmentDto.postId);

    return { removedCount: updateResult.count };
  }

  /**
   * Get post attachments with filtering
   */
  async getPostAttachments(postId: string, userId: string) {
    // Validate post access
    await this.validatePostAccess(postId, userId);

    const attachments = await this.prisma.file.findMany({
      where: {
        contextId: postId,
        uploadContext: UploadContext.POST,
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
    });

    return attachments;
  }

  /**
   * Download post attachment with access control
   */
  async downloadPostAttachment(fileId: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        uploadContext: UploadContext.POST,
      },
      include: {
        post: {
          select: {
            id: true,
            authorId: true,
            departmentId: true,
            scope: true,
          },
        },
      },
    });

    if (!file || !file.post) {
      throw new NotFoundException('File not found');
    }

    // Validate user can access the post
    await this.validatePostAccess(file.post.id, userId);

    // Get file URL or path for download
    return { 
      filePath: file.filePath,
      originalName: file.originalName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
    };
  }

  /**
   * Get file usage statistics for a post
   */
  async getPostFileStatistics(postId: string, userId: string) {
    await this.validatePostAccess(postId, userId);

    const stats = await this.prisma.file.aggregate({
      where: {
        contextId: postId,
        uploadContext: UploadContext.POST,
      },
      _count: { id: true },
      _sum: { fileSize: true },
    });

    const fileTypes = await this.prisma.file.groupBy({
      by: ['mimeType'],
      where: {
        contextId: postId,
        uploadContext: UploadContext.POST,
      },
      _count: { id: true },
    });

    return {
      totalFiles: stats._count.id || 0,
      totalSize: stats._sum.fileSize || 0,
      fileTypes: fileTypes.map(type => ({
        mimeType: type.mimeType,
        count: type._count.id,
      })),
    };
  }

  // Private helper methods

  private async validatePostAccess(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        departmentId: true,
        scope: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        departmentId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Admins can access any post
    if (user.role === UserRole.ADMIN) {
      return;
    }

    // Post authors can always access their posts
    if (post.authorId === userId) {
      return;
    }

    // For other users, validate department access
    if (post.departmentId && user.departmentId !== post.departmentId) {
      throw new ForbiddenException('You do not have permission to access this post');
    }
  }

  private async validateFileCountLimits(postId: string, newFileCount: number) {
    const currentCount = await this.prisma.file.count({
      where: {
        contextId: postId,
        uploadContext: UploadContext.POST,
      },
    });

    const maxFilesPerPost = 10; // Configurable limit
    if (currentCount + newFileCount > maxFilesPerPost) {
      throw new BadRequestException(
        `Post cannot have more than ${maxFilesPerPost} attachments. Current: ${currentCount}, Attempting to add: ${newFileCount}`,
      );
    }
  }

  private async validatePostFile(file: Express.Multer.File, dto: PostFileUploadDto) {
    // Use existing file validation service for basic checks
    await this.fileValidationService.validateFile(file, UploadContext.POST);

    // Additional post-specific validations
    const maxFileSize = 25 * 1024 * 1024; // 25MB limit for posts
    if (file.size > maxFileSize) {
      throw new BadRequestException('File size too large. Maximum 25MB allowed for post attachments');
    }

    // Restrict certain file types for posts
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed for post attachments');
    }
  }

  private async updatePostAttachmentsMetadata(postId: string) {
    const count = await this.prisma.file.count({
      where: {
        contextId: postId,
        uploadContext: UploadContext.POST,
      },
    });

    // Could be used for caching or metadata updates
    // For now, we'll just return the count
    return count;
  }
}
