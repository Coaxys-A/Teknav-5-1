import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export type TerminalEvent = {
  type: 'queue_stats' | 'job_status' | 'dlq_stats' | 'workflow_step' | 'ai_task';
  data: any;
  timestamp: number;
};

/**
 * Admin Realtime Service - Pub/Sub for Owner Dashboard Live Events
 * 
 * Channel: teknav:terminal:events
 */

@Injectable()
export class AdminRealtimeService {
  private readonly logger = new Logger(AdminRealtimeService.name);
  private readonly CHANNEL = 'teknav:terminal:events';

  constructor(private readonly redis: RedisService) {}

  /**
   * Publish event to terminal channel
   */
  async publishEvent(event: Omit<TerminalEvent, 'timestamp'>) {
    const terminalEvent: TerminalEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.logger.debug(`Publishing terminal event: ${event.type}`);
    
    // Use Upstash REST for cross-region pub/sub (or ioredis for same-region)
    await this.redis.setViaRest(
      `pubsub:${this.CHANNEL}:${Date.now()}`,
      JSON.stringify(terminalEvent),
      60, // TTL 60s
    );

    // Publish via Redis pub/sub
    await this.redis.set(
      `pubsub:${this.CHANNEL}:latest`,
      JSON.stringify(terminalEvent),
      60,
    );
  }

  /**
   * Publish queue stats update
   */
  async publishQueueStats(queueName: string, stats: any) {
    await this.publishEvent({
      type: 'queue_stats',
      data: {
        queueName,
        stats,
      },
    });
  }

  /**
   * Publish job status update
   */
  async publishJobStatus(queueName: string, jobId: string, status: string, result?: any) {
    await this.publishEvent({
      type: 'job_status',
      data: {
        queueName,
        jobId,
        status,
        result,
      },
    });
  }

  /**
   * Publish DLQ stats update
   */
  async publishDLQStats(dlqName: string, stats: any) {
    await this.publishEvent({
      type: 'dlq_stats',
      data: {
        dlqName,
        stats,
      },
    });
  }

  /**
   * Publish workflow step progress
   */
  async publishWorkflowStep(instanceId: number, stepId: number, status: string, result?: any) {
    await this.publishEvent({
      type: 'workflow_step',
      data: {
        instanceId,
        stepId,
        status,
        result,
      },
    });
  }

  /**
   * Publish AI task progress
   */
  async publishAiTask(taskId: number, status: string, result?: any) {
    await this.publishEvent({
      type: 'ai_task',
      data: {
        taskId,
        status,
        result,
      },
    });
  }
}
