import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataAccessLogService {
  private readonly logger = new Logger(DataAccessLogService.name);
  constructor(private readonly prisma: PrismaService) {}

  async logAccess(params: {
    userId: number;
    actorUserId?: number | null;
    action: string;
    targetType: string;
    targetId: number;
    metadata?: Record<string, any> | null;
  }) {
    // Get IP/UA from request if available
    const ip = params.metadata?.ip || null;
    const ua = params.metadata?.ua || null;

    await this.prisma.dataAccessLog.create({
      data: {
        userId: params.userId,
        actorUserId: params.actorUserId || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  }
}
