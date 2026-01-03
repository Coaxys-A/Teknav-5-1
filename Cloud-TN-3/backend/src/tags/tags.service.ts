import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slug.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(name: string, actorId?: number) {
    const slug = await this.ensureUniqueSlug(slugify(name));
    const tag = await this.prisma.tag.create({ data: { name, slug } });
    await this.audit.log('tag.create', actorId, { tagId: tag.id });
    return tag;
  }

  async list() {
    return this.prisma.tag.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: number, data: { name?: string }, actorId?: number) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('TAG_NOT_FOUND');
    const slug = data.name ? await this.ensureUniqueSlug(slugify(data.name), id) : existing.slug;
    const tag = await this.prisma.tag.update({
      where: { id },
      data: { ...data, slug },
    });
    await this.audit.log('tag.update', actorId, { tagId: id });
    return tag;
  }

  async remove(id: number, actorId?: number) {
    await this.prisma.tag.delete({ where: { id } });
    await this.audit.log('tag.delete', actorId, { tagId: id });
    return true;
  }

  private async ensureUniqueSlug(base: string, excludeId?: number) {
    let slug = base;
    let i = 1;
    while (true) {
      const existing = await this.prisma.tag.findFirst({
        where: { slug, NOT: excludeId ? { id: excludeId } : undefined },
      });
      if (!existing) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
