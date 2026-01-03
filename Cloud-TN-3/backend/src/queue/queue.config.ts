/**
 * Queue Config
 *
 * Centralized configuration for all BullMQ queues.
 * Defines names, retry policies, concurrency, etc.
 */

export const QUEUE_NAMES = [
  'ai:content',
  'ai:seo',
  'ai:review',
  'workflows:run',
  'plugins:execute',
  'analytics:process',
  'analytics:snapshot',
  'email:send',
  'otp:send',
  'webhooks:deliver',
  'media:optimize',
  'search:index',
] as const;

/**
 * Queue Config
 */
export interface QueueConfig {
  name: string;
  concurrency?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
  lockDuration?: number;
  stalledInterval?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

/**
 * Default Queue Configurations
 */
export const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  'ai:content': {
    name: 'ai:content',
    concurrency: 2,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'ai:seo': {
    name: 'ai:seo',
    concurrency: 3,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'ai:review': {
    name: 'ai:review',
    concurrency: 2,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'workflows:run': {
    name: 'workflows:run',
    concurrency: 5,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'plugins:execute': {
    name: 'plugins:execute',
    concurrency: 2,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'analytics:process': {
    name: 'analytics:process',
    concurrency: 10,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
    limiter: {
      max: 100,
      duration: 60000, // 1 min
    },
  },
  'analytics:snapshot': {
    name: 'analytics:snapshot',
    concurrency: 2,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'email:send': {
    name: 'email:send',
    concurrency: 5,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
    limiter: {
      max: 50,
      duration: 60000, // 1 min
    },
  },
  'otp:send': {
    name: 'otp:send',
    concurrency: 3,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
    lockDuration: 60000,
    stalledInterval: 30000,
    limiter: {
      max: 30,
      duration: 60000, // 1 min
    },
  },
  'webhooks:deliver': {
    name: 'webhooks:deliver',
    concurrency: 10,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'media:optimize': {
    name: 'media:optimize',
    concurrency: 2,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  'search:index': {
    name: 'search:index',
    concurrency: 3,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    lockDuration: 60000,
    stalledInterval: 30000,
  },
};

/**
 * DLQ Queue Name for a given queue
 */
export function getDLQName(queueName: string): string {
  return `${queueName}:dlq`;
}
