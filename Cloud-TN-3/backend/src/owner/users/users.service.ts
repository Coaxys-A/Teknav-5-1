import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { search, role, status, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { equals: role };
    }

    if (status) {
      where.status = { equals: status };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, count: total, page, pageSize };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        workspaces: true,
        roles: true,
        sessions: {
          where: { revokedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { data: user };
  }

  async updateRole(id: number, role: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    return { data: user };
  }

  async ban(id: number, ip: string, reason: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: 'BANNED' },
    });

    return { data: user };
  }

  async unban(id: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return { data: user };
  }

  async resetPassword(id: number) {
    // Set flag in metadata if available
    // For now, set random temp password
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: 'temp_reset_hash', // In production, use proper hash
        updatedAt: new Date(),
      },
    });

    return { data: user };
  }

  async getAuditLogs(userId: number, params: {
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const logs = await this.prisma.auditLog.findMany({
      where: { actorId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    return { data: logs, page, pageSize };
  }

  async getSessions(userId: number, params: {
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const sessions = await this.prisma.session.findMany({
      where: { 
        userId,
        revokedAt: null,
        OR: [
          { expiresAt: { gte: new Date() } },
          { expiresAt: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    return { data: sessions, page, pageSize };
  }
}
  }
}
