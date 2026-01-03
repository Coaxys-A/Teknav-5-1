import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Manifest = {
  name: string;
  version: string;
  entry?: string;
  code?: string;
  wasm?: string;
  permissions?: string[];
  events?: string[];
  sandbox?: { runtime: 'vm2' | 'wasm'; signature?: string };
};

const ALLOWED_EVENTS = ['onArticlePublish', 'onUserSignup', 'onAIResult', 'onSchedule', 'onWebhook'];
const ALLOWED_PERMS = ['articles', 'users', 'ai', 'workflows', 'webhooks', 'store', 'logs', 'analytics', 'plugins'];

@Injectable()
export class PluginsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(slot?: string, tenantId?: number | null) {
    return (this.prisma as any).plugin.findMany({
      where: {
        isEnabled: true,
        visibility: 'public',
        ...(slot ? { slot } : {}),
        OR: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
      },
      orderBy: { createdAt: 'desc' },
      include: { latestVersion: true },
    });
  }

  async adminList(tenantId?: number | null) {
    return (this.prisma as any).plugin.findMany({
      where: {
        OR: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
      },
      orderBy: { createdAt: 'desc' },
      include: { latestVersion: true, installations: true, permissions: true },
    });
  }

  async upsert(data: {
    key: string;
    name: string;
    description?: string;
    slot: string;
    type: string;
    configSchema?: any;
    config?: any;
    isEnabled?: boolean;
    tenantId?: number | null;
    visibility?: string;
    tags?: string[];
    permissions?: { scope: string; workspaceRole?: string | null; permissionType?: string | null }[];
  }) {
    const plugin = await (this.prisma as any).plugin.upsert({
      where: { key: data.key },
      update: {
        name: data.name,
        description: data.description,
        slot: data.slot,
        type: data.type,
        configSchema: data.configSchema,
        config: data.config,
        isEnabled: data.isEnabled ?? true,
        tenantId: data.tenantId ?? null,
        visibility: data.visibility ?? 'private',
        tags: data.tags ?? [],
      },
      create: {
        key: data.key,
        name: data.name,
        description: data.description,
        slot: data.slot,
        type: data.type,
        configSchema: data.configSchema,
        config: data.config,
        isEnabled: data.isEnabled ?? true,
        tenantId: data.tenantId ?? null,
        visibility: data.visibility ?? 'private',
        tags: data.tags ?? [],
      },
    });

    if (data.permissions?.length) {
      await (this.prisma as any).pluginPermission.deleteMany({ where: { pluginId: plugin.id } });
      await (this.prisma as any).pluginPermission.createMany({
        data: data.permissions.map((p) => ({
          pluginId: plugin.id,
          scope: p.scope,
          workspaceRole: p.workspaceRole ?? null,
          permissionType: p.permissionType ?? null,
        })),
      });
    }

    return plugin;
  }

  async toggle(key: string, enabled: boolean) {
    return (this.prisma as any).plugin.update({ where: { key }, data: { isEnabled: enabled } });
  }

  private validateManifest(manifest?: Manifest | null) {
    if (!manifest?.name || !manifest?.version) {
      throw new Error('INVALID_MANIFEST');
    }
    if (manifest.events?.some((e) => !ALLOWED_EVENTS.includes(e))) {
      throw new Error('INVALID_EVENT');
    }
    if (manifest.permissions?.some((p) => !ALLOWED_PERMS.includes(p))) {
      throw new Error('INVALID_PERMISSION');
    }
    if (manifest.sandbox && !['vm2', 'wasm'].includes(manifest.sandbox.runtime)) {
      throw new Error('INVALID_SANDBOX');
    }
    return manifest;
  }

  async publishVersion(key: string, body: { version: string; manifest?: Manifest; changelog?: string; status?: string }) {
    const plugin = await (this.prisma as any).plugin.findUnique({ where: { key } });
    if (!plugin) throw new Error('PLUGIN_NOT_FOUND');
    const manifest = this.validateManifest(body.manifest);
    const version = await (this.prisma as any).pluginVersion.create({
      data: {
        pluginId: plugin.id,
        version: body.version,
        status: body.status ?? 'published',
        changelog: body.changelog ?? null,
        manifest: manifest ?? null,
      },
    });
    await (this.prisma as any).plugin.update({
      where: { id: plugin.id },
      data: { latestVersionId: version.id },
    });
    if (manifest?.permissions?.length) {
      await (this.prisma as any).pluginPermission.createMany({
        data: manifest.permissions.map((scope) => ({
          pluginId: plugin.id,
          scope,
          permissionType: 'manifest',
        })),
        skipDuplicates: true,
      });
    }
    return version;
  }

  async listVersions(key: string) {
    const plugin = await (this.prisma as any).plugin.findUnique({ where: { key } });
    if (!plugin) throw new Error('PLUGIN_NOT_FOUND');
    return (this.prisma as any).pluginVersion.findMany({
      where: { pluginId: plugin.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async install(tenantId: number, pluginKey: string, configuration?: any) {
    const plugin = await (this.prisma as any).plugin.findUnique({ where: { key: pluginKey } });
    if (!plugin) throw new Error('PLUGIN_NOT_FOUND');
    const installation = await (this.prisma as any).pluginInstallation.upsert({
      where: { tenantId_pluginId: { tenantId, pluginId: plugin.id } },
      update: { configuration: configuration ?? null, status: 'active' },
      create: { tenantId, pluginId: plugin.id, configuration: configuration ?? null },
    });
    await (this.prisma as any).pluginSettings.upsert({
      where: { pluginId_tenantId: { pluginId: plugin.id, tenantId } } as any,
      update: { settings: configuration ?? {} },
      create: { pluginId: plugin.id, tenantId, settings: configuration ?? {} },
    });
    return installation;
  }

  async uninstall(tenantId: number, pluginKey: string) {
    const plugin = await (this.prisma as any).plugin.findUnique({ where: { key: pluginKey } });
    if (!plugin) throw new Error('PLUGIN_NOT_FOUND');
    await (this.prisma as any).pluginInstallation.deleteMany({ where: { tenantId, pluginId: plugin.id } });
    await (this.prisma as any).pluginSettings.deleteMany({ where: { tenantId, pluginId: plugin.id } });
    return { ok: true };
  }

  async installed(tenantId: number) {
    return (this.prisma as any).pluginInstallation.findMany({
      where: { tenantId },
      include: { plugin: { include: { latestVersion: true } } },
    });
  }

  async logs(tenantId?: number | null) {
    return (this.prisma as any).pluginExecutionLog.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: 'desc' },
      include: { plugin: true, tenant: true },
      take: 100,
    });
  }

  async marketplace() {
    return (this.prisma as any).plugin.findMany({
      where: { visibility: 'public', isEnabled: true },
      include: { latestVersion: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
