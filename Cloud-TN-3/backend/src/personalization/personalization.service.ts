import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { MemoryGraphService } from '../memory-graph/memory-graph.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalizationService {
  constructor(
    private readonly redis: RedisService,
    private readonly memory: MemoryGraphService,
    private readonly prisma: PrismaService,
  ) {}

  private prefKey(tenantId: number | null, userId: number) {
    return `rpc:pref:${tenantId ?? 'global'}:${userId}`;
  }

  private stateKey(tenantId: number | null, userId: number) {
    return `rpc:state:${tenantId ?? 'global'}:${userId}`;
  }

  async updatePreferences(userId: number, tenantId: number | null, delta: Record<string, number>) {
    const key = this.prefKey(tenantId, userId);
    const current = (await this.redis.get<Record<string, number>>(key)) ?? {};
    Object.entries(delta).forEach(([k, v]) => {
      current[k] = (current[k] ?? 0) + v;
    });
    await this.redis.set(key, current, 60 * 60);
    await (this.prisma as any).userPreferenceVector.upsert({
      where: { userId_tenantId: { userId, tenantId: tenantId ?? null } },
      update: { vector: current as any },
      create: { userId, tenantId: tenantId ?? null, vector: current as any },
    });
    await this.memory.recordEvent({
      userId,
      tenantId,
      type: 'preference.update',
      payload: current,
    });
    return current;
  }

  async getPreferences(userId: number, tenantId: number | null) {
    return (await this.redis.get<Record<string, number>>(this.prefKey(tenantId, userId))) ?? {};
  }

  async updateRealtimeState(userId: number, tenantId: number | null, state: Record<string, any>) {
    const key = this.stateKey(tenantId, userId);
    await this.redis.set(key, state, 15 * 60);
    await (this.prisma as any).userRealtimeState.upsert({
      where: { userId_tenantId: { userId, tenantId: tenantId ?? null } },
      update: { state: state as any },
      create: { userId, tenantId: tenantId ?? null, state: state as any },
    });
    await this.memory.recordEvent({
      userId,
      tenantId,
      type: 'realtime.state',
      payload: state,
    });
    return state;
  }

  async getRealtimeState(userId: number, tenantId: number | null) {
    return (await this.redis.get<Record<string, any>>(this.stateKey(tenantId, userId))) ?? {};
  }

  async updateFingerprint(userId: number | undefined, tenantId: number | null, hash: string, meta?: Record<string, any>) {
    if (!userId) return;
    await (this.prisma as any).userSessionFingerprint.upsert({
      where: { hash },
      update: { userId, tenantId: tenantId ?? null, meta: meta ?? {}, lastSeenAt: new Date() },
      create: { userId, tenantId: tenantId ?? null, hash, meta: meta ?? {} },
    });
    await this.memory.recordEvent({
      userId,
      tenantId,
      type: 'fingerprint',
      payload: { hash, meta },
    });
  }
}
