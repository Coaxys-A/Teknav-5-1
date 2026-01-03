import { Controller, Get, Post, Put, Param, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';

@Controller('owner/articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return await this.service.list(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async view(@Param('id') id: string) {
    return await this.service.view(parseInt(id));
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; reviewStatus?: string; reviewNotes?: string },
  ) {
    return await this.service.updateStatus(parseInt(id), dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async forcePublish(@Param('id') id: string) {
    return await this.service.forcePublish(parseInt(id));
  }

  @Post(':id/revert')
  @HttpCode(HttpStatus.OK)
  async revertVersion(@Param('id') id: string) {
    return await this.service.revertVersion(parseInt(id));
  }
}
