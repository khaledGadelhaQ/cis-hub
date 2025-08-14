import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CacheService } from './common/services/cache.service';
import { CacheHealthIndicator } from './common/modules/cache.health';
import { CacheKeys, CacheTTL } from './config/cache.config';
import { Public } from './common/decorators/public.decorator';

/**
 * Cache Test Controller
 * 
 * This controller is used for testing cache functionality and performance.
 * It demonstrates proper usage of the CacheService and provides endpoints
 * for validating cache operations.
 */
@Public()
@Controller('cache-test')
export class CacheTestController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheHealth: CacheHealthIndicator
  ) {}

  /**
   * Test basic cache set operation
   */
  @Post('set/:key')
  async setCache(@Param('key') key: string, @Body() data: any): Promise<any> {
    const cacheKey = `test:${key}`;
    await this.cacheService.set(cacheKey, data, CacheTTL.POSTS_FEED);
    
    return {
      success: true,
      message: `Data cached with key: ${cacheKey}`,
      data: data,
      ttl: CacheTTL.POSTS_FEED
    };
  }

  /**
   * Test basic cache get operation
   */
  @Get('get/:key')
  async getCache(@Param('key') key: string): Promise<any> {
    const cacheKey = `test:${key}`;
    const cachedData = await this.cacheService.get(cacheKey);
    
    return {
      success: true,
      key: cacheKey,
      data: cachedData,
      found: cachedData !== null
    };
  }

  /**
   * Test cache-or-set pattern (cache-aside)
   */
  @Get('get-or-set/:key')
  async getOrSetCache(@Param('key') key: string): Promise<any> {
    const cacheKey = `test:${key}`;
    
    // This demonstrates the cache-aside pattern
    const data = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Simulate database call
        return {
          id: key,
          timestamp: new Date().toISOString(),
          randomValue: Math.random(),
          source: 'database'
        };
      },
      CacheTTL.CHAT_MEMBERS
    );
    
    return {
      success: true,
      key: cacheKey,
      data: data,
      ttl: CacheTTL.CHAT_MEMBERS
    };
  }

  /**
   * Test cache deletion
   */
  @Post('delete/:key')
  async deleteCache(@Param('key') key: string): Promise<any> {
    const cacheKey = `test:${key}`;
    await this.cacheService.del(cacheKey);
    
    return {
      success: true,
      message: `Cache deleted for key: ${cacheKey}`
    };
  }

  /**
   * Performance test - multiple cache operations
   */
  @Post('performance/:count')
  async performanceTest(@Param('count') count: string): Promise<any> {
    const operationCount = parseInt(count, 10) || 100;
    const startTime = Date.now();
    
    const writePromises: Promise<boolean>[] = [];
    const readPromises: Promise<unknown>[] = [];
    
    // Test writes
    for (let i = 0; i < operationCount; i++) {
      const key = `perf:write:${i}`;
      const data = { index: i, timestamp: Date.now() };
      writePromises.push(this.cacheService.set(key, data, CacheTTL.POSTS_FEED));
    }
    
    const writeStartTime = Date.now();
    await Promise.all(writePromises);
    const writeEndTime = Date.now();
    
    // Test reads
    for (let i = 0; i < operationCount; i++) {
      const key = `perf:write:${i}`;
      readPromises.push(this.cacheService.get(key));
    }
    
    const readStartTime = Date.now();
    await Promise.all(readPromises);
    const readEndTime = Date.now();
    
    const totalTime = Date.now() - startTime;
    
    return {
      success: true,
      operations: operationCount,
      performance: {
        total_time_ms: totalTime,
        write_time_ms: writeEndTime - writeStartTime,
        read_time_ms: readEndTime - readStartTime,
        writes_per_second: Math.round(operationCount / ((writeEndTime - writeStartTime) / 1000)),
        reads_per_second: Math.round(operationCount / ((readEndTime - readStartTime) / 1000)),
        avg_write_time_ms: (writeEndTime - writeStartTime) / operationCount,
        avg_read_time_ms: (readEndTime - readStartTime) / operationCount
      }
    };
  }

  /**
   * Get cache health and statistics
   */
  @Get('health')
  async getCacheHealth(): Promise<any> {
    const health = await this.cacheHealth.checkHealth();
    const info = await this.cacheHealth.getCacheInfo();
    
    return {
      health: health,
      info: info,
      stats: this.cacheService.getStats()
    };
  }

  /**
   * Test cache key builders
   */
  @Get('keys/demo')
  async testKeyBuilders(): Promise<any> {
    const examples = {
      user_profile: `${CacheKeys.USER_PROFILE}:123`,
      user_session: `${CacheKeys.USER_SESSION}:session123`,
      post_details: `${CacheKeys.POST_DETAILS}:456`,
      post_comments: `${CacheKeys.POST_COMMENTS}:456`,
      chat_messages: `${CacheKeys.CHAT_MESSAGES}:789`,
      posts_feed: `${CacheKeys.POSTS_FEED}:dept123`
    };
    
    return {
      success: true,
      message: 'Cache key examples',
      examples: examples,
      ttl_strategies: {
        USER_SESSION: CacheTTL.USER_SESSION,
        USER_PROFILE: CacheTTL.USER_PROFILE,
        POSTS_FEED: CacheTTL.POSTS_FEED,
        CHAT_MESSAGES: CacheTTL.CHAT_MESSAGES,
        CHAT_MEMBERS: CacheTTL.CHAT_MEMBERS,
        COURSE_DATA: CacheTTL.COURSE_DATA,
        FILE_METADATA: CacheTTL.FILE_METADATA
      }
    };
  }

  /**
   * Clear all test cache entries
   */
  @Post('clear-test-cache')
  async clearTestCache(): Promise<any> {
    // Note: This is a simple implementation
    // In production, you might want to use Redis SCAN to find and delete keys
    const testKeys = ['test:', 'perf:'];
    let deletedCount = 0;
    
    // This is a simplified version - in production you'd use Redis SCAN
    for (let i = 0; i < 1000; i++) {
      try {
        await this.cacheService.del(`test:${i}`);
        await this.cacheService.del(`perf:write:${i}`);
        deletedCount += 2;
      } catch (error) {
        // Key doesn't exist, continue
      }
    }
    
    return {
      success: true,
      message: 'Test cache cleared',
      estimated_deleted_keys: deletedCount
    };
  }
}
