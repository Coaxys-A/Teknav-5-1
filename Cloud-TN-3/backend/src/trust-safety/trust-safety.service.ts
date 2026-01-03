import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrustSafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async report(params: { targetType: string; targetId: number; reason?: string; reporterId?: number | null; tenantId?: number | null; commentId?: number | null }) {
    return (this.prisma as any).abuseReport.create({
      data: {
        targetType: params.targetType,
        targetId: params.targetId,
        reason: params.reason ?? null,
        reporterId: params.reporterId ?? null,
        tenantId: params.tenantId ?? null,
        commentId: params.commentId ?? null,
      },
    });
  }

  async listReports(tenantId?: number | null, status?: string) {
    return (this.prisma as any).abuseReport.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async resolve(reportId: number, status: 'closed' | 'rejected') {
    return (this.prisma as any).abuseReport.update({
      where: { id: reportId },
      data: { status },
    });
  }
}
