import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import { StorageService } from './storage.service';

export interface ThumbnailSizes {
  small?: string;   // 150px
  medium?: string;  // 300px
  large?: string;   // 600px
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  
  // Default thumbnail sizes
  private readonly THUMBNAIL_SIZES = {
    small: 150,
    medium: 300,
    large: 600,
  };

  constructor(private storageService: StorageService) {}

  /**
   * Generate thumbnails for an image
   */
  async generateThumbnails(fileId: string, filePath: string): Promise<ThumbnailSizes> {
    if (!this.isImageFile(path.extname(filePath))) {
      return {};
    }

    try {
      const fullPath = await this.storageService.getFilePath(filePath);
      const thumbnails: ThumbnailSizes = {};

      // Generate different sizes
      for (const [sizeName, size] of Object.entries(this.THUMBNAIL_SIZES)) {
        const thumbnailPath = await this.generateThumbnail(
          fullPath,
          filePath,
          size,
          sizeName as keyof ThumbnailSizes
        );
        thumbnails[sizeName as keyof ThumbnailSizes] = thumbnailPath;
      }

      this.logger.log(`Generated thumbnails for ${fileId}`);
      return thumbnails;
    } catch (error) {
      this.logger.error(`Failed to generate thumbnails for ${fileId}:`, error);
      return {};
    }
  }

  /**
   * Generate a single thumbnail
   */
  async generateThumbnail(
    sourcePath: string,
    originalFilePath: string,
    size: number,
    sizeName: string
  ): Promise<string> {
    const ext = path.extname(originalFilePath);
    const baseName = path.basename(originalFilePath, ext);
    const dir = path.dirname(originalFilePath);
    
    const thumbnailName = `${baseName}_${sizeName}_${size}x${size}${ext}`;
    const thumbnailRelativePath = path.join(dir, 'thumbnails', thumbnailName);
    const thumbnailFullPath = await this.storageService.getFilePath(thumbnailRelativePath);

    // Ensure thumbnails directory exists
    const thumbnailDir = path.dirname(thumbnailFullPath);
    const fs = require('fs/promises');
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Process image with Sharp
    await sharp(sourcePath)
      .resize(size, size, {
        fit: sharp.fit.cover,
        position: sharp.strategy.attention,
      })
      .jpeg({ quality: 85 }) // Convert to JPEG for consistency
      .toFile(thumbnailFullPath);

    return thumbnailRelativePath;
  }

  /**
   * Process image with custom options
   */
  async processImage(
    sourcePath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
      fit?: 'cover' | 'contain' | 'fill';
    }
  ): Promise<Buffer> {
    let processor = sharp(sourcePath);

    // Resize if dimensions provided
    if (options.width || options.height) {
      processor = processor.resize(options.width, options.height, {
        fit: options.fit === 'cover' ? sharp.fit.cover :
             options.fit === 'contain' ? sharp.fit.contain :
             options.fit === 'fill' ? sharp.fit.fill : sharp.fit.cover,
      });
    }

    // Set format and quality
    switch (options.format) {
      case 'jpeg':
        processor = processor.jpeg({ quality: options.quality || 85 });
        break;
      case 'png':
        processor = processor.png({ quality: options.quality || 85 });
        break;
      case 'webp':
        processor = processor.webp({ quality: options.quality || 85 });
        break;
      default:
        processor = processor.jpeg({ quality: options.quality || 85 });
    }

    return processor.toBuffer();
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(filePath: string) {
    try {
      const fullPath = await this.storageService.getFilePath(filePath);
      const metadata = await sharp(fullPath).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
      };
    } catch (error) {
      this.logger.error(`Failed to get image metadata for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Compress image
   */
  async compressImage(
    sourcePath: string,
    targetPath: string,
    quality: number = 80
  ): Promise<void> {
    const fullSourcePath = await this.storageService.getFilePath(sourcePath);
    const fullTargetPath = await this.storageService.getFilePath(targetPath);

    await sharp(fullSourcePath)
      .jpeg({ quality, mozjpeg: true })
      .toFile(fullTargetPath);

    this.logger.log(`Compressed image: ${sourcePath} -> ${targetPath}`);
  }

  /**
   * Create image variants (different formats/sizes)
   */
  async createImageVariants(filePath: string, fileId: string) {
    const variants = {
      webp: null as string | null,
      compressed: null as string | null,
    };

    try {
      const fullPath = await this.storageService.getFilePath(filePath);
      const ext = path.extname(filePath);
      const basePath = filePath.replace(ext, '');

      // Create WebP variant
      const webpPath = `${basePath}.webp`;
      const fullWebpPath = await this.storageService.getFilePath(webpPath);
      await sharp(fullPath).webp({ quality: 85 }).toFile(fullWebpPath);
      variants.webp = webpPath;

      // Create compressed variant
      if (ext.toLowerCase() === '.jpg' || ext.toLowerCase() === '.jpeg') {
        const compressedPath = `${basePath}_compressed${ext}`;
        const fullCompressedPath = await this.storageService.getFilePath(compressedPath);
        await sharp(fullPath)
          .jpeg({ quality: 70, mozjpeg: true })
          .toFile(fullCompressedPath);
        variants.compressed = compressedPath;
      }

      this.logger.log(`Created image variants for ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to create image variants for ${fileId}:`, error);
    }

    return variants;
  }

  /**
   * Check if file is an image based on MIME type
   */
  isImageFile(mimeTypeOrExtension: string): boolean {
    if (mimeTypeOrExtension.startsWith('image/')) {
      return true;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    return imageExtensions.includes(mimeTypeOrExtension.toLowerCase());
  }

  /**
   * Get optimal image format based on content
   */
  getOptimalFormat(hasTransparency: boolean, isPhotographic: boolean): string {
    if (hasTransparency) {
      return 'png';
    }
    
    if (isPhotographic) {
      return 'jpeg';
    }
    
    return 'webp'; // Modern format for other cases
  }

  /**
   * Batch process images
   */
  async batchProcessImages(
    filePaths: string[],
    options: {
      generateThumbnails?: boolean;
      compress?: boolean;
      convertToWebP?: boolean;
    }
  ) {
    const results: Array<{
      filePath: string;
      success: boolean;
      thumbnails?: ThumbnailSizes;
      compressedPath?: string;
      webpPath?: string;
      error?: string;
    }> = [];

    for (const filePath of filePaths) {
      try {
        const result: {
          filePath: string;
          success: boolean;
          thumbnails?: ThumbnailSizes;
          compressedPath?: string;
          webpPath?: string;
        } = { filePath, success: true };

        if (options.generateThumbnails) {
          result.thumbnails = await this.generateThumbnails('batch', filePath);
        }

        if (options.compress) {
          const compressedPath = filePath.replace(/(\.[^.]+)$/, '_compressed$1');
          await this.compressImage(filePath, compressedPath);
          result.compressedPath = compressedPath;
        }

        if (options.convertToWebP) {
          const webpPath = filePath.replace(/\.[^.]+$/, '.webp');
          const fullSourcePath = await this.storageService.getFilePath(filePath);
          const fullWebpPath = await this.storageService.getFilePath(webpPath);
          await sharp(fullSourcePath).webp({ quality: 85 }).toFile(fullWebpPath);
          result.webpPath = webpPath;
        }

        results.push(result);
      } catch (error: any) {
        results.push({
          filePath,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
