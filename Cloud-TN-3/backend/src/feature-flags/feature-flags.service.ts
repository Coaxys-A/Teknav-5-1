import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (this.prisma as any).featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async resolve(key: string, context?: { role?: Role; country?: string }) {
    const flag = await (this.prisma as any).featureFlag.findUnique({ where: { key } });
    if (!flag || !flag.isActive) return flag?.defaultVariant ?? null;
    const rules = (flag.targetingRules as any) ?? [];
    for (const r of rules) {
      if (r.role && context?.role && r.role === context.role) return r.variant ?? flag.defaultVariant;
      if (r.country && context?.country && r.country === context.country) return r.variant ?? flag.defaultVariant;
    }
    return flag.defaultVariant;
  }

  async setFlag(data: {
    key: string;
    description?: string;
    type: string;
    variants: any[];
    defaultVariant: string;
    targetingRules?: any[];
    isActive?: boolean;
  }) {
    return (this.prisma as any).featureFlag.upsert({
      where: { key: data.key },
      update: {
        description: data.description,
        type: data.type,
        variants: data.variants as Prisma.InputJsonValue,
        defaultVariant: data.defaultVariant,
        targetingRules: data.targetingRules as Prisma.InputJsonValue,
        isActive: data.isActive ?? true,
      },
      create: {
        key: data.key,
        description: data.description,
        type: data.type,
        variants: data.variants as Prisma.InputJsonValue,
        defaultVariant: data.defaultVariant,
        targetingRules: data.targetingRules as Prisma.InputJsonValue,
        isActive: data.isActive ?? true,
      },
    });
  }
}
