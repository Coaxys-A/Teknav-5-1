import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, Req } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { Request } from 'express';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService, private readonly billing: BillingService) {}

  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  createProduct(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('price') price: number,
    @Body('currency') currency: string,
    @Body('productType') productType: string,
    @Body('interval') interval: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.storeService.createProduct(
      { name, description, price: Number(price), currency, productType, interval },
      user?.id,
      (req as any).workspaceId ?? null,
      (req as any).tenantId ?? null,
    );
  }

  @Get('products')
  listProducts(@Req() req: Request) {
    return this.storeService.listProducts((req as any).workspaceId ?? null, (req as any).tenantId ?? null);
  }

  @Post('orders/:productId')
  @UseGuards(JwtAuthGuard)
  createOrder(@Param('productId', ParseIntPipe) productId: number, @CurrentUser() user: any, @Req() req: Request) {
    return this.storeService.createOrder(user?.id, productId, (req as any).tenantId ?? null, (req as any).workspaceId ?? null);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  listOrders(@Req() req: Request) {
    return this.storeService.listOrders((req as any).workspaceId ?? null, (req as any).tenantId ?? null);
  }

  @Post('subscriptions/:productId')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Param('productId', ParseIntPipe) productId: number, @CurrentUser() user: any, @Req() req: Request) {
    return this.billing.createSubscription(user.id, productId, (req as any).tenantId ?? null, (req as any).workspaceId ?? null);
  }
}
