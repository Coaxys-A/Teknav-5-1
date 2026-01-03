import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EmailService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private render(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const val = context[key.trim()];
      return val === undefined ? '' : String(val);
    });
  }

  async sendTemplate(to: string, templateKey: string, context: Record<string, any>, userId?: number) {
    const tpl = await (this.prisma as any).emailTemplate.findUnique({ where: { key: templateKey } });
    if (!tpl) throw new NotFoundException('EMAIL_TEMPLATE_NOT_FOUND');
    const subject = this.render(tpl.subjectTemplate, context);
    const html = tpl.bodyHtmlTemplate ? this.render(tpl.bodyHtmlTemplate, context) : undefined;
    const text = tpl.bodyTextTemplate ? this.render(tpl.bodyTextTemplate, context) : html ?? subject;

    const log = await (this.prisma as any).emailLog.create({
      data: {
        userId: userId ?? null,
        email: to,
        templateKey,
        context,
        status: 'pending',
      },
    });

    try {
      // fake provider: console log
      // eslint-disable-next-line no-console
      console.log(`[Email:${templateKey}] to=${to} subject=${subject}`);
      await (this.prisma as any).emailLog.update({
        where: { id: log.id },
        data: { status: 'sent', sentAt: new Date() },
      });
      await this.audit.log('email.send', userId, { to, templateKey });
      return { ok: true };
    } catch (error) {
      await (this.prisma as any).emailLog.update({
        where: { id: log.id },
        data: { status: 'failed', errorMessage: (error as Error).message },
      });
      throw error;
    }
  }

  async upsertPreference(userId: number, frequency: string, categories?: string[]) {
    return (this.prisma as any).emailPreference.upsert({
      where: { userId },
      update: { frequency, categories: categories as any },
      create: { userId, frequency, categories: categories as any },
    });
  }

  async getPreference(userId: number) {
    return (this.prisma as any).emailPreference.findUnique({ where: { userId } });
  }
}
