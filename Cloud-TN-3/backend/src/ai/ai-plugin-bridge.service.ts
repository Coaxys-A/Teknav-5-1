import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginExecutorService } from '../plugins/plugin-executor.service';

@Injectable()
export class AiPluginBridgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly executor: PluginExecutorService,
  ) {}

  async listBindings(workspaceId?: number) {
    return this.prisma.aiPluginBinding.findMany({
      where: { workspaceId, enabled: true },
      include: {
        aiTool: true,
        plugin: true,
        pluginVersion: true,
      },
    });
  }

  async bindTool(data: {
    workspaceId?: number;
    tenantId?: number;
    pluginId?: number;
    pluginVersionId?: number;
    aiToolId: number;
    config?: any;
  }) {
    return this.prisma.aiPluginBinding.upsert({
      where: {
        // composite surrogate using AI tool and plugin version if provided
        aiToolId_pluginVersionId_pluginId_workspaceId: {
          aiToolId: data.aiToolId,
          pluginVersionId: data.pluginVersionId ?? 0,
          pluginId: data.pluginId ?? 0,
          workspaceId: data.workspaceId ?? 0,
        },
      },
      create: {
        aiToolId: data.aiToolId,
        workspaceId: data.workspaceId,
        tenantId: data.tenantId,
        pluginId: data.pluginId,
        pluginVersionId: data.pluginVersionId,
        config: data.config,
        enabled: true,
      },
      update: {
        config: data.config,
        enabled: true,
        pluginId: data.pluginId,
        pluginVersionId: data.pluginVersionId,
      },
    });
  }

  async disableBinding(id: number) {
    return this.prisma.aiPluginBinding.update({
      where: { id },
      data: { enabled: false },
    });
  }

  async executePluginTool(bindingId: number, payload: any) {
    const binding = await this.prisma.aiPluginBinding.findUnique({
      where: { id: bindingId },
      include: { aiTool: true, plugin: true, pluginVersion: true },
    });
    if (!binding || !binding.enabled) throw new Error('Binding not active');
    return this.executor.runPlugin({
      pluginKey: binding.plugin?.key ?? '',
      tenantId: binding.tenantId ?? null,
      payload,
    });
  }
}
