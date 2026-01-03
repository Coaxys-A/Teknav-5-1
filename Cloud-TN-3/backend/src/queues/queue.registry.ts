import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

/**
 * Queue Registry - Centralized queue management
 */

export type JobEnvelope = {
  tenantId?: number;
  workspaceId?: number;
  actorUserId?: number;
  traceId?: string;
  type: string;
  payload: any;
  createdAt: string;
};

export const QUEUE_PREFIX = process.env.REDIS_KEY_PREFIX || 'teknav';

// Queue Names
export const QUEUE_NAMES = {
  AI_CONTENT: 'ai:content',
  AI_SEO: 'ai:seo',
  WORKFLOW_RUNTIME: 'workflow:runtime',
  PLUGIN_WEBHOOKS: 'plugin:webhooks',
  ANALYTICS_PROCESS: 'analytics:process',
  EMAIL_OUTBOUND: 'email:outbound',
} as const;

// DLQ Names
export const DLQ_NAMES = {
  AI_CONTENT: 'dlq:ai:content',
  AI_SEO: 'dlq:ai:seo',
  WORKFLOW_RUNTIME: 'dlq:workflow:runtime',
  PLUGIN_WEBHOOKS: 'dlq:plugin:webhooks',
  ANALYTICS_PROCESS: 'dlq:analytics:process',
  EMAIL_OUTBOUND: 'dlq:email:outbound',
} as const;

// Connection object for BullMQ
export interface QueueConnection {
  queue: Queue;
  connection: Redis;
}

/**
 * Get full queue name with prefix
 */
export const getQueueName = (name: string): string => {
  return `${QUEUE_PREFIX}:queues:${name}`;
};

/**
 * Get full DLQ name with prefix
 */
export const getDLQName = (name: string): string => {
  return `${QUEUE_PREFIX}:dlq:${name}`;
};

/**
 * Get all queue names
 */
export const getQueueNames = (): string[] => {
  return Object.values(QUEUE_NAMES);
};

/**
 * Get all DLQ names
 */
export const getDLQNames = (): string[] => {
  return Object.values(DLQ_NAMES);
};

/**
 * Job Types for AI Content
 */
export const AI_CONTENT_JOB_TYPES = {
  GENERATE_ARTICLE_DRAFT: 'generate_article_draft',
  REWRITE_ARTICLE: 'rewrite_article',
  SUMMARIZE_ARTICLE: 'summarize_article',
} as const;

/**
 * Job Types for AI SEO
 */
export const AI_SEO_JOB_TYPES = {
  SEO_GENERATE: 'seo_generate',
  SEO_AUDIT: 'seo_audit',
} as const;

/**
 * Job Types for Workflow Runtime
 */
export const WORKFLOW_JOB_TYPES = {
  RUN_WORKFLOW_INSTANCE: 'run_workflow_instance',
} as const;

/**
 * Job Types for Plugin Webhooks
 */
export const PLUGIN_WEBHOOK_JOB_TYPES = {
  PLUGIN_EXECUTE_HOOK: 'plugin_execute_hook',
} as const;

/**
 * Job Types for Analytics Processing
 */
export const ANALYTICS_JOB_TYPES = {
  AGGREGATE_HOURLY: 'aggregate_hourly',
  AGGREGATE_DAILY: 'aggregate_daily',
  MATERIALIZE_FUNNELS: 'materialize_funnels',
} as const;

/**
 * Job Types for Email/Notifications
 */
export const EMAIL_JOB_TYPES = {
  SEND_EMAIL: 'send_email',
  SEND_OTP: 'send_otp',
} as const;
