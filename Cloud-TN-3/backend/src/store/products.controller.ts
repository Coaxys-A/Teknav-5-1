import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';

@Controller('store/products')
export class ProductsController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  list(@Req() req: Request) {
    return this.storeService.listProducts((req as any).workspaceId ?? null, (req as any).tenantId ?? null);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  get(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.getProduct(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      productType?: string;
      interval?: string | null;
      tiers?: { label: string; price: number; currency?: string; features?: any }[];
      metadata?: any;
      imageUrl?: string | null;
      category?: string | null;
    },
    @Req() req: Request,
  ) {
    return this.storeService.createProduct(
      body,
      (req as any).user?.id,
      (req as any).workspaceId ?? null,
      (req as any).tenantId ?? null,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      productType?: string;
      interval?: string | null;
      active?: boolean;
      tiers?: { id?: number; label: string; price: number; currency?: string; features?: any }[];
      metadata?: any;
      imageUrl?: string | null;
      category?: string | null;
    },
    @Req() req: Request,
  ) {
    return this.storeService.updateProduct(
      id,
      body,
      (req as any).user?.id,
      (req as any).workspaceId ?? null,
      (req as any).tenantId ?? null,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.storeService.deactivateProduct(id, (req as any).user?.id);
  }
}
