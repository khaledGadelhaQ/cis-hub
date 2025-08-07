
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaService with optimized connection pooling
 * 
 * Learning Notes:
 * - Single PrismaClient instance prevents connection pool exhaustion
 * - Connection pooling happens at the Prisma level, not application level
 * - Proper lifecycle management ensures clean connections
 * 
 * Connection Pool Configuration (set in DATABASE_URL):
 * postgresql://user:password@host:port/database?connection_limit=20&pool_timeout=60
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Successfully connected to database');
    
    // Test the connection
    try {
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connection test successful');
    } catch (error) {
      this.logger.error('Database connection test failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Successfully disconnected from database');
  }

  /**
   * Health check method to verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Get connection pool status (for monitoring)
   */
  getConnectionInfo() {
    return {
      status: 'connected',
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@'), // Hide credentials
    };
  }
}
