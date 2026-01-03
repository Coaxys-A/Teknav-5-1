import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slug.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(name: string, description: string | undefined, actorId?: number) {
    const slug = await this.ensureUniqueSlug(slugify(name));
    const category = await this.prisma.category.create({
      data: { name, slug, description },
    });
    await this.audit.log('category.create', actorId, { categoryId: category.id });
    return category;
  }

  async list() {
    return this.prisma.category.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: number, data: { name?: string; description?: string }, actorId?: number) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('CATEGORY_NOT_FOUND');
    const slug = data.name ? await this.ensureUniqueSlug(slugify(data.name), id) : existing.slug;
    const category = await this.prisma.category.update({
      where: { id },
      data: { ...data, slug },
    });
    await this.audit.log('category.update', actorId, { categoryId: id });
    return category;
  }

  async remove(id: number, actorId?: number) {
    await this.prisma.category.delete({ where: { id } });
    await this.audit.log('category.delete', actorId, { categoryId: id });
    return true;
  }

  private async ensureUniqueSlug(base: string, excludeId?: number) {
    let slug = base;
    let i = 1;
    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: { slug, NOT: excludeId ? { id: excludeId } : undefined },
      });
      if (!existing) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
