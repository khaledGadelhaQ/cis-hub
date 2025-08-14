import { Injectable } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

/**
 * Cache Health Check Result for HTTP endpoints
 */
export interface CacheHealthResult {
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: string;
  error?: string;
}

/**
 * Cache Health Indicator
 * 
 * This service provides health check functionality for HTTP endpoints
 * by delegating to the core CacheService health check.
 */
@Injectable()
export class CacheHealthIndicator extends CacheService {
  
  /**
   * HTTP-friendly health check that uses the core cache service
   */
  async checkHealth(): Promise<CacheHealthResult> {
    const health = await this.healthCheck();
    
    return {
      status: health.isHealthy ? 'healthy' : 'unhealthy',
      message: health.isHealthy 
        ? 'Cache is available and responding' 
        : 'Cache is not responding',
      responseTime: `${health.responseTime}ms`,
      error: health.error,
    };
  }

  /**
   * Get cache connection info (for debugging)
   */
  async getCacheInfo(): Promise<any> {
    try {
      const stats = this.getStats();
      return {
        status: 'connected',
        type: 'redis',
        stats: {
          hitRatio: `${(stats.hitRatio * 100).toFixed(2)}%`,
          totalOperations: stats.total,
          hits: stats.hits,
          misses: stats.misses,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
