import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      affiliateUrl?: string;
      imageUrl?: string;
      merchantName?: string;
      category?: string;
      rating?: number;
      metadata?: Record<string, unknown>;
    },
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.products.create(
      body,
      user?.id,
      req.workspaceId ?? null,
      req.tenantId ?? null,
    );
  }

  @Get()
  async list(@Req() req: any) {
    return this.products.list(req.workspaceId ?? null, req.tenantId ?? null);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.products.get(id);
  }

  @Post(':id/link-article/:articleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.EDITOR)
  async link(@Param('id', ParseIntPipe) id: number, @Param('articleId', ParseIntPipe) articleId: number, @CurrentUser() user: any) {
    return this.products.linkToArticle(articleId, id, user);
  }

  @Get(':id/click')
  async click(
    @Param('id', ParseIntPipe) id: number,
    @Query('articleId') articleId: string | undefined,
    @Query('source') source: string | undefined,
    @Res() res: Response,
  ) {
    const product = await this.products.get(id);
    await this.products.recordClick(articleId ? Number(articleId) : product.id, id, undefined, source);
    res.redirect(product.affiliateUrl ?? product.imageUrl ?? '/');
  }

  @Get('article/:articleId')
  async byArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.products.byArticle(articleId);
  }
}
