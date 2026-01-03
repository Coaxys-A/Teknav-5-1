import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsProcessor } from './analytics.processor';

describe('AnalyticsService', () => {
  const prisma = {
    analyticsEvent: { groupBy: jest.fn() },
  } as any as PrismaService;
  const processor = { enqueue: jest.fn() } as any as AnalyticsProcessor;

  it('queues log', async () => {
    const svc = new AnalyticsService(prisma, processor);
    await svc.log('view', { path: '/' }, 1);
    expect(processor.enqueue).toHaveBeenCalled();
  });
});
