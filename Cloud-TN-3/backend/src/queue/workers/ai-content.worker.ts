import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from '../../../ai/ai.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * AI Content Worker
 */

@Injectable()
export class AiContentWorker {
  private readonly logger = new Logger(AiContentWorker.name);

  constructor(
    private readonly aiService: AiService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('generate-draft')
  async handleGenerateDraft(job: Job) {
    this.logger.debug(`Processing AI content job: ${job.id}`);
    const data = job.data;

    try {
      const result = await this.aiService.generateContent({
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        articleId: data.articleId,
        promptTemplateKey: data.promptTemplateKey,
        modelConfigId: data.modelConfigId,
      });

      await this.auditLog.logAction({
        actorId: data.createdByUserId,
        action: 'ai.content.generated',
        resource: 'AiTask',
        payload: { articleId: data.articleId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to generate content:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
