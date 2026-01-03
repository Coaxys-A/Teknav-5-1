import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SponsorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSponsor(workspaceId: number, data: { name: string; url?: string; logo?: string; contact?: string; notes?: string }) {
    return (this.prisma as any).sponsor.create({
      data: { workspaceId, name: data.name, url: data.url, logo: data.logo, contact: data.contact, notes: data.notes },
    });
  }

  async listSponsors(workspaceId: number) {
    return (this.prisma as any).sponsor.findMany({ where: { workspaceId } });
  }

  async createCampaign(
    workspaceId: number,
    data: { sponsorId: number; name: string; startDate?: Date; endDate?: Date; budget?: number; pricingModel?: string; targeting?: any },
  ) {
    return (this.prisma as any).campaign.create({
      data: {
        workspaceId,
        sponsorId: data.sponsorId,
        name: data.name,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        budget: data.budget ?? null,
        pricingModel: data.pricingModel ?? 'cpm',
        targeting: data.targeting ?? {},
      },
    });
  }

  async listCampaigns(workspaceId: number) {
    return (this.prisma as any).campaign.findMany({ where: { workspaceId }, include: { sponsor: true } });
  }

  async createPlacement(
    workspaceId: number,
    data: { campaignId: number; placementType: string; position?: string; conditions?: any },
  ) {
    return (this.prisma as any).placement.create({
      data: {
        workspaceId,
        campaignId: data.campaignId,
        placementType: data.placementType,
        position: data.position ?? null,
        conditions: data.conditions ?? {},
      },
    });
  }

  async placements(workspaceId: number) {
    return (this.prisma as any).placement.findMany({ where: { workspaceId }, include: { campaign: true } });
  }
}
