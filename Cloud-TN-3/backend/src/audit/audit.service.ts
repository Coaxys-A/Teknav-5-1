import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, actorId?: number, payload?: Prisma.JsonValue, resource?: string, ip?: string, ua?: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          resource,
          payload,
          actorId,
          ip,
          ua,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to persist audit log for action ${action}`, error as Error);
    }
  }

  async list(action?: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: action ? { action } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: true },
    });
  }
}
