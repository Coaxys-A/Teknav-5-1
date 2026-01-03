import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { RecommendationService } from '../recommendation/recommendation.service';

@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(private readonly prisma: PrismaService, private readonly rec: RecommendationService) {}

  @Get('articles')
  async listArticles(@Query('page') page?: string, @Query('limit') limit?: string, @Query('tag') tag?: string) {
    const take = Number(limit) || 10;
    const skip = ((Number(page) || 1) - 1) * take;
    return this.prisma.article.findMany({
      where: {
        status: 'PUBLISH',
        ...(tag ? { tags: { array_contains: tag } as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: { id: true, title: true, slug: true, excerpt: true, metaDescription: true, createdAt: true },
    });
  }

  @Get('articles/:id')
  async article(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get('categories')
  async categories() {
    return this.prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  }

  @Get('tags')
  async tags() {
    return this.prisma.tag.findMany({ select: { id: true, name: true, slug: true } });
  }

  @Get('recommended/:id')
  async recommended(@Param('id', ParseIntPipe) id: number) {
    return this.rec.relatedArticles(id, 5);
  }
}
