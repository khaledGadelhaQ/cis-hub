/**
 * Queue Module Exports
 * 
 * Central export point for all queue-related functionality
 */

// Main module
export { QueueModule } from './queue.module';

// Configuration
export * from '../config/queue.config';

// DTOs
export * from './dto/queue-job.dto';

// Re-export commonly used Bull types for convenience
export { Queue, Job, JobOptions } from 'bull';
export { InjectQueue } from '@nestjs/bull';
