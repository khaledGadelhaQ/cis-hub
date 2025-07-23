import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { UploadContext } from '../../../common/enums/upload_context.enum';

export interface StoredFileResult {
  storedName: string;
  filePath: string;
  fullPath: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor() {
    this.ensureUploadDirectories();
  }

  async storeFile(file: Express.Multer.File, context: UploadContext): Promise<StoredFileResult> {
    // Generate unique file name
    const fileExtension = path.extname(file.originalname);
    const storedName = `${uuidv4()}${fileExtension}`;
    
    // Organize by context and date
    const dateFolder = new Date().toISOString().slice(0, 7); // YYYY-MM
    const contextFolder = context.toLowerCase();
    const relativePath = path.join(contextFolder, dateFolder, storedName);
    const fullPath = path.join(this.uploadDir, relativePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, file.buffer);
    
    this.logger.log(`File stored: ${relativePath}`);
    
    return {
      storedName,
      filePath: relativePath,
      fullPath,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}:`, error);
      // Don't throw error - file might already be deleted
    }
  }

  async getFilePath(filePath: string): Promise<string> {
    return path.join(this.uploadDir, filePath);
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureUploadDirectories(): Promise<void> {
    try {
      // Create base upload directory
      await fs.mkdir(this.uploadDir, { recursive: true });
      
      // Create context-specific directories
      for (const context of Object.values(UploadContext)) {
        const contextDir = path.join(this.uploadDir, context.toLowerCase());
        await fs.mkdir(contextDir, { recursive: true });
      }
      
      this.logger.log(`Upload directories initialized at ${this.uploadDir}`);
    } catch (error) {
      this.logger.error('Failed to create upload directories:', error);
    }
  }

  /**
   * Get file stats (size, creation date, etc.)
   */
  async getFileStats(filePath: string) {
    const fullPath = path.join(this.uploadDir, filePath);
    return fs.stat(fullPath);
  }

  /**
   * Move file to different location
   */
  async moveFile(fromPath: string, toPath: string): Promise<void> {
    const fullFromPath = path.join(this.uploadDir, fromPath);
    const fullToPath = path.join(this.uploadDir, toPath);
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(fullToPath), { recursive: true });
    
    await fs.rename(fullFromPath, fullToPath);
    this.logger.log(`File moved from ${fromPath} to ${toPath}`);
  }

  /**
   * Copy file to different location
   */
  async copyFile(fromPath: string, toPath: string): Promise<void> {
    const fullFromPath = path.join(this.uploadDir, fromPath);
    const fullToPath = path.join(this.uploadDir, toPath);
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(fullToPath), { recursive: true });
    
    await fs.copyFile(fullFromPath, fullToPath);
    this.logger.log(`File copied from ${fromPath} to ${toPath}`);
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(olderThanDays: number = 180): Promise<number> {
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const contexts = Object.values(UploadContext);
      
      for (const context of contexts) {
        const contextDir = path.join(this.uploadDir, context.toLowerCase());
        deletedCount += await this.cleanupDirectory(contextDir, cutoffDate);
      }
      
      this.logger.log(`Cleanup completed: ${deletedCount} files deleted`);
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }

    return deletedCount;
  }

  private async cleanupDirectory(dirPath: string, cutoffDate: Date): Promise<number> {
    let deletedCount = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          deletedCount += await this.cleanupDirectory(fullPath, cutoffDate);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          if (stats.ctime < cutoffDate) {
            await fs.unlink(fullPath);
            deletedCount++;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup directory ${dirPath}:`, error);
    }

    return deletedCount;
  }
}
