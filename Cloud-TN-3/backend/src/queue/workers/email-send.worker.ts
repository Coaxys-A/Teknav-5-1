import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../../../emails/email.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * Email Send Worker
 */

@Injectable()
export class EmailSendWorker {
  private readonly logger = new Logger(EmailSendWorker.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('send-email')
  async handleSendEmail(job: Job) {
    this.logger.debug(`Processing email send job: ${job.id}`);
    const data = job.data;

    try {
      const result = await this.emailService.send({
        emailLogId: data.emailLogId,
      });

      await this.auditLog.logAction({
        actorId: 0,
        action: 'email.sent',
        resource: 'EmailLog',
        payload: { emailLogId: data.emailLogId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return result;
    } catch (error: any) {
      this.logger.error('Failed to send email:', error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
