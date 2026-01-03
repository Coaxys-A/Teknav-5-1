import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementService } from './entitlement.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService, private readonly entitlements: EntitlementService) {}

  async createSubscription(
    userId: number,
    productId: number,
    tenantId?: number | null,
    workspaceId?: number | null,
    status?: string,
  ) {
    const product = await (this.prisma as any).product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    const sub = await (this.prisma as any).subscription.create({
      data: {
        userId,
        productId,
        status: status ?? 'active',
        workspaceId: workspaceId ?? null,
        tenantId: tenantId ?? null,
      },
    });
    await this.entitlements.grantFromSubscription({
      userId,
      subscriptionId: sub.id,
      productId,
      entitlementType: 'access_article',
      tenantId: tenantId ?? null,
    });
    return sub;
  }

  async updateSubscriptionStatus(id: number, status: string) {
    return (this.prisma as any).subscription.update({ where: { id }, data: { status } });
  }

  async listSubscriptions(workspaceId?: number | null, tenantId?: number | null) {
    return (this.prisma as any).subscription.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscription(id: number) {
    return (this.prisma as any).subscription.findUnique({
      where: { id },
      include: { product: true, user: true },
    });
  }

  async recordBillingEvent(event: string, payload: any, userId?: number | null) {
    return (this.prisma as any).auditLog.create({
      data: {
        action: 'billing.event',
        resource: event,
        payload,
        actorId: userId ?? null,
      },
    });
  }

  async recordInvoice(orderId: number, amount: number, currency: string, meta?: any) {
    await this.recordBillingEvent('invoice.created', { orderId, amount, currency, meta });
    return (this.prisma as any).order.update({
      where: { id: orderId },
      data: { meta: { ...(meta ?? {}), invoiceAmount: amount, invoiceCurrency: currency } },
    });
  }

  async refundOrder(orderId: number, reason?: string) {
    await this.recordBillingEvent('refund.requested', { orderId, reason });
    return (this.prisma as any).order.update({
      where: { id: orderId },
      data: { status: 'refunded', meta: { reason } },
    });
  }
}
