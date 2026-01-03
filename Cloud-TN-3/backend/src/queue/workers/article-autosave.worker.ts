import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * Article Autosave Worker
 */

@Injectable()
export class ArticleAutosaveWorker {
  private readonly logger = new Logger(ArticleAutosaveWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('autosave')
  async handleAutosave(job: Job) {
    this.logger.debug(`Processing article autosave job: ${job.id}`);
    const data = job.data;

    try {
      const updated = await this.prisma.article.update({
        where: { id: data.articleId },
        data: {
          content: data.content,
          meta: data.meta || {},
          updatedAt: new Date(),
        },
      });

      await this.auditLog.logAction({
        actorId: data.userId || 0,
        action: 'article.autosaved',
        resource: 'Article',
        payload: { articleId: data.articleId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return updated;
    } catch (error: any) {
      this.logger.error(`Failed to autosave article:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
