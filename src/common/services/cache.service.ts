import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheTTL } from '../../config/cache.config';

/**
 * Interface for cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
  total: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    invalidations: number;
  };
}

/**
 * Interface for cache health status
 */
export interface CacheHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}

/**
 * Core Cache Service
 * 
 * This service provides a robust abstraction layer over the cache manager
 * with error handling, metrics collection, and advanced caching patterns.
 */
@Injectable()
export class CacheService {
  protected readonly logger = new Logger(CacheService.name);
  
  // Cache statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRatio: 0,
    total: 0,
    operations: {
      gets: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
    },
  };

  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {}

  /**
   * Get value from cache with error handling and metrics
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      this.stats.operations.gets++;
      const startTime = Date.now();
      
      const value = await this.cacheManager.get<T>(key);
      
      const duration = Date.now() - startTime;
      
      if (value !== undefined && value !== null) {
        this.stats.hits++;
        this.logger.debug(`Cache HIT for key: ${key} (${duration}ms)`);
        return value;
      } else {
        this.stats.misses++;
        this.logger.debug(`Cache MISS for key: ${key} (${duration}ms)`);
        return null;
      }
    } catch (error) {
      this.stats.misses++;
      this.logger.error(`Cache GET error for key ${key}:`, error.message);
      return null;
    } finally {
      this.updateHitRatio();
    }
  }

  /**
   * Set value in cache with error handling
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      this.stats.operations.sets++;
      const startTime = Date.now();
      
      await this.cacheManager.set(key, value, ttl);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache SET for key: ${key} (${duration}ms, TTL: ${ttl || 'default'}s)`);
      
      return true;
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete specific key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      this.stats.operations.deletes++;
      const startTime = Date.now();
      
      await this.cacheManager.del(key);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache DELETE for key: ${key} (${duration}ms)`);
      
      return true;
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get or Set pattern - cache-aside strategy
   * 
   * This is the most common caching pattern:
   * 1. Try to get from cache
   * 2. If miss, execute factory function
   * 3. Store result in cache
   * 4. Return result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute factory
    const startTime = Date.now();
    try {
      const freshValue = await factory();
      const executionTime = Date.now() - startTime;
      
      // Store in cache for next time
      await this.set(key, freshValue, ttl);
      
      this.logger.debug(`Cache factory execution for key ${key}: ${executionTime}ms`);
      return freshValue;
    } catch (error) {
      this.logger.error(`Cache factory execution failed for key ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern (for Redis SCAN-based invalidation)
   * 
   * Note: This is a potentially expensive operation in production.
   * Use sparingly and prefer explicit key deletion when possible.
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      this.stats.operations.invalidations++;
      const startTime = Date.now();
      
      // For now, we'll use a simple approach
      // In production, this should use Redis SCAN for efficiency
      const keys = await this.getKeysByPattern(pattern);
      
      if (keys.length > 0) {
        // Delete all matching keys
        await Promise.all(keys.map(key => this.del(key)));
      }
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache INVALIDATE pattern ${pattern}: ${keys.length} keys (${duration}ms)`);
      
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache INVALIDATE error for pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Invalidate multiple specific keys
   */
  async invalidateKeys(keys: string[]): Promise<void> {
    try {
      this.stats.operations.invalidations++;
      const startTime = Date.now();
      
      await Promise.all(keys.map(key => this.del(key)));
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache INVALIDATE ${keys.length} keys (${duration}ms)`);
    } catch (error) {
      this.logger.error(`Cache INVALIDATE multiple keys error:`, error.message);
    }
  }

  /**
   * Check cache health
   */
  async healthCheck(): Promise<CacheHealthStatus> {
    try {
      const startTime = Date.now();
      const testKey = 'health-check-test';
      const testValue = 'ok';
      
      // Test write
      await this.cacheManager.set(testKey, testValue, 10);
      
      // Test read
      const result = await this.cacheManager.get(testKey);
      
      // Cleanup
      await this.cacheManager.del(testKey);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = result === testValue;
      
      return {
        isHealthy,
        responseTime,
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      total: 0,
      operations: {
        gets: 0,
        sets: 0,
        deletes: 0,
        invalidations: 0,
      },
    };
  }

  /**
   * Helper method to get keys by pattern
   * 
   * Note: This is a simplified implementation.
   * In production with large datasets, use Redis SCAN command.
   */
  private async getKeysByPattern(pattern: string): Promise<string[]> {
    // TODO:
    // This is a placeholder implementation
    // In a real Redis implementation, you would use SCAN
    // For now, return empty array - we'll implement this properly later
    this.logger.warn(`Pattern-based key search not fully implemented: ${pattern}`);
    return [];
  }

  /**
   * Update hit ratio calculation
   */
  private updateHitRatio(): void {
    this.stats.total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = this.stats.total > 0 ? this.stats.hits / this.stats.total : 0;
  }
}
