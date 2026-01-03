import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService, private readonly queue: QueueService) {}

  async createEndpoint(workspaceId: number, data: { url: string; secret?: string; events?: string[] }) {
    return (this.prisma as any).webhookEndpoint.create({
      data: {
        workspaceId,
        url: data.url,
        secret: data.secret ?? crypto.randomBytes(16).toString('hex'),
        events: data.events ?? [],
      },
    });
  }

  async listEndpoints(workspaceId: number) {
    return (this.prisma as any).webhookEndpoint.findMany({ where: { workspaceId } });
  }

  async dispatch(workspaceId: number, event: string, payload: any) {
    const endpoints = await (this.prisma as any).webhookEndpoint.findMany({ where: { workspaceId, status: 'active', events: { array_contains: event } as any } });
    for (const ep of endpoints) {
      await this.queue.enqueue({
        type: 'webhook.dispatch',
        payload: { url: ep.url, secret: ep.secret, event, data: payload, endpointId: ep.id },
      });
    }
  }
}
