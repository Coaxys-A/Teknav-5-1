import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '../redis/redis.module';
import { AiContentConsumer } from './consumers/ai-content.consumer';
import { AiSeoConsumer } from './consumers/ai-seo.consumer';
import { WorkflowConsumer } from './consumers/workflow.consumer';
import { PluginConsumer } from './consumers/plugin.consumer';
import { AnalyticsConsumer } from './consumers/analytics.consumer';
import { EmailOtpConsumer } from './consumers/email-otp.consumer';
import { QueueStatsService } from './queue-stats.service';
import { DLQService } from './dlq.service';
import { QueueProducerService } from './queue.producer.service';
import { OwnerQueuesController } from './owner/queues.controller';
import { AuditLogService } from '../logging/audit-log.service';
import { DataAccessLogService } from '../logging/data-access-log.service';

export const QUEUE_NAMES = {
  AI_CONTENT: 'ai:content',
  AI_SEO: 'ai:seo',
  WORKFLOW: 'workflow',
  PLUGIN: 'plugin',
  ANALYTICS: 'analytics',
  EMAIL_OTP: 'email:otp',
} as const;

export const DLQ_NAMES = {
  AI_CONTENT: 'dlq:ai:content',
  AI_SEO: 'dlq:ai:seo',
  WORKFLOW: 'dlq:workflow',
  PLUGIN: 'dlq:plugin',
  ANALYTICS: 'dlq:analytics',
  EMAIL_OTP: 'dlq:email:otp',
} as const;

@Module({
  imports: [
    RedisModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 10,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({ name: QUEUE_NAMES.AI_CONTENT }),
    BullModule.registerQueue({ name: QUEUE_NAMES.AI_SEO }),
    BullModule.registerQueue({ name: QUEUE_NAMES.WORKFLOW }),
    BullModule.registerQueue({ name: QUEUE_NAMES.PLUGIN }),
    BullModule.registerQueue({ name: QUEUE_NAMES.ANALYTICS }),
    BullModule.registerQueue({ name: QUEUE_NAMES.EMAIL_OTP }),
    BullModule.registerQueue({ name: DLQ_NAMES.AI_CONTENT }),
    BullModule.registerQueue({ name: DLQ_NAMES.AI_SEO }),
    BullModule.registerQueue({ name: DLQ_NAMES.WORKFLOW }),
    BullModule.registerQueue({ name: DLQ_NAMES.PLUGIN }),
    BullModule.registerQueue({ name: DLQ_NAMES.ANALYTICS }),
    BullModule.registerQueue({ name: DLQ_NAMES.EMAIL_OTP }),
  ],
  controllers: [OwnerQueuesController],
  providers: [
    QueueStatsService,
    DLQService,
    QueueProducerService,
    AuditLogService,
    DataAccessLogService,
    AiContentConsumer,
    AiSeoConsumer,
    WorkflowConsumer,
    PluginConsumer,
    AnalyticsConsumer,
    EmailOtpConsumer,
  ],
  exports: [
    QueueStatsService,
    DLQService,
    QueueProducerService,
    AuditLogService,
    DataAccessLogService,
  ],
})
export class QueuesModule {}
