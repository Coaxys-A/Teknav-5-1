import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginExecutorService } from './plugin-executor.service';
import { PluginRateLimitService } from './rate-limit.service';

@Injectable()
export class PluginEventDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly executor: PluginExecutorService,
    private readonly rateLimit: PluginRateLimitService,
  ) {}

  async dispatch(eventKey: string, payload: any, tenantId?: number | null, workspaceId?: number | null) {
    const plugins = await (this.prisma as any).plugin.findMany({
      where: {
        isEnabled: true,
        OR: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
      },
      include: {
        installations: tenantId
          ? { where: { tenantId, status: 'active' } }
          : { where: { status: 'active' } },
        latestVersion: true,
      },
    });
    const candidates = plugins.filter((p: any) => {
      const events = (p.config as any)?.events ?? (p.configSchema as any)?.events ?? [];
      return events.includes(eventKey) || p.slot === eventKey;
    });

    for (const plugin of candidates) {
      await this.rateLimit.assertWithinLimit(plugin.key, tenantId ?? null);
      await this.executor.runPlugin({
        pluginKey: plugin.key,
        tenantId: tenantId ?? null,
        payload: { event: eventKey, payload, workspaceId, tenantId },
      });
    }
    return { dispatched: candidates.length };
  }

  async onArticlePublish(payload: any, tenantId?: number | null, workspaceId?: number | null) {
    return this.dispatch('onArticlePublish', payload, tenantId, workspaceId);
  }

  async onUserSignup(payload: any, tenantId?: number | null, workspaceId?: number | null) {
    return this.dispatch('onUserSignup', payload, tenantId, workspaceId);
  }

  async onAIResult(payload: any, tenantId?: number | null, workspaceId?: number | null) {
    return this.dispatch('onAIResult', payload, tenantId, workspaceId);
  }

  async onSchedule(payload: any, tenantId?: number | null, workspaceId?: number | null) {
    return this.dispatch('onSchedule', payload, tenantId, workspaceId);
  }

  async onWebhook(payload: any, tenantId?: number | null, workspaceId?: number | null) {
    return this.dispatch('onWebhook', payload, tenantId, workspaceId);
  }
}
