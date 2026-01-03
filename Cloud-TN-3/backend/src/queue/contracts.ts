import { z } from 'zod';

/**
 * Queue & Job Contracts
 *
 * Single source of truth for:
 * - Queue names
 * - Job names
 * - Payload schemas (zod)
 * - Retry/backoff policies
 * - Timeout settings
 * - DLQ routing rules
 */

// ============================================================================
// QUEUE NAMES
// ============================================================================

export const QUEUE_NAMES = {
  AI: 'queue:ai',
  WORKFLOWS: 'queue:workflows',
  ANALYTICS: 'queue:analytics',
  EMAIL: 'queue:email',
  PLUGINS: 'queue:plugins',
  SYSTEM: 'queue:system',
  DLQ: 'queue:dlq',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// ============================================================================
// AI QUEUE JOB CONTRACTS
// ============================================================================

export const AI_JOB_NAMES = {
  CONTENT_GENERATE: 'ai.content.generate',
  SEO_OPTIMIZE: 'ai.seo.optimize',
  TRANSLATE: 'ai.translate',
  SCORE_RERUN: 'ai.score.rerun',
} as const;

export const AIContentGenerateSchema = z.object({
  articleId: z.number(),
  prompt: z.string().optional(),
  options: z.object({
    tone: z.enum(['professional', 'casual', 'technical', 'friendly']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    includeHeadings: z.boolean().optional(),
  }).optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  actorId: z.number().optional(),
});

export const AISeoOptimizeSchema = z.object({
  articleId: z.number(),
  currentContent: z.string(),
  currentTitle: z.string(),
  keywords: z.array(z.string()),
  options: z.object({
    optimizeMeta: z.boolean().optional(),
    optimizeStructure: z.boolean().optional(),
    generateSuggestions: z.boolean().optional(),
  }).optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  actorId: z.number().optional(),
});

export const AITranslateSchema = z.object({
  articleId: z.number(),
  targetLocale: z.string(),
  sourceContent: z.string(),
  sourceTitle: z.string(),
  options: z.object({
    preserveFormatting: z.boolean().optional(),
    translateMetadata: z.boolean().optional(),
  }).optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  actorId: z.number().optional(),
});

export const AIScoreRerunSchema = z.object({
  articleId: z.number(),
  articleVersionId: z.number().optional(),
  forceRecalculation: z.boolean().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
  actorId: z.number().optional(),
});

// ============================================================================
// WORKFLOW QUEUE JOB CONTRACTS
// ============================================================================

export const WORKFLOW_JOB_NAMES = {
  DISPATCH: 'workflow.dispatch',
  STEP_EXECUTE: 'workflow.step.execute',
  RETRY: 'workflow.retry',
} as const;

export const WorkflowDispatchSchema = z.object({
  workflowId: z.number(),
  triggerContext: z.object({
    source: z.enum(['manual', 'article_publish', 'scheduled', 'webhook', 'api']),
    actorId: z.number().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  input: z.record(z.any()).optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

export const WorkflowStepExecuteSchema = z.object({
  workflowInstanceId: z.number(),
  stepId: z.string(),
  stepType: z.enum(['action', 'condition', 'delay', 'parallel', 'loop']),
  input: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

export const WorkflowRetrySchema = z.object({
  workflowInstanceId: z.number(),
  fromStepId: z.string().optional(),
  retryContext: z.object({
    reason: z.string().optional(),
    retryCount: z.number().optional(),
  }).optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

// ============================================================================
// ANALYTICS QUEUE JOB CONTRACTS
// ============================================================================

export const ANALYTICS_JOB_NAMES = {
  SNAPSHOT_HOURLY: 'analytics.snapshot.hourly',
  AGGREGATE_DAILY: 'analytics.aggregate.daily',
  RECOMPUTE_RANGE: 'analytics.recompute.range',
} as const;

export const AnalyticsSnapshotHourlySchema = z.object({
  bucket: z.string(), // ISO datetime
  forceRefresh: z.boolean().optional(),
});

export const AnalyticsAggregateDailySchema = z.object({
  date: z.string(), // ISO date
  forceRefresh: z.boolean().optional(),
});

export const AnalyticsRecomputeRangeSchema = z.object({
  startDate: z.string(), // ISO date
  endDate: z.string(), // ISO date
  eventTypes: z.array(z.string()).optional(),
  force: z.boolean().optional(),
});

// ============================================================================
// EMAIL QUEUE JOB CONTRACTS
// ============================================================================

export const EMAIL_JOB_NAMES = {
  SEND: 'email.send',
  OTP_SEND: 'otp.send',
  NOTIFICATION_DISPATCH: 'notification.dispatch',
} as const;

export const EmailSendSchema = z.object({
  emailLogId: z.number().optional(),
  to: z.string().email(),
  templateKey: z.string(),
  context: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

export const OtpSendSchema = z.object({
  otpCodeId: z.number().optional(),
  userId: z.number(),
  channel: z.enum(['email', 'sms']),
  purpose: z.enum(['LOGIN', 'MFA', 'RESET']),
  code: z.string().min(6).max(6),
  expiresAt: z.string(), // ISO datetime
  ipAddress: z.string().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

export const NotificationDispatchSchema = z.object({
  notificationId: z.number(),
  userId: z.number().optional(),
  channel: z.enum(['email', 'sms', 'push', 'inapp']),
  template: z.string(),
  payload: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

// ============================================================================
// PLUGINS QUEUE JOB CONTRACTS
// ============================================================================

export const PLUGIN_JOB_NAMES = {
  EXECUTE: 'plugin.execute',
  WEBHOOK_DELIVER: 'plugin.webhook.deliver',
  EVENT_DISPATCH: 'plugin.event.dispatch',
} as const;

export const PluginExecuteSchema = z.object({
  pluginId: z.string(),
  executionContext: z.object({
    trigger: z.string(),
    userId: z.number().optional(),
    resourceId: z.string().optional(),
    resourceType: z.string().optional(),
  }),
  input: z.record(z.any()).optional(),
  timeoutMs: z.number().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

export const PluginWebhookDeliverSchema = z.object({
  webhookId: z.string(),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

export const PluginEventDispatchSchema = z.object({
  pluginId: z.string(),
  eventType: z.string(),
  eventPayload: z.record(z.any()),
  targetPlugins: z.array(z.string()).optional(),
  async: z.boolean().default(true),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

// ============================================================================
// SYSTEM QUEUE JOB CONTRACTS
// ============================================================================

export const SYSTEM_JOB_NAMES = {
  CACHE_INVALIDATE: 'cache.invalidate',
  INDEX_REBUILD: 'index.rebuild',
  HEALTH_CHECK: 'health.check',
} as const;

export const CacheInvalidateSchema = z.object({
  pattern: z.string().optional(),
  keys: z.array(z.string()).optional(),
  reason: z.string(),
  actorId: z.number().optional(),
});

export const IndexRebuildSchema = z.object({
  indexType: z.enum(['search', 'recommendation', 'all']),
  entityIds: z.array(z.number()).optional(),
  forceFullRebuild: z.boolean().default(false),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

export const HealthCheckSchema = z.object({
  checks: z.array(z.enum(['redis', 'database', 'queue', 'external_api'])).optional(),
  notifyOnFailure: z.boolean().default(true),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

// ============================================================================
// DLQ JOB CONTRACTS
// ============================================================================

export const DLQJobSchema = z.object({
  originalQueue: z.string(),
  originalJobId: z.string(),
  originalJobName: z.string(),
  payload: z.any(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
    code: z.string().optional(),
  }),
  firstFailedAt: z.string(), // ISO datetime
  lastFailedAt: z.string(), // ISO datetime
  attemptsMade: z.number(),
  isReplayed: z.boolean().default(false),
  replayCount: z.number().default(0),
  lastReplayedAt: z.string().optional(),
  workspaceId: z.number().optional(),
  tenantId: z.number().optional(),
});

// ============================================================================
// QUEUE CONFIGURATIONS
// ============================================================================

export interface QueueConfig {
  name: string;
  defaultJobOptions: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: {
      age?: number;
      count?: number;
    };
    removeOnFail?: boolean;
    timeout?: number;
  };
  dlqEnabled: boolean;
}

export const QUEUE_CONFIGS: Record<QueueName, QueueConfig> = {
  [QUEUE_NAMES.AI]: {
    name: QUEUE_NAMES.AI,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 7200, // 2 hours
        count: 100,
      },
      removeOnFail: false,
      timeout: 120000, // 2 minutes
    },
    dlqEnabled: true,
  },
  [QUEUE_NAMES.WORKFLOWS]: {
    name: QUEUE_NAMES.WORKFLOWS,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
      removeOnComplete: {
        age: 86400, // 24 hours
        count: 500,
      },
      removeOnFail: false,
      timeout: 300000, // 5 minutes
    },
    dlqEnabled: true,
  },
  [QUEUE_NAMES.ANALYTICS]: {
    name: QUEUE_NAMES.ANALYTICS,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 3600, // 1 hour
        count: 100,
      },
      removeOnFail: false,
      timeout: 600000, // 10 minutes
    },
    dlqEnabled: true,
  },
  [QUEUE_NAMES.EMAIL]: {
    name: QUEUE_NAMES.EMAIL,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
      removeOnComplete: {
        age: 7200, // 2 hours
        count: 1000,
      },
      removeOnFail: false,
      timeout: 30000, // 30 seconds
    },
    dlqEnabled: true,
  },
  [QUEUE_NAMES.PLUGINS]: {
    name: QUEUE_NAMES.PLUGINS,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 3600, // 1 hour
        count: 50,
      },
      removeOnFail: false,
      timeout: 60000, // 1 minute
    },
    dlqEnabled: true,
  },
  [QUEUE_NAMES.SYSTEM]: {
    name: QUEUE_NAMES.SYSTEM,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      removeOnComplete: {
        age: 3600, // 1 hour
        count: 100,
      },
      removeOnFail: false,
      timeout: 60000, // 1 minute
    },
    dlqEnabled: false, // System jobs usually don't go to DLQ
  },
  [QUEUE_NAMES.DLQ]: {
    name: QUEUE_NAMES.DLQ,
    defaultJobOptions: {
      attempts: 1,
      backoff: {
        type: 'fixed',
        delay: 0,
      },
      removeOnComplete: {
        age: 604800, // 7 days
        count: 1000,
      },
      removeOnFail: false,
      timeout: 0, // No timeout for DLQ
    },
    dlqEnabled: false, // DLQ doesn't have a DLQ
  },
};

// ============================================================================
// JOB VALIDATION MAPPING
// ============================================================================

export const JOB_VALIDATION_SCHEMAS: Record<string, z.ZodSchema> = {
  // AI jobs
  [AI_JOB_NAMES.CONTENT_GENERATE]: AIContentGenerateSchema,
  [AI_JOB_NAMES.SEO_OPTIMIZE]: AISeoOptimizeSchema,
  [AI_JOB_NAMES.TRANSLATE]: AITranslateSchema,
  [AI_JOB_NAMES.SCORE_RERUN]: AIScoreRerunSchema,

  // Workflow jobs
  [WORKFLOW_JOB_NAMES.DISPATCH]: WorkflowDispatchSchema,
  [WORKFLOW_JOB_NAMES.STEP_EXECUTE]: WorkflowStepExecuteSchema,
  [WORKFLOW_JOB_NAMES.RETRY]: WorkflowRetrySchema,

  // Analytics jobs
  [ANALYTICS_JOB_NAMES.SNAPSHOT_HOURLY]: AnalyticsSnapshotHourlySchema,
  [ANALYTICS_JOB_NAMES.AGGREGATE_DAILY]: AnalyticsAggregateDailySchema,
  [ANALYTICS_JOB_NAMES.RECOMPUTE_RANGE]: AnalyticsRecomputeRangeSchema,

  // Email jobs
  [EMAIL_JOB_NAMES.SEND]: EmailSendSchema,
  [EMAIL_JOB_NAMES.OTP_SEND]: OtpSendSchema,
  [EMAIL_JOB_NAMES.NOTIFICATION_DISPATCH]: NotificationDispatchSchema,

  // Plugin jobs
  [PLUGIN_JOB_NAMES.EXECUTE]: PluginExecuteSchema,
  [PLUGIN_JOB_NAMES.WEBHOOK_DELIVER]: PluginWebhookDeliverSchema,
  [PLUGIN_JOB_NAMES.EVENT_DISPATCH]: PluginEventDispatchSchema,

  // System jobs
  [SYSTEM_JOB_NAMES.CACHE_INVALIDATE]: CacheInvalidateSchema,
  [SYSTEM_JOB_NAMES.INDEX_REBUILD]: IndexRebuildSchema,
  [SYSTEM_JOB_NAMES.HEALTH_CHECK]: HealthCheckSchema,

  // DLQ jobs
  ['dlq.job']: DLQJobSchema,
};

// ============================================================================
// REALTIME EVENT CONTRACTS
// ============================================================================

export const REALTIME_CHANNELS = {
  OWNER_EVENTS: 'teknav:owner:events',
  QUEUE_EVENTS: 'teknav:queues:events',
  WORKFLOW_EVENTS: 'teknav:workflows:events',
  PLUGIN_EVENTS: 'teknav:plugins:events',
  ANALYTICS_EVENTS: 'teknav:analytics:events',
} as const;

export type RealtimeChannel = typeof REALTIME_CHANNELS[keyof typeof REALTIME_CHANNELS];

export const EVENT_SEVERITY = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export type EventSeverity = typeof EVENT_SEVERITY[keyof typeof EVENT_SEVERITY];

export interface RealtimeEvent {
  type: string;
  ts: number;
  workspaceId?: number;
  tenantId?: number;
  actorId?: number;
  queue?: string;
  jobId?: string;
  severity: EventSeverity;
  message: string;
  meta?: Record<string, any>;
}

// ============================================================================
// QUEUE STATS CACHE KEYS
// ============================================================================

export const QUEUE_STATS_KEYS = {
  STATS: (queueName: string) => `q:stats:${queueName}`,
  THROUGHPUT: (queueName: string) => `q:throughput:${queueName}`,
  LAST_UPDATE: (queueName: string) => `q:last_update:${queueName}`,
  ALL_QUEUES_STATS: 'q:stats:all',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getQueueConfig(queueName: string): QueueConfig | undefined {
  return Object.values(QUEUE_CONFIGS).find(q => q.name === queueName);
}

export function getDLQName(originalQueue: string): string {
  return `${originalQueue}:dlq`;
}

export function getJobSchema(jobName: string): z.ZodSchema | undefined {
  return JOB_VALIDATION_SCHEMAS[jobName];
}

export function isValidQueueName(name: string): name is QueueName {
  return Object.values(QUEUE_NAMES).includes(name as QueueName);
}
