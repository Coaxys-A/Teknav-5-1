import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhooks/billing')
export class BillingWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async handle(@Body() body: any, @Headers() headers: Record<string, string>) {
    const payload = {
      headers,
      body,
      receivedAt: new Date().toISOString(),
    };
    await this.prisma.auditLog.create({
      data: {
        action: 'billing_webhook',
        actorId: null,
        resource: 'billing',
        payload: payload as any,
      },
    });
    return { ok: true };
  }
}
