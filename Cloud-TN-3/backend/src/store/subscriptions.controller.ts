import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

@Controller('store/subscriptions')
export class SubscriptionsController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  list(@Req() req: Request) {
    return this.billing.listSubscriptions((req as any).workspaceId ?? null, (req as any).tenantId ?? null);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  get(@Param('id', ParseIntPipe) id: number) {
    return this.billing.getSubscription(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() body: { userId: number; productId: number; status?: string },
    @Req() req: Request,
  ) {
    return this.billing.createSubscription(
      body.userId,
      body.productId,
      (req as any).tenantId ?? null,
      (req as any).workspaceId ?? null,
      body.status ?? 'active',
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.billing.updateSubscriptionStatus(id, status);
  }
}
