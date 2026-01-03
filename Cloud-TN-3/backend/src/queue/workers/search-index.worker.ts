import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SearchService } from '../../../search/search.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * Search Index Worker
 */

@Injectable()
export class SearchIndexWorker {
  private readonly logger = new Logger(SearchIndexWorker.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('index-article')
  async handleIndexArticle(job: Job) {
    this.logger.debug(`Processing search index job: ${job.id}`);
    const data = job.data;

    try {
      await this.searchService.indexDocument({
        articleId: data.articleId,
        locales: data.locales,
      });

      await this.auditLog.logAction({
        actorId: 0,
        action: 'search.article.indexed',
        resource: 'SearchDocument',
        payload: { articleId: data.articleId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to index article:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
