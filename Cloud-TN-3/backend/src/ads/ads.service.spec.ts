import { AdsService } from './ads.service';

const prisma: any = {
  adSlot: { findUnique: jest.fn() },
  adCreative: { findMany: jest.fn() },
  adCampaign: { update: jest.fn() },
};

describe('AdsService dynamic pricing', () => {
  it('selects highest score campaign', async () => {
    prisma.adSlot.findUnique.mockResolvedValue({ key: 'slot', isActive: true, floorPrice: 1, pricingStrategy: 'floor' });
    prisma.adCreative.findMany.mockResolvedValue([
      {
        id: 1,
        slotKey: 'slot',
        campaign: { id: 10, status: 'active', budgetTotal: 10, budgetSpent: 1, priority: 1, targeting: { tags: ['tech'] } },
        markup: '<div>ad1</div>',
      },
      {
        id: 2,
        slotKey: 'slot',
        campaign: { id: 11, status: 'active', budgetTotal: 10, budgetSpent: 1, priority: 2, targeting: {} },
        markup: '<div>ad2</div>',
      },
    ]);
    prisma.adCampaign.update.mockResolvedValue({});
    const svc = new AdsService(prisma as any);
    const result = await svc.serve('slot', { tags: ['tech'] });
    expect(result?.creativeId).toBe(1); // tag overlap boosts score above priority
  });
});
