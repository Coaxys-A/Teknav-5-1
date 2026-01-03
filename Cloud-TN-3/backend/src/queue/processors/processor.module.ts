import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiContentProcessor } from './ai-content.processor';
import { AiSeoProcessor } from './ai-seo.processor';
import { AiReviewProcessor } from './ai-review.processor';
import { WorkflowProcessor } from './workflow.processor';
import { PluginProcessor } from './plugin.processor';
import { AnalyticsProcessProcessor } from './analitycs-process.processor';
import { AnalyticsSnapshotProcessor } from './analitycs-snapshot.processor';
import { EmailSendProcessor } from './email-send.processor';
import { OtpSendProcessor } from './otp-send.processor';
import { WebhookProcessor } from './webhook.processor';
import { MediaProcessor } from './media.processor';
import { SearchProcessor } from './search.processor';
import { DlqService } from '../dlq/dlq.service';
import { QueueMetricsService } from '../metrics/queue-metrics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { AuditLogModule } from '../../logging/audit-log.module';
import { AiModule } from '../../ai/ai.module';
import { WorkflowModule } from '../../workflows/workflow.module';
import { PluginModule } from '../../plugins/plugin.module';
import { EmailModule } from '../../email/email.module';
import { MediaModule } from '../../media/media.module';

/**
 * Processor Module
 *
 * Aggregates all BullMQ processors.
 * Provides DlqService and QueueMetricsService.
 */

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuditLogModule,
    AiModule,
    WorkflowModule,
    PluginModule,
    EmailModule,
    MediaModule,
  ],
  providers: [
    AiContentProcessor,
    AiSeoProcessor,
    AiReviewProcessor,
    WorkflowProcessor,
    PluginProcessor,
    AnalyticsProcessProcessor,
    AnalyticsSnapshotProcessor,
    EmailSendProcessor,
    OtpSendProcessor,
    WebhookProcessor,
    MediaProcessor,
    SearchProcessor,
    DlqService,
    QueueMetricsService,
  ],
  exports: [
    DlqService,
    QueueMetricsService,
  ],
})
export class ProcessorModule {}
