import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdCreative, AdCampaign, AdSlot, Prisma } from '@prisma/client';

type ContextTarget = {
  device?: string;
  lang?: string;
  tags?: string[];
};

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async findSlot(key: string): Promise<AdSlot | null> {
    return this.prisma.adSlot.findUnique({ where: { key } });
  }

  private isCampaignActive(c: AdCampaign, now: Date) {
    if (c.status !== 'active') return false;
    if (c.startAt && c.startAt > now) return false;
    if (c.endAt && c.endAt < now) return false;
    if (c.budgetSpent >= c.budgetTotal) return false;
    return true;
  }

  private matchesTargeting(targeting: Prisma.JsonValue | null, ctx: ContextTarget) {
    if (!targeting || typeof targeting !== 'object') return true;
    const t = targeting as Record<string, any>;
    if (t.device && ctx.device && t.device !== ctx.device) return false;
    if (t.lang && ctx.lang && t.lang !== ctx.lang) return false;
    if (t.tags && Array.isArray(t.tags) && ctx.tags?.length) {
      const overlap = ctx.tags.some((tag) => t.tags.includes(tag));
      if (!overlap) return false;
    }
    return true;
  }

  private computeScore(campaign: AdCampaign, creative: AdCreative, slot: AdSlot, ctx: ContextTarget) {
    // basic dynamic pricing: start with priority, add floor match, add small bonus for tag match
    let score = campaign.priority || 1;
    const floor = campaign.cpmFloor ?? slot.floorPrice ?? 0;
    score += floor / 10;
    if (campaign.targeting && ctx.tags?.length) {
      const t = campaign.targeting as any;
      if (Array.isArray(t?.tags)) {
        const overlap = ctx.tags.filter((tag) => t.tags.includes(tag)).length;
        score += overlap * 0.5;
      }
    }
    return score;
  }

  async serve(slotKey: string, ctx: ContextTarget) {
    const slot = await this.findSlot(slotKey);
    if (!slot || !slot.isActive) return null;
    const now = new Date();
    const creatives = await this.prisma.adCreative.findMany({
      where: { slotKey, status: 'active', campaign: { status: 'active' } },
      include: { campaign: true },
    });
    const candidates = creatives
      .filter((c) => this.isCampaignActive(c.campaign as any, now))
      .filter((c) => this.matchesTargeting((c.campaign as any).targeting as Prisma.JsonValue, ctx));
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const sa = this.computeScore(a.campaign as any, a, slot, ctx);
      const sb = this.computeScore(b.campaign as any, b, slot, ctx);
      return sb - sa;
    });
    const winner = candidates[0];
    // basic budget pacing
    await this.prisma.adCampaign.update({
      where: { id: (winner.campaign as any).id },
      data: { budgetSpent: { increment: 0.01 } },
    });
    return {
      slotKey,
      creativeId: winner.id,
      markup: winner.markup,
      imageUrl: winner.imageUrl,
      clickUrl: winner.clickUrl,
      trackingPixels: winner.trackingPixels,
      campaignId: (winner.campaign as any).id,
    };
  }
}
