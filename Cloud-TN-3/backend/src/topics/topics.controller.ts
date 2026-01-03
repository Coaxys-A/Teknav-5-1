import { Controller, Get, Param, Query } from '@nestjs/common';
import { TopicsService } from './topics.service';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  @Get()
  async list(@Query('workspaceId') workspaceId?: string) {
    return this.topics.list(workspaceId ? Number(workspaceId) : undefined);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string, @Query('workspaceId') workspaceId?: string) {
    const items = await this.topics.articles(Number(workspaceId ?? 0), slug);
    return { slug, articles: items };
  }

  @Get(':slug/related')
  async related(@Param('slug') slug: string, @Query('workspaceId') workspaceId?: string) {
    return this.topics.related(Number(workspaceId ?? 0), slug);
  }
}
