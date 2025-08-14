import { SetMetadata } from '@nestjs/common';

/**
 * Cache Decorator
 * 
 * This decorator provides a simple way to add caching to service methods.
 * It uses metadata to store cache configuration that can be read by an interceptor.
 */

export interface CacheOptions {
  /**
   * Cache key template. Use {param} syntax for dynamic values.
   * Example: 'user:profile:{userId}' or 'posts:feed:{departmentId}:{page}'
   */
  key: string;

  /**
   * Time-to-live in seconds
   */
  ttl: number;

  /**
   * Optional condition function to determine if result should be cached
   * @param result The method result
   * @returns true if should cache, false otherwise
   */
  condition?: (result: any) => boolean;

  /**
   * Whether to use cache-aside pattern (default: true)
   * If true, will attempt to get from cache first, then execute method if miss
   * If false, will only store result in cache without reading from it
   */
  useCache?: boolean;

  /**
   * Parameters to extract for cache key. If not specified, all parameters will be used.
   * Example: ['userId', 'departmentId'] for method(userId, departmentId, options)
   */
  keyParams?: string[];
}

/**
 * Cache invalidation options
 */
export interface CacheInvalidateOptions {
  /**
   * Cache key patterns to invalidate. Supports wildcards with *
   * Example: 'user:profile:*' or ['user:profile:{userId}', 'users:all:*']
   */
  keys: string | string[];

  /**
   * Parameters to extract for invalidation keys. If not specified, all parameters will be used.
   */
  keyParams?: string[];

  /**
   * Optional condition function to determine if cache should be invalidated
   * @param result The method result
   * @param args The method arguments
   * @returns true if should invalidate, false otherwise
   */
  condition?: (result: any, args: any[]) => boolean;
}

export const CACHE_KEY = 'cache:options';
export const CACHE_INVALIDATE_KEY = 'cache:invalidate';

/**
 * Decorator to add caching behavior to a method
 * 
 * @param options Cache configuration options
 * 
 * @example
 * ```typescript
 * @Cache({
 *   key: 'user:profile:{{userId}}',
 *   ttl: CacheTTL.USER_PROFILE,
 *   condition: (result) => result != null
 * })
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   return this.prisma.user.findUnique({ where: { id: userId } });
 * }
 * ```
 */
export function Cache(options: CacheOptions) {
  return SetMetadata(CACHE_KEY, options);
}

/**
 * Decorator to add cache invalidation behavior to a method
 * 
 * @param options Cache invalidation configuration options
 * 
 * @example
 * ```typescript
 * @CacheInvalidate({
 *   keys: ['user:profile:{{userId}}', 'users:all:*'],
 *   condition: (result) => result && result.id
 * })
 * async updateUser(userId: string, updateData: UpdateUserDto): Promise<User> {
 *   return this.prisma.user.update({ where: { id: userId }, data: updateData });
 * }
 * ```
 */
export function CacheInvalidate(options: CacheInvalidateOptions) {
  return SetMetadata(CACHE_INVALIDATE_KEY, options);
}

/**
 * Cache key builder utility
 */
export class CacheKeyBuilder {
  /**
   * Build cache key from template and parameters
   * 
   * @param template Key template with {param} placeholders
   * @param params Method parameters
   * @param paramNames Parameter names (from method signature)
   * @param keyParams Optional specific parameters to use
   * @returns Built cache key
   */
  static build(
    template: string,
    params: any[],
    paramNames: string[],
    keyParams?: string[]
  ): string {
    let key = template;
    
    // If specific key params are defined, use only those
    if (keyParams && keyParams.length > 0) {
      keyParams.forEach((paramName, index) => {
        const paramIndex = paramNames.indexOf(paramName);
        if (paramIndex >= 0 && paramIndex < params.length) {
          const placeholder = `{${paramName}}`;
          const value = this.serializeParam(params[paramIndex]);
          key = key.replace(new RegExp(placeholder, 'g'), value);
        }
      });
    } else {
      // Use all parameters
      paramNames.forEach((paramName, index) => {
        if (index < params.length) {
          const placeholder = `{${paramName}}`;
          const value = this.serializeParam(params[index]);
          key = key.replace(new RegExp(placeholder, 'g'), value);
        }
      });
    }
    
    return key;
  }

  /**
   * Serialize parameter value for cache key
   */
  private static serializeParam(param: any): string {
    if (param === null || param === undefined) {
      return 'null';
    }
    
    if (typeof param === 'object') {
      // For objects, create a stable string representation
      try {
        return JSON.stringify(param, Object.keys(param).sort());
      } catch {
        return String(param);
      }
    }
    
    return String(param);
  }

  /**
   * Extract parameter names from method signature
   * This is a simple implementation - in production you might want to use reflection
   */
  static getParameterNames(func: Function): string[] {
    const funcStr = func.toString();
    const paramMatch = funcStr.match(/\(([^)]*)\)/);
    
    if (!paramMatch || !paramMatch[1]) {
      return [];
    }
    
    return paramMatch[1]
      .split(',')
      .map(param => param.trim().split(/\s+/)[0].replace(/[{}]/g, ''))
      .filter(param => param && param !== '');
  }

  /**
   * Build invalidation keys from templates and parameters
   * 
   * @param keyTemplates Array of key templates with placeholders
   * @param params Method parameters
   * @param paramNames Parameter names (from method signature)
   * @param keyParams Optional specific parameters to use
   * @returns Array of built invalidation keys
   */
  static buildInvalidationKeys(
    keyTemplates: string[],
    params: any[],
    paramNames: string[],
    keyParams?: string[]
  ): string[] {
    return keyTemplates.map(template => 
      this.build(template, params, paramNames, keyParams)
    );
  }
}
