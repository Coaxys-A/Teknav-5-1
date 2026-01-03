import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ExperimentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, pageSize = 20) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.experiment.findMany({ skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.experiment.count(),
    ]);
    return { rows, total, page, pageSize };
  }

  async detail(id: number) {
    return this.prisma.experiment.findUnique({
      where: { id },
      include: { exposures: true, conversions: true },
    });
  }

  async create(data: any) {
    return this.prisma.experiment.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.experiment.update({ where: { id }, data });
  }

  async recordExposure(experimentId: number, variantKey: string, userId?: number) {
    return this.prisma.experimentExposure.create({ data: { experimentId, variantKey, userId } });
  }

  async recordConversion(experimentId: number, variantKey: string, metric: string, value: number, userId?: number) {
    return this.prisma.experimentConversion.create({ data: { experimentId, variantKey, metric, value, userId } });
  }

  assignVariant(experiment: any, userId?: number, sessionId?: string) {
    const key = `${experiment.id}:${userId ?? sessionId ?? 'anon'}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const value = parseInt(hash.slice(0, 8), 16) / 0xffffffff;
    const allocations = (experiment.trafficAllocation as Record<string, number> | null) ?? {};
    const entries = Object.entries(allocations);
    if (entries.length === 0) return 'control';
    let cumulative = 0;
    for (const [variantKey, allocation] of entries) {
      cumulative += allocation;
      if (value <= cumulative) return variantKey;
    }
    return entries[0][0];
  }
}
