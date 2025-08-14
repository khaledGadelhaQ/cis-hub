import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { getCacheOptions } from '../../config/cache.config';
import { CacheHealthIndicator } from './cache.health';
import { CacheService } from '../services/cache.service';

/**
 * Global Cache Module
 * 
 * This module configures Redis-based caching for the entire application.
 * It's marked as @Global() so it can be used across all modules without
 * explicit imports.
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: () => getCacheOptions(),
    }),
  ],
  providers: [
    CacheService,
    CacheHealthIndicator,
  ],
  exports: [
    NestCacheModule,
    CacheService,
    CacheHealthIndicator,
  ],
})
export class CacheModule {}
