import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async hasAccess(userId: number | undefined, entitlementType: string, subjectId?: number, tenantId?: number | null) {
    if (!userId) return false;
    const ent = await (this.prisma as any).entitlement.findFirst({
      where: {
        userId,
        entitlementType,
        ...(tenantId ? { tenantId } : {}),
        ...(subjectId ? { subjectId } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return Boolean(ent);
  }

  async grantFromSubscription(params: { userId: number; subscriptionId: number; productId?: number; entitlementType: string; subjectId?: number; tenantId?: number | null; expiresAt?: Date | null }) {
    return (this.prisma as any).entitlement.create({
      data: {
        userId: params.userId,
        subscriptionId: params.subscriptionId,
        productId: params.productId ?? null,
        entitlementType: params.entitlementType,
        subjectId: params.subjectId ?? null,
        tenantId: params.tenantId ?? null,
        expiresAt: params.expiresAt ?? null,
        source: 'subscription',
      },
    });
  }

  async listForUser(userId: number, tenantId?: number | null) {
    return (this.prisma as any).entitlement.findMany({
      where: {
        userId,
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
