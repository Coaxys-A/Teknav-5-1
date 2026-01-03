import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async recordUsage(params: {
    userId?: number;
    actorUserId?: number;
    usageType: string;
    units: number;
    productId?: number;
    subscriptionId?: number;
    tenantId?: number | null;
    workspaceId?: number | null;
    metadata?: any;
  }) {
    return this.prisma.dataAccessLog.create({
      data: {
        userId: params.userId ?? null,
        actorUserId: params.actorUserId ?? null,
        action: 'metered_usage',
        targetType: params.usageType,
        targetId: params.productId ?? params.subscriptionId ?? null,
        metadata: {
          units: params.units,
          productId: params.productId ?? null,
          subscriptionId: params.subscriptionId ?? null,
          tenantId: params.tenantId ?? null,
          workspaceId: params.workspaceId ?? null,
          ...(params.metadata ?? {}),
        },
      },
    });
  }

  async listUsage(params: { userId?: number; usageType?: string; limit?: number }) {
    return this.prisma.dataAccessLog.findMany({
      where: {
        action: 'metered_usage',
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.usageType ? { targetType: params.usageType } : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: params.limit ?? 100,
    });
  }

  async usageSummary(params: { userId?: number; usageType?: string }) {
    const logs = await this.listUsage(params);
    const totalUnits = logs.reduce((acc, log) => acc + (Number((log.metadata as any)?.units ?? 0) || 0), 0);
    return { totalUnits, count: logs.length };
  }
}
