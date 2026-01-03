import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('store/entitlements')
export class EntitlementsController {
  constructor(private readonly entitlements: EntitlementService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  list(@Query('userId') userId?: number, @Query('tenantId') tenantId?: number) {
    if (!userId) return [];
    return this.entitlements.listForUser(Number(userId), tenantId ? Number(tenantId) : null);
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  check(
    @Query('userId') userId: number,
    @Query('entitlementType') entitlementType: string,
    @Query('subjectId') subjectId?: number,
    @Query('tenantId') tenantId?: number,
  ) {
    return this.entitlements.hasAccess(
      Number(userId),
      entitlementType,
      subjectId ? Number(subjectId) : undefined,
      tenantId ? Number(tenantId) : null,
    );
  }
}
