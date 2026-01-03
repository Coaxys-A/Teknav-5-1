import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma, Role } from '@prisma/client';
import { WorkflowService } from '../workflows/workflow.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly workflows: WorkflowService) {}

  async create(data: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    affiliateUrl?: string;
    imageUrl?: string;
    merchantName?: string;
    category?: string;
    rating?: number;
    metadata?: Record<string, unknown>;
  }, actorId?: number, workspaceId?: number | null, tenantId?: number | null) {
    const slugBase = data.name.toLowerCase().replace(/[^\w\u0600-\u06ff]+/g, '-').slice(0, 80);
    const slug = await this.ensureUniqueSlug(slugBase);
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency ?? 'IRR',
        affiliateUrl: data.affiliateUrl,
        imageUrl: data.imageUrl,
        merchantName: data.merchantName,
        category: data.category,
        rating: data.rating,
        metadata: data.metadata as Prisma.InputJsonValue,
        slug,
        workspaceId: workspaceId ?? null,
        tenantId: tenantId ?? null,
      },
    });
    await this.audit.log('product.create', actorId, { productId: product.id });
    return product;
  }

  async update(id: number, data: Partial<Prisma.ProductUpdateInput>, actor: { id: number; role: Role }) {
    if (actor.role !== Role.ADMIN && actor.role !== Role.OWNER) throw new UnauthorizedException();
    return this.prisma.product.update({ where: { id }, data });
  }

  async list(workspaceId?: number | null, tenantId?: number | null) {
    return this.prisma.product.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
    return product;
  }

  async byArticle(articleId: number) {
    return this.prisma.articleProduct.findMany({
      where: { articleId },
      include: { product: true },
    });
  }

  async linkToArticle(articleId: number, productId: number, actor: { id: number; role: Role }) {
    if (actor.role === Role.GUEST || actor.role === Role.USER) throw new UnauthorizedException();
    await this.prisma.articleProduct.upsert({
      where: { articleId_productId: { articleId, productId } },
      update: {},
      create: { articleId, productId },
    });
    await this.audit.log('article.product.link', actor.id, { articleId, productId });
    return { ok: true };
  }

  async recordClick(articleId: number, productId: number, userId?: number, source?: string) {
    await this.prisma.clickEvent.create({
      data: {
        articleId,
        productId,
        userId: userId ?? null,
        source,
      },
    });
    await this.workflows.start('product.clicked', { articleId, productId, userId, source });
  }

  private async ensureUniqueSlug(base: string) {
    let slug = base;
    let i = 1;
    while (true) {
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (!existing) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
