import { z } from 'zod';

/**
 * Queue Validators (Zod)
 *
 * Schemas for queue forms:
 * - Queue control (pause/resume/purge)
 * - Job action (retry/remove)
 * - DLQ action (replay single/batch, purge, delete)
 */

export const QueueControlSchema = z.object({
  action: z.enum(['pause', 'resume', 'purge']),
});

export const JobActionSchema = z.object({
  action: z.enum(['retry', 'remove']),
});

export const DlqActionSchema = z.object({
  action: z.enum(['replay', 'replay-batch', 'purge', 'delete']),
  dlqJobIds: z.array(z.string()).optional(),
  dlqJobId: z.string().optional(),
});

export const QueueStatsSchema = z.object({
  queueName: z.string(),
  state: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed']),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export const DlqStatsSchema = z.object({
  queueName: z.string(),
  filters: z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    errorType: z.string().optional(),
    jobId: z.string().optional(),
  }),
});
