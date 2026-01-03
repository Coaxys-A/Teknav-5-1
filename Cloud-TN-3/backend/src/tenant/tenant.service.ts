import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveTenant(host?: string, slugOrId?: string | null) {
    if (slugOrId) {
      const parsedId = Number(slugOrId);
      const tenant =
        Number.isNaN(parsedId) || `${parsedId}` !== slugOrId
          ? await (this.prisma as any).tenant.findUnique({ where: { slug: slugOrId } })
          : await (this.prisma as any).tenant.findUnique({ where: { id: parsedId } });
      return tenant ?? null;
    }

    if (!host) return null;

    const direct = await (this.prisma as any).tenant.findFirst({
      where: {
        OR: [{ primaryDomain: host }, { extraDomains: { array_contains: host } }],
      },
    });
    if (direct) return direct;

    const subdomain = host.split('.')[0];
    const bySlug = await (this.prisma as any).tenant.findUnique({ where: { slug: subdomain } });
    return bySlug ?? null;
  }

  async getTenantByIdOrSlug(idOrSlug: number | string) {
    const tenant =
      typeof idOrSlug === 'number'
        ? await (this.prisma as any).tenant.findUnique({ where: { id: idOrSlug } })
        : await (this.prisma as any).tenant.findUnique({ where: { slug: idOrSlug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
