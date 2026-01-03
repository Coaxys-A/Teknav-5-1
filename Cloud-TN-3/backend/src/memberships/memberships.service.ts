import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlan(workspaceId: number, data: { name: string; slug: string; price: number; billingCycle?: string; currency?: string; benefits?: any }) {
    return (this.prisma as any).membershipPlan.create({
      data: {
        workspaceId,
        name: data.name,
        slug: data.slug,
        price: data.price,
        billingCycle: data.billingCycle ?? 'monthly',
        currency: data.currency ?? 'IRR',
        benefits: data.benefits ?? {},
      },
    });
  }

  async listPlans(workspaceId: number) {
    return (this.prisma as any).membershipPlan.findMany({ where: { workspaceId } });
  }

  async listMembers(workspaceId: number) {
    return (this.prisma as any).membership.findMany({ where: { workspaceId }, include: { user: true, plan: true } });
  }
}
