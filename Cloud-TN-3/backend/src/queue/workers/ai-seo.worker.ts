import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from '../../../ai/ai.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * AI SEO Worker
 */

@Injectable()
export class AiSeoWorker {
  private readonly logger = new Logger(AiSeoWorker.name);

  constructor(
    private readonly aiService: AiService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('optimize-seo')
  async handleOptimizeSeo(job: Job) {
    this.logger.debug(`Processing AI SEO job: ${job.id}`);
    const data = job.data;

    try {
      const result = await this.aiService.seoOptimize({
        articleId: data.articleId,
        localeCode: data.localeCode,
        modelConfigId: data.modelConfigId,
      });

      await this.auditLog.logAction({
        actorId: 0, // System action
        action: 'ai.seo.optimized',
        resource: 'Article',
        payload: { articleId: data.articleId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to optimize SEO:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
