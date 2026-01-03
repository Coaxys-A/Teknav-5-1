import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MemoryGraphService {
  private readonly logger = new Logger(MemoryGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(params: {
    tenantId?: number | null;
    userId?: number | null;
    type: string;
    payload?: Record<string, any>;
    nodeId?: number | null;
    nodeLabel?: string;
    nodeType?: string;
    relatedNodeId?: number | null;
  }) {
    let nodeId = params.nodeId ?? null;
    if (!nodeId && params.nodeLabel) {
      const node = await this.prisma.memoryNode.create({
        data: {
          tenantId: params.tenantId ?? null,
          label: params.nodeLabel,
          type: params.nodeType ?? 'event',
          payload: (params.payload ?? {}) as Prisma.InputJsonValue,
        },
      });
      nodeId = node.id;
    }

    if (nodeId && params.relatedNodeId) {
      await this.reinforceEdge(nodeId, params.relatedNodeId, 0.05, params.tenantId ?? null);
    }

    return this.prisma.memoryEvent.create({
      data: {
        userId: params.userId ?? null,
        tenantId: params.tenantId ?? null,
        nodeId,
        type: params.type,
        payload: (params.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async reinforceEdge(fromId: number, toId: number, delta = 0.05, tenantId?: number | null) {
    const existing = await this.prisma.memoryEdge.findFirst({
      where: { fromId, toId },
    });
    if (existing) {
      return this.prisma.memoryEdge.update({
        where: { id: existing.id },
        data: { weight: existing.weight + delta, updatedAt: new Date() },
      });
    }
    return this.prisma.memoryEdge.create({
      data: {
        fromId,
        toId,
        weight: delta,
        relation: 'related',
        context: tenantId ? ({ tenantId } as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async upsertEmbedding(nodeId: number, modality: string, vector: any) {
    return this.prisma.memoryEmbedding.create({
      data: {
        nodeId,
        modality,
        vector: vector as Prisma.InputJsonValue,
      },
    });
  }

  async snapshot(nodeId: number, payload?: Record<string, any>, priority?: number) {
    return this.prisma.memorySnapshot.create({
      data: {
        nodeId,
        payload: (payload ?? {}) as Prisma.InputJsonValue,
        priority: priority ?? null,
      },
    });
  }

  async getRecentEvents(tenantId?: number | null, take = 50) {
    return this.prisma.memoryEvent.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
