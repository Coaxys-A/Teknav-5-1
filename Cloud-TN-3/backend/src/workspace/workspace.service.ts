import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveWorkspace(host?: string, headerId?: string, tenantId?: number | null): Promise<number | null> {
    if (headerId) {
      const ws = await (this.prisma as any).workspace.findUnique({
        where: { id: Number(headerId) },
        select: { id: true, tenantId: true },
      });
      if (!ws) return null;
      if (tenantId && ws.tenantId && ws.tenantId !== tenantId) return null;
      return ws.id;
    }
    if (!host) return null;
    const slug = host.split('.')[0];
    const ws = await (this.prisma as any).workspace.findUnique({
      where: { slug },
      select: { id: true, tenantId: true },
    });
    if (!ws) return null;
    if (tenantId && ws.tenantId && ws.tenantId !== tenantId) return null;
    return ws.id;
  }

  async assertMember(userId: number | undefined, workspaceId: number | null): Promise<void> {
    if (!workspaceId) return;
    if (!userId) throw new ForbiddenException('Workspace membership required');
    const member = await (this.prisma as any).workspaceMember.findFirst({
      where: { userId, workspaceId, status: 'accepted' },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
  }

  async listWorkspaces(userId: number) {
    return (this.prisma as any).workspaceMember.findMany({
      where: { userId, status: 'accepted' },
      include: { workspace: true },
    });
  }

  async createWorkspace(userId: number, data: { name: string; slug: string; description?: string }) {
    const ws = await (this.prisma as any).workspace.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        members: { create: { userId, role: WorkspaceRole.OWNER, status: 'accepted' } },
      },
    });
    return ws;
  }
}
