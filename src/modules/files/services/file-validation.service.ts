import { Injectable, BadRequestException } from '@nestjs/common';
import { UploadContext } from '../../../common/enums/upload_context.enum';

@Injectable()
export class FileValidationService {
  // File size limits per context (in bytes) - optimized for mobile
  private readonly SIZE_LIMITS = {
    [UploadContext.CHAT_MESSAGE]: 25 * 1024 * 1024, // 25MB - mobile-friendly
    [UploadContext.PROFILE]: 3 * 1024 * 1024,       // 3MB - profile pics
    [UploadContext.POST]: 15 * 1024 * 1024,         // 15MB - social posts
    [UploadContext.ASSIGNMENT]: 50 * 1024 * 1024,   // 50MB - assignments
    [UploadContext.GENERAL]: 8 * 1024 * 1024,       // 8MB - general files
  };

  // Allowed MIME types per context - optimized for mobile
  private readonly ALLOWED_TYPES = {
    [UploadContext.CHAT_MESSAGE]: [
      // Images - mobile-optimized formats
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      // Documents - common mobile formats
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain', 'text/csv',
      // Archives
      'application/zip',
      // Audio/Video - mobile formats
      'audio/mpeg', 'audio/aac', 'audio/wav',
      'video/mp4', 'video/quicktime', 'video/3gpp',
    ],
    [UploadContext.PROFILE]: [
      // Profile images - including mobile camera formats
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    ],
    [UploadContext.POST]: [
      // Social media formats
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/quicktime', 'video/3gpp',
      'application/pdf',
    ],
    [UploadContext.ASSIGNMENT]: [
      // Academic documents
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg', 'image/png', // For scanned documents
    ],
    [UploadContext.GENERAL]: [
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
    ],
  };

  async validateFile(file: Express.Multer.File, context: UploadContext): Promise<void> {
    // Check file size
    this.validateFileSize(file, context);
    
    // Check MIME type
    this.validateMimeType(file, context);
    
    // Check file name
    this.validateFileName(file);
    
    // Additional security checks
    this.validateFileContent(file);
  }

  private validateFileSize(file: Express.Multer.File, context: UploadContext): void {
    const maxSize = this.SIZE_LIMITS[context];
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `File size exceeds the ${maxSizeMB}MB limit for ${context} files`
      );
    }
  }

  private validateMimeType(file: Express.Multer.File, context: UploadContext): void {
    const allowedTypes = this.ALLOWED_TYPES[context];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed for ${context} files`
      );
    }
  }

  private validateFileName(file: Express.Multer.File): void {
    // Check for dangerous file names
    const dangerousPatterns = [
      /\.\./,  // Path traversal
      /[<>:"|?*]/,  // Windows invalid chars
      /\x00/,  // Null bytes
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.originalname)) {
        throw new BadRequestException('Invalid file name');
      }
    }

    // Check file name length
    if (file.originalname.length > 255) {
      throw new BadRequestException('File name too long');
    }
  }

  private validateFileContent(file: Express.Multer.File): void {
    // Mobile-focused content validation

    
    if (file.buffer) {
      // Check for basic malicious patterns
      const suspiciousPatterns = [
        /\x00/,  // Null bytes - potential binary exploitation
        /<\?php/i,  // PHP execution (shouldn't be in uploaded files)
      ];

      const fileContent = file.buffer.toString('utf8', 0, Math.min(500, file.buffer.length));
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(fileContent)) {
          throw new BadRequestException('File contains suspicious content');
        }
      }

      // Basic file header validation for common formats
      this.validateFileHeaders(file.buffer, file.mimetype);
    }
  }

  /**
   * Validate file headers match the declared MIME type
   */
  private validateFileHeaders(buffer: Buffer, mimeType: string): void {
    if (buffer.length < 4) return; // Not enough data to check

    const header = buffer.subarray(0, 4);
    const headerHex = header.toString('hex').toUpperCase();

    // Common file signatures for mobile uploads
    const signatures: Record<string, string[]> = {
      'image/jpeg': ['FFD8FFE0', 'FFD8FFE1', 'FFD8FFDB'],
      'image/png': ['89504E47'],
      'application/pdf': ['25504446'],
      'video/mp4': ['66747970'], // 'ftyp' at offset 4
    };

    const expectedSignatures = signatures[mimeType];
    if (expectedSignatures && !expectedSignatures.some(sig => headerHex.startsWith(sig))) {
      throw new BadRequestException('File content does not match declared type');
    }
  }

  /**
   * Get allowed file types for a context
   */
  getAllowedTypes(context: UploadContext): string[] {
    return this.ALLOWED_TYPES[context] || [];
  }

  /**
   * Get max file size for a context
   */
  getMaxFileSize(context: UploadContext): number {
    return this.SIZE_LIMITS[context] || this.SIZE_LIMITS[UploadContext.GENERAL];
  }

  /**
   * Check if file type is image
   */
  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file type is video
   */
  isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Check if file type is document
   */
  isDocumentFile(mimeType: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    return documentTypes.includes(mimeType);
  }

  /**
   * Check if file is a mobile camera format (HEIC/HEIF)
   */
  isMobileCameraFormat(mimeType: string): boolean {
    return ['image/heic', 'image/heif'].includes(mimeType);
  }

  /**
   * Get file type category for mobile app display
   */
  getFileCategory(mimeType: string): 'image' | 'video' | 'document' | 'audio' | 'other' {
    if (this.isImageFile(mimeType)) return 'image';
    if (this.isVideoFile(mimeType)) return 'video';
    if (this.isDocumentFile(mimeType)) return 'document';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
  }
}
