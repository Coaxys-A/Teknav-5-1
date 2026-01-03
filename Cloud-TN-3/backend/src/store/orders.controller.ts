import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('store/orders')
export class OrdersController {
  constructor(private readonly storeService: StoreService, private readonly billing: BillingService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  list(@Req() req: Request) {
    return this.storeService.listOrders((req as any).workspaceId ?? null, (req as any).tenantId ?? null);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  get(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.getOrder(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() body: { userId?: number; productId: number; amount?: number; status?: string },
    @Req() req: Request,
  ) {
    return this.storeService.createOrder(
      body.userId,
      body.productId,
      (req as any).tenantId ?? null,
      (req as any).workspaceId ?? null,
      body.amount,
      body.status,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.storeService.updateOrderStatus(id, status);
  }

  @Patch(':id/meta')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  updateMeta(@Param('id', ParseIntPipe) id: number, @Body('meta') meta: any) {
    return this.storeService.updateOrderMeta(id, meta);
  }

  @Post(':id/invoice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  invoice(@Param('id', ParseIntPipe) id: number, @Body() body: { amount: number; currency: string; meta?: any }) {
    return this.billing.recordInvoice(id, body.amount, body.currency, body.meta);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  refund(@Param('id', ParseIntPipe) id: number, @Body() body: { reason?: string }) {
    return this.billing.refundOrder(id, body.reason);
  }
}
