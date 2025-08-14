import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { 
  CACHE_KEY, 
  CACHE_INVALIDATE_KEY, 
  CacheOptions, 
  CacheInvalidateOptions, 
  CacheKeyBuilder 
} from '../decorators/cache.decorator';

/**
 * Cache Interceptor
 * 
 * This interceptor handles automatic caching for methods decorated with @Cache
 * It implements the cache-aside pattern with configurable TTL and conditions.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Get cache options from decorator metadata
    const cacheOptions = this.reflector.get<CacheOptions>(
      CACHE_KEY,
      context.getHandler(),
    );

    // Get cache invalidation options from decorator metadata
    const invalidateOptions = this.reflector.get<CacheInvalidateOptions>(
      CACHE_INVALIDATE_KEY,
      context.getHandler(),
    );

    // Extract method arguments and details
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    const args = context.getArgs();
    const methodArgs = this.extractMethodArguments(context, args);

    // If method has invalidation decorator, handle cache invalidation
    if (invalidateOptions) {
      return this.executeAndInvalidate(next, methodArgs, handler, invalidateOptions, className, methodName);
    }

    // If no cache options, proceed without caching
    if (!cacheOptions) {
      return next.handle();
    }

    // For HTTP requests, skip the first arguments (req, res, next)
    // For other contexts, use all arguments
    
    try {
      // Build cache key
      const paramNames = this.getParameterNames(handler);
      const cacheKey = CacheKeyBuilder.build(
        cacheOptions.key,
        methodArgs,
        paramNames,
        cacheOptions.keyParams,
      );

      this.logger.debug(
        `Cache operation for ${className}.${methodName}() with key: ${cacheKey}`,
      );

      // If useCache is false, skip reading from cache
      if (cacheOptions.useCache === false) {
        return this.executeAndCache(next, cacheKey, cacheOptions);
      }

      // Try to get from cache first (cache-aside pattern)
      const cachedResult = await this.cacheService.get(cacheKey);
      
      if (cachedResult !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedResult);
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      
      // Execute method and cache result
      return this.executeAndCache(next, cacheKey, cacheOptions);

    } catch (error) {
      this.logger.error(
        `Cache interceptor error for ${className}.${methodName}():`,
        error,
      );
      // If cache fails, continue with normal execution
      return next.handle();
    }
  }

  /**
   * Execute the method and cache its result
   */
  private executeAndCache(
    next: CallHandler,
    cacheKey: string,
    options: CacheOptions,
  ): Observable<any> {
    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Check condition if provided
          if (options.condition && !options.condition(result)) {
            this.logger.debug(`Condition failed, not caching result for key: ${cacheKey}`);
            return;
          }

          // Cache the result
          await this.cacheService.set(cacheKey, result, options.ttl);
          this.logger.debug(`Cached result for key: ${cacheKey} with TTL: ${options.ttl}s`);
        } catch (error) {
          this.logger.error(`Failed to cache result for key: ${cacheKey}`, error);
        } 
      }),
    );
  }

  /**
   * Execute the method and invalidate cache keys
   */
  private executeAndInvalidate(
    next: CallHandler,
    methodArgs: any[],
    handler: Function,
    options: CacheInvalidateOptions,
    className: string,
    methodName: string,
  ): Observable<any> {
    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Check condition if provided
          if (options.condition && !options.condition(result, methodArgs)) {
            this.logger.debug(`Invalidation condition failed for ${className}.${methodName}()`);
            return;
          }

          // Build invalidation keys
          const paramNames = this.getParameterNames(handler);
          const keyTemplates = Array.isArray(options.keys) ? options.keys : [options.keys];
          
          // Separate exact keys from pattern keys
          const exactKeys: string[] = [];
          const patternKeys: string[] = [];

          keyTemplates.forEach(template => {
            const builtKey = CacheKeyBuilder.build(
              template,
              methodArgs,
              paramNames,
              options.keyParams,
            );

            if (builtKey.includes('*')) {
              patternKeys.push(builtKey);
            } else {
              exactKeys.push(builtKey);
            }
          });

          // Invalidate exact keys
          if (exactKeys.length > 0) {
            await this.cacheService.invalidateKeys(exactKeys);
            this.logger.debug(`Invalidated exact keys: ${exactKeys.join(', ')}`);
          }

          // Invalidate pattern keys
          for (const pattern of patternKeys) {
            const count = await this.cacheService.invalidateByPattern(pattern);
            this.logger.debug(`Invalidated ${count} keys matching pattern: ${pattern}`);
          }

        } catch (error) {
          this.logger.error(`Failed to invalidate cache for ${className}.${methodName}():`, error);
        }
      }),
    );
  }

  /**
   * Extract method arguments based on execution context
   */
  private extractMethodArguments(context: ExecutionContext, args: any[]): any[] {
    const contextType = context.getType();
    
    if (contextType === 'http') {
      // For HTTP controllers, skip req, res, next parameters
      // Usually method args start from index 2
      return args.slice(2) || [];
    }
    
    if (contextType === 'rpc' || contextType === 'ws') {
      // For microservices or websockets, usually first arg is data
      return args.slice(1) || [];
    }
    
    // Default: use all arguments
    return args;
  }

  /**
   * Extract parameter names from method signature
   * Note: This is a simplified implementation. For production,
   * consider using reflection-metadata or typescript-metadata
   */
  private getParameterNames(func: Function): string[] {
    const funcStr = func.toString().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    
    // Match function parameters
    const match = funcStr.match(/(?:function\s*)?[^(]*\(\s*([^)]*)\s*\)/);
    
    if (!match || !match[1]) {
      return [];
    }

    return match[1]
      .split(',')
      .map(param => {
        // Handle destructuring, default values, etc.
        return param.trim().split(/[\s=:]/)[0].replace(/[{}]/g, '');
      })
      .filter(param => param && param !== '');
  }
}
