import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OtpService } from '../../../auth/otp.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * OTP Send Worker
 */

@Injectable()
export class OtpSendWorker {
  private readonly logger = new Logger(OtpSendWorker.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('send-otp')
  async handleSendOtp(job: Job) {
    this.logger.debug(`Processing OTP send job: ${job.id}`);
    const data = job.data;

    try {
      const result = await this.otpService.sendOtp({
        otpCodeId: data.otpCodeId,
      });

      await this.auditLog.logAction({
        actorId: 0,
        action: 'otp.sent',
        resource: 'OtpCode',
        payload: { otpCodeId: data.otpCodeId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return result;
    } catch (error: any) {
      this.logger.error('Failed to send OTP:', error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
