import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

@Controller('store/usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  record(
    @Body() body: { usageType: string; units: number; productId?: number; subscriptionId?: number; metadata?: any },
    @Req() req: Request,
  ) {
    return this.usage.recordUsage({
      usageType: body.usageType,
      units: Number(body.units),
      productId: body.productId,
      subscriptionId: body.subscriptionId,
      userId: (req as any).user?.id,
      actorUserId: (req as any).user?.id,
      tenantId: (req as any).tenantId ?? null,
      workspaceId: (req as any).workspaceId ?? null,
      metadata: body.metadata,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  list(@Query('userId') userId?: number, @Query('usageType') usageType?: string) {
    return this.usage.listUsage({ userId: userId ? Number(userId) : undefined, usageType });
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  summary(@Query('userId') userId?: number, @Query('usageType') usageType?: string) {
    return this.usage.usageSummary({ userId: userId ? Number(userId) : undefined, usageType });
  }
}
