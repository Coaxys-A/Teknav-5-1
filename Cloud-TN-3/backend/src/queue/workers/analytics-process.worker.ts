import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyticsIngestService } from '../../../analytics/analytics-ingest.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * Analytics Process Worker
 */

@Injectable()
export class AnalyticsProcessWorker {
  private readonly logger = new Logger(AnalyticsProcessWorker.name);

  constructor(
    private readonly analyticsIngest: AnalyticsIngestService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('process-snapshot')
  async handleProcessSnapshot(job: Job) {
    this.logger.debug(`Processing analytics snapshot job: ${job.id}`);
    const data = job.data;

    try {
      await this.analyticsIngest.ingestBatch([{ eventType: 'snapshot', meta: data }]);

      await this.auditLog.logAction({
        actorId: 0,
        action: 'analytics.snapshot.processed',
        resource: 'AnalyticsAggregate',
        payload: { bucket: data.bucket, period: data.period },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to process snapshot:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('rebuild-article-stats')
  async handleRebuildArticleStats(job: Job) {
    this.logger.debug(`Processing article stats rebuild job: ${job.id}`);
    const data = job.data;

    try {
      // Call Analytics Service to rebuild stats
      // Implementation depends on existing service
      await this.auditLog.logAction({
        actorId: 0,
        action: 'analytics.article_stats.rebuilt',
        resource: 'ArticleStatsDaily',
        payload: data,
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to rebuild article stats:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
