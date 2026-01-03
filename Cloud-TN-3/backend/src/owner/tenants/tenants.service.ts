import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const { search, page = 1, pageSize = 20, sort, order = 'desc' } = params;
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { primaryDomain: { contains: search, mode: 'insensitive' } },
            { id: { equals: parseInt(search) || undefined },
          ],
        }
      : {};

    const orderBy: any = sort && order ? { [sort]: order } : { id: 'desc' };

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data: tenants, count: total, page, pageSize };
  }

  async findOne(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { users: true, workspaces: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return { data: tenant };
  }

  async create(data: {
    name: string;
    primaryDomain: string;
    extraDomains?: string[];
    configuration?: any;
  }) {
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        primaryDomain: data.primaryDomain,
        extraDomains: data.extraDomains || [],
        configuration: data.configuration || {},
        status: 'ACTIVE',
        createdAt: new Date(),
      },
    });

    return { data: tenant };
  }

  async update(id: number, data: {
    name?: string;
    primaryDomain?: string;
    extraDomains?: string[];
    configuration?: any;
    status?: string;
  }) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
    });

    return { data: tenant };
  }

  async softDelete(id: number) {
    await this.prisma.tenant.update({
      where: { id },
      data: { status: 'DISABLED' },
    });

    return { data: { id, status: 'DISABLED' } };
  }

  async restore(id: number) {
    await this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return { data: { id, status: 'ACTIVE' } };
  }

  async updateDomains(id: number, data: {
    primaryDomain?: string;
    extraDomains?: string[];
  }) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.primaryDomain && { primaryDomain: data.primaryDomain }),
        ...(data.extraDomains && { extraDomains: data.extraDomains }),
      },
    });

    return { data: tenant };
  }
}
    return { data: tenant };
  }
}
