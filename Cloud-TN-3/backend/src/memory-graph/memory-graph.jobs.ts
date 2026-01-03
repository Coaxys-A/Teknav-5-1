import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemoryGraphJobs implements OnModuleInit {
  private readonly logger = new Logger(MemoryGraphJobs.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // ساده: هر ۵ دقیقه وزن یال‌ها را کمی دکاِی می‌کند و نودهای کم‌اولویت را فشرده می‌کند.
    setInterval(() => {
      void this.decayEdges().catch((err) => this.logger.error('edge decay failed', err));
      void this.compactNodes().catch((err) => this.logger.error('compact failed', err));
    }, 5 * 60 * 1000);
  }

  private async decayEdges() {
    await this.prisma.$executeRawUnsafe(`
      UPDATE "MemoryEdge"
      SET weight = GREATEST(weight * 0.98, 0.001), "updatedAt" = now()
      WHERE weight > 0.001
    `);
  }

  private async compactNodes() {
    // نودهای بسیار کم‌اولویت را اسنپ‌شات کرده و حذف می‌کند تا حافظه سبک بماند.
    const lowNodes = await (this.prisma as any).memoryNode.findMany({
      where: { priority: { lte: 0.05 } },
      select: { id: true, payload: true },
      take: 50,
    });
    for (const n of lowNodes) {
      await (this.prisma as any).memorySnapshot.create({
        data: { nodeId: n.id, payload: n.payload ?? {} },
      });
      await (this.prisma as any).memoryNode.delete({ where: { id: n.id } });
    }
  }
}
