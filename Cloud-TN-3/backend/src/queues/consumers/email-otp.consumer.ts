import { Processor, ProcessError } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Job } from 'bullmq';

/**
 * Email/OTP Jobs Consumer
 * 
 * Queue: email-otp
 * Job Types:
 * - send_email_template
 * - send_otp
 * - process_email_queue
 */

@Injectable()
export class EmailOtpConsumer {
  private readonly logger = new Logger(EmailOtpConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @Processor('send_email_template')
  async handleSendEmailTemplate(job: Job) {
    this.logger.debug(`Processing send_email_template job ${job.id}`);
    
    try {
      const data = job.data;

      // Create EmailQueue row
      const emailQueue = await this.prisma.emailQueue.create({
        data: {
          templateKey: data.templateKey,
          context: data.context || {},
          status: 'sending',
          sentAt: null,
        },
      });

      // Simulate email sending
      // In production, use nodemailer
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update EmailQueue
      await this.prisma.emailQueue.update({
        where: { id: emailQueue.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Create EmailLog
      await this.prisma.emailLog.create({
        data: {
          userId: data.userId,
          email: data.email,
          templateKey: data.templateKey,
          context: data.context,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // If admin-triggered, log to AuditLog
      if (data.isAdminTriggered) {
        await this.prisma.auditLog.create({
          data: {
            actorId: data.actorId,
            action: 'owner.email.send',
            resource: 'Email',
            payload: { emailQueueId: emailQueue.id, email: data.email },
            ip: '127.0.0.1',
            ua: 'unknown',
          },
        });
      }

      return { success: true, sent: true };

    } catch (error: any) {
      this.logger.error(`Failed to send email template:`, error.message);
      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('send_otp')
  async handleSendOtp(job: Job) {
    this.logger.debug(`Processing send_otp job ${job.id}`);
    
    try {
      const data = job.data;

      // Create OtpCode
      const otpCode = await this.prisma.otpCode.create({
        data: {
          userId: data.userId,
          codeHash: 'hashed_code',
          purpose: data.purpose,
          channel: data.channel || 'EMAIL',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
          usedAt: null,
        },
      });

      // Simulate OTP sending
      // In production, use nodemailer
      await new Promise(resolve => setTimeout(resolve, 100));

      return { success: true, sent: true, otpCodeId: otpCode.id };

    } catch (error: any) {
      this.logger.error(`Failed to send OTP:`, error.message);
      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('process_email_queue')
  async handleProcessEmailQueue(job: Job) {
    this.logger.debug(`Processing process_email_queue job ${job.id}`);
    
    // Process pending EmailQueue rows
    const pendingEmails = await this.prisma.emailQueue.findMany({
      where: { status: 'pending' },
      take: 10,
    });

    for (const email of pendingEmails) {
      try {
        // Update status to sending
        await this.prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: 'sending' },
        });

        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update status to sent
        await this.prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: 'sent', sentAt: new Date() },
        });

        // Create EmailLog
        await this.prisma.emailLog.create({
          data: {
            userId: email.userId,
            email: email.email,
            templateKey: email.templateKey,
            context: email.context,
            status: 'sent',
            sentAt: new Date(),
          },
        });

      } catch (error: any) {
        this.logger.error(`Failed to process email ${email.id}:`, error.message);
        await this.prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: 'failed', errorMessage: error.message },
        });
      }
    }

    return { success: true, processed: pendingEmails.length };
  }
}
