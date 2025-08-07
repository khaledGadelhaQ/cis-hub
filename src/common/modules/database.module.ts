import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Global Database Module
 * 
 * Learning Notes:
 * - @Global() decorator makes PrismaService available everywhere
 * - Ensures only one PrismaClient instance across the entire application
 * - Prevents connection pool exhaustion from multiple instances
 * 
 * Connection Pool Benefits:
 * - Reduced connection overhead
 * - Better resource utilization
 * - Consistent performance under load
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
