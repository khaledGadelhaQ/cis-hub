/**
 * Environment Configuration Validation
 * 
 * This script validates that all required environment variables are set
 * for the queue system to work properly.
 */

import { Logger } from '@nestjs/common';

interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  private static readonly logger = new Logger(ConfigValidator.name);

  /**
   * Validate queue-related environment variables
   */
  static validateQueueConfig(): EnvironmentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required Redis configuration
    if (!process.env.REDIS_HOST) {
      errors.push('REDIS_HOST is required for queue functionality');
    }

    if (!process.env.REDIS_PORT) {
      warnings.push('REDIS_PORT not set, using default 6379');
    }

    if (!process.env.REDIS_CACHE_DB) {
      warnings.push('REDIS_CACHE_DB not set, using default 0');
    }

    if (!process.env.REDIS_QUEUE_DB) {
      warnings.push('REDIS_QUEUE_DB not set, using default 1');
    }

    // Queue concurrency settings
    const concurrencySettings = [
      'QUEUE_CONCURRENCY_NOTIFICATIONS',
      'QUEUE_CONCURRENCY_CHAT_AUTOMATION',
      'QUEUE_CONCURRENCY_ACADEMIC_SYNC',
      'QUEUE_CONCURRENCY_EMAIL',
      'QUEUE_CONCURRENCY_MONITORING',
    ];

    concurrencySettings.forEach(setting => {
      if (!process.env[setting]) {
        warnings.push(`${setting} not set, using default concurrency`);
      }
    });

    // Queue dashboard settings
    if (process.env.QUEUE_DASHBOARD_ENABLED === 'true') {
      if (!process.env.QUEUE_DASHBOARD_USERNAME) {
        errors.push('QUEUE_DASHBOARD_USERNAME is required when dashboard is enabled');
      }
      if (!process.env.QUEUE_DASHBOARD_PASSWORD) {
        errors.push('QUEUE_DASHBOARD_PASSWORD is required when dashboard is enabled');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate all environment configurations
   */
  static validateAllConfigs(): EnvironmentValidation {
    const queueValidation = this.validateQueueConfig();
    
    // Add other validations here as needed
    
    return queueValidation;
  }

  /**
   * Log validation results
   */
  static logValidationResults(validation: EnvironmentValidation): void {
    if (validation.isValid) {
      this.logger.log('✅ Environment configuration is valid');
    } else {
      this.logger.error('❌ Environment configuration has errors:');
      validation.errors.forEach(error => this.logger.error(`  - ${error}`));
    }

    if (validation.warnings.length > 0) {
      this.logger.warn('⚠️  Environment configuration warnings:');
      validation.warnings.forEach(warning => this.logger.warn(`  - ${warning}`));
    }
  }

  /**
   * Get current queue configuration summary
   */
  static getQueueConfigSummary() {
    return {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || '6379',
        cacheDb: process.env.REDIS_CACHE_DB || '0',
        queueDb: process.env.REDIS_QUEUE_DB || '1',
        passwordSet: !!process.env.REDIS_PASSWORD,
      },
      concurrency: {
        notifications: parseInt(process.env.QUEUE_CONCURRENCY_NOTIFICATIONS || '5'),
        chatAutomation: parseInt(process.env.QUEUE_CONCURRENCY_CHAT_AUTOMATION || '3'),
        academicSync: parseInt(process.env.QUEUE_CONCURRENCY_ACADEMIC_SYNC || '2'),
        email: parseInt(process.env.QUEUE_CONCURRENCY_EMAIL || '2'),
        monitoring: parseInt(process.env.QUEUE_CONCURRENCY_MONITORING || '1'),
      },
      dashboard: {
        enabled: process.env.QUEUE_DASHBOARD_ENABLED === 'true',
        port: process.env.QUEUE_DASHBOARD_PORT || '3001',
        authConfigured: !!(process.env.QUEUE_DASHBOARD_USERNAME && process.env.QUEUE_DASHBOARD_PASSWORD),
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
