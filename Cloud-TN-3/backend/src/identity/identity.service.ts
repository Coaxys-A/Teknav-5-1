import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async resolveIdentity(userId: number, tenantId?: number | null) {
    const existing = await this.prisma.identityNode.findFirst({
      where: {
        userId,
        OR: [{ tenantId: tenantId ?? null }, { tenantId: null }],
      },
      include: { personas: true, trustScores: true },
    });
    if (existing) return existing;
    return this.prisma.identityNode.create({
      data: {
        userId,
        tenantId: tenantId ?? null,
        tag: 'reader',
      },
    });
  }

  async linkPersona(identityId: number, label: string, tenantId?: number | null, tag?: string) {
    const persona = await this.prisma.personaProfile.create({
      data: {
        identityId,
        label,
      },
    });
    await this.prisma.personaLink.create({
      data: {
        personaId: persona.id,
        tenantId: tenantId ?? null,
        tag: tag ?? null,
      },
    });
    return persona;
  }

  async addEdge(fromId: number, toId: number, relation: string, weight = 0.1, context?: Record<string, any>) {
    const existing = await this.prisma.identityEdge.findFirst({ where: { fromId, toId } });
    if (existing) {
      return this.prisma.identityEdge.update({
        where: { id: existing.id },
        data: { weight: existing.weight + weight, context: context as Prisma.InputJsonValue },
      });
    }
    return this.prisma.identityEdge.create({
      data: {
        fromId,
        toId,
        relation,
        weight,
        context: context as Prisma.InputJsonValue,
      },
    });
  }

  async updateTrust(identityId: number, delta: number, reason?: string) {
    await this.prisma.identityTrustScore.create({
      data: { identityId, score: delta, reason: reason ?? null },
    });
    await this.redis.set(`trust:${identityId}`, { delta, reason, at: Date.now() }, 3600);
    return { ok: true };
  }

  async reputationSignal(identityId: number, signal: string, weight = 0.1) {
    return this.prisma.identityReputationSignal.create({
      data: { identityId, signal, weight },
    });
  }

  async getGraph(identityId: number) {
    const node = await this.prisma.identityNode.findUnique({
      where: { id: identityId },
      include: {
        edgesFrom: true,
        edgesTo: true,
        personas: true,
        trustScores: true,
      },
    });
    return node;
  }
}
