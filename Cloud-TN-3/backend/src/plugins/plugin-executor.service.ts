import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginSandboxService } from './plugin-sandbox.service';
import { PluginRateLimitService } from './rate-limit.service';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class PluginExecutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sandbox: PluginSandboxService,
    private readonly rateLimit: PluginRateLimitService,
    private readonly logging: LoggingService,
  ) {}

  async runPlugin(params: {
    pluginKey: string;
    tenantId?: number | null;
    payload: any;
  }) {
    const plugin = await (this.prisma as any).plugin.findUnique({
      where: { key: params.pluginKey },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!plugin) throw new Error('PLUGIN_NOT_FOUND');

    await this.rateLimit.assertWithinLimit(plugin.key, params.tenantId ?? null);

    const version = plugin.versions?.[0] ?? null;
    const log = await (this.prisma as any).pluginExecutionLog.create({
      data: {
        pluginId: plugin.id,
        tenantId: params.tenantId ?? null,
        status: 'running',
        payload: params.payload ?? {},
        message: `run ${plugin.key}@${version?.version ?? 'latest'}`,
      },
    });

    try {
      const result = await this.sandbox.execute(
        { pluginId: plugin.id, pluginVersion: version, sandbox: version?.manifest?.sandbox },
        params.payload ?? {},
      );
      await (this.prisma as any).pluginExecutionLog.update({
        where: { id: log.id },
        data: {
          status: 'completed',
          result: result?.output ?? result,
          durationMs: result?.durationMs ?? null,
        },
      });
      await this.logging.logPlugin(plugin.id, 'completed', `job:${params.payload?.event ?? 'run'}`);
      return result;
    } catch (err: any) {
      await (this.prisma as any).pluginExecutionLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          message: String(err?.message ?? err),
          errorStack: err?.stack ?? null,
        },
      });
      await this.logging.logPlugin(plugin.id, 'failed', String(err?.message ?? err));
      throw err;
    }
  }
}
