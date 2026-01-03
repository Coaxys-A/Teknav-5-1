import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { slugify } from '../common/utils/slug.util';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async createProduct(
    data: {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      productType?: string;
      interval?: string | null;
      tiers?: { label: string; price: number; currency?: string; features?: any }[];
      metadata?: any;
      imageUrl?: string | null;
      category?: string | null;
    },
    actorId?: number,
    workspaceId?: number | null,
    tenantId?: number | null,
  ) {
    const slug = await this.ensureProductSlug(slugify(data.name));
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency ?? 'IRR',
        productType: data.productType ?? 'subscription',
        interval: data.interval ?? null,
        slug,
        workspaceId: workspaceId ?? null,
        tenantId: tenantId ?? null,
        metadata: data.metadata ?? null,
        imageUrl: data.imageUrl ?? null,
        category: data.category ?? null,
        priceTiers: data.tiers
          ? {
              create: data.tiers.map((tier) => ({
                label: tier.label,
                price: tier.price,
                currency: tier.currency ?? data.currency ?? 'IRR',
                features: tier.features ?? null,
              })),
            }
          : undefined,
      },
    });
    await this.audit.log('product.create', actorId, { productId: product.id });
    return product;
  }

  async listProducts(workspaceId?: number | null, tenantId?: number | null) {
    return this.prisma.product.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { priceTiers: true },
    });
  }

  async getProduct(id: number) {
    return this.prisma.product.findUnique({ where: { id }, include: { priceTiers: true } });
  }

  async updateProduct(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      productType?: string;
      interval?: string | null;
      active?: boolean;
      tiers?: { id?: number; label: string; price: number; currency?: string; features?: any }[];
      metadata?: any;
      imageUrl?: string | null;
      category?: string | null;
    },
    actorId?: number,
    workspaceId?: number | null,
    tenantId?: number | null,
  ) {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        workspaceId: workspaceId ?? undefined,
        tenantId: tenantId ?? undefined,
      },
    });
    if (data.tiers) {
      const tierIds = data.tiers.filter((t) => t.id).map((t) => t.id as number);
      await this.prisma.priceTier.deleteMany({ where: { productId: id, id: { notIn: tierIds } } });
      for (const tier of data.tiers) {
        if (tier.id) {
          await this.prisma.priceTier.update({
            where: { id: tier.id },
            data: {
              label: tier.label,
              price: tier.price,
              currency: tier.currency ?? data.currency ?? 'IRR',
              features: tier.features ?? null,
            },
          });
        } else {
          await this.prisma.priceTier.create({
            data: {
              productId: id,
              label: tier.label,
              price: tier.price,
              currency: tier.currency ?? data.currency ?? 'IRR',
              features: tier.features ?? null,
            },
          });
        }
      }
    }
    await this.audit.log('product.update', actorId, { productId: product.id });
    return this.getProduct(id);
  }

  async deactivateProduct(id: number, actorId?: number) {
    const product = await this.prisma.product.update({ where: { id }, data: { active: false } });
    await this.audit.log('product.deactivate', actorId, { productId: product.id });
    return product;
  }

  async createOrder(
    userId: number | undefined,
    productId: number,
    tenantId?: number | null,
    workspaceId?: number | null,
    amountOverride?: number,
    status?: string,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
    const order = await this.prisma.order.create({
      data: {
        userId: userId ?? null,
        productId,
        amount: amountOverride ?? product.price,
        currency: product.currency,
        status: status ?? 'pending',
        tenantId: tenantId ?? null,
        workspaceId: workspaceId ?? null,
      },
    });
    return order;
  }

  async listOrders(workspaceId?: number | null, tenantId?: number | null) {
    return this.prisma.order.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { product: true, user: true },
    });
  }

  async getOrder(id: number) {
    return this.prisma.order.findUnique({ where: { id }, include: { product: true, user: true } });
  }

  async updateOrderStatus(id: number, status: string) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async updateOrderMeta(id: number, meta: any) {
    return this.prisma.order.update({ where: { id }, data: { meta } });
  }

  private async ensureProductSlug(base: string) {
    let slug = base;
    let i = 1;
    while (true) {
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (!existing) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
