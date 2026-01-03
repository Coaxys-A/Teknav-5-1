import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class DistributionService {
  constructor(private readonly prisma: PrismaService, private readonly queue: QueueService) {}

  async registerChannel(data: { type: string; name: string; config?: Record<string, any>; isActive?: boolean }) {
    return (this.prisma as any).distributionChannel.create({
      data: {
        type: data.type,
        name: data.name,
        config: data.config as Prisma.InputJsonValue,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateChannel(id: number, data: Partial<{ type: string; name: string; config: Record<string, any>; isActive: boolean }>) {
    return (this.prisma as any).distributionChannel.update({
      where: { id },
      data: {
        type: data.type,
        name: data.name,
        config: data.config as Prisma.InputJsonValue,
        isActive: data.isActive,
      },
    });
  }

  async listChannels(activeOnly = false) {
    return (this.prisma as any).distributionChannel.findMany({ where: activeOnly ? { isActive: true } : undefined });
  }

  async schedulePost(articleId: number, payload: { title: string; url: string; image?: string }) {
    const channels = await this.listChannels(true);
    for (const ch of channels) {
      await this.queue.enqueue({ type: 'distribution.post', payload: { channel: ch, articleId, ...payload } });
    }
    return { ok: true };
  }
}
