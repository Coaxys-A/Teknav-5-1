import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('owner/workspaces')
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return await this.service.list(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      tenantId ? parseInt(tenantId) : undefined
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async view(@Param('id') id: string) {
    return await this.service.view(parseInt(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: { name: string; slug: string; tenantId: number }) {
    return await this.service.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; slug: string; description: string; plan: string }>,
  ) {
    return await this.service.update(parseInt(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return await this.service.delete(parseInt(id));
  }
}
