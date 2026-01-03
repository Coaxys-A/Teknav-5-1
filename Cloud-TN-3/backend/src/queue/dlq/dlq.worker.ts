import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AuditLogService } from '../../../logging/audit-log.service';
import { PolicyContext } from '../../../auth/policy/policy.service';

/**
 * DLQ Worker
 * 
 * Centralized failure handler.
 */

@Injectable()
export class DlqWorker {
  private readonly logger = new Logger(DlqWorker.name);

  constructor(
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('process-dlq')
  async handleProcessDlq(job: Job) {
    this.logger.debug(`Processing DLQ job: ${job.id}`);
    const data = job.data;

    // DLQ jobs are stored permanently
    await this.auditLog.logAction({
      actorId: 0,
      action: 'dlq.job.processed',
      resource: 'DLQJob',
      payload: {
        originalQueue: data.originalQueue,
        originalJobId: data.originalJobId,
        error: data.error,
      },
      ip: '127.0.0.1',
      ua: 'BullMQ Worker',
    });

    return { success: true };
  }
}
