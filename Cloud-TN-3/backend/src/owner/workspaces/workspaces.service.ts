import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list(page: number = 1, limit: number = 10, tenantId?: number) {
    const cacheKey = this.cache.buildVersionedKey('owner:workspaces:list');
    const skip = (page - 1) * limit;

    return await this.cache.cacheWrap(
      cacheKey,
      30, // 30s TTL
      async () => {
        const [workspaces, total] = await Promise.all([
          this.prisma.workspace.findMany({
            where: tenantId ? { tenantId } : undefined,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.workspace.count({ where: tenantId ? { tenantId } : undefined }),
        ]);
        return { data: workspaces, meta: { total, page, limit } };
      },
    );
  }

  async view(id: number) {
    const cacheKey = this.cache.buildVersionedKey(`owner:workspace:${id}`);
    const result = await this.cache.cacheGetJson(cacheKey);

    if (result) {
      return { data: result, meta: { cached: true, cacheKey } };
    }

    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    await this.cache.cacheSetJson(cacheKey, workspace, 60); // 60s TTL for view
    return { data: workspace, meta: { cached: false, cacheKey } };
  }

  async create(dto: { name: string; slug: string; tenantId: number }) {
    const existing = await this.prisma.workspace.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug already exists');

    const workspace = await this.prisma.workspace.create({
      data: dto,
    });

    await this.invalidate();
    return { data: workspace };
  }

  async update(id: number, dto: Partial<{ name: string; slug: string; description: string; plan: string }>) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (dto.slug && dto.slug !== workspace.slug) {
      const existing = await this.prisma.workspace.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug already exists');
    }

    const updated = await this.prisma.workspace.update({
      where: { id },
      data: dto,
    });

    await this.invalidate();
    return { data: updated };
  }

  async delete(id: number) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    await this.prisma.workspace.delete({ where: { id } });
    await this.invalidate();
    return { data: { id, deleted: true } };
  }

  private async invalidate() {
    await this.cache.invalidateDomain('workspaces');
  }
}
