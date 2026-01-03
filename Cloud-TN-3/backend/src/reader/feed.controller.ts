import { Controller, Get, HttpCode, HttpStatus, Query, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Reader Feed Controller - Personalized Feed for "Reader" role
 * 
 * Simple implementation:
 * - Returns public articles
 * - In production, uses ML inference based on history
 */

@Controller('feed')
export class ReaderFeedController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get personalized feed
   */
  @Get('personalized')
  @HttpCode(HttpStatus.OK)
  async getPersonalizedFeed(@Query() filters: {
    limit?: string;
    category?: string;
  }) {
    const limit = parseInt(filters.limit || '20');
    
    // In production, use user history to feed
    // For now, return top articles
    const articles = await this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
        // Filter by category if provided
        ...(filters.category && {
          category: {
            name: filters.category,
          },
        }),
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });

    return {
      data: articles,
      count: articles.length,
    };
  }

  /**
   * Get next article for infinite scroll (Smart)
   */
  @Get('next/:currentArticleId')
  @HttpCode(HttpStatus.OK)
  async getNextArticle(
    @Param('currentArticleId') currentArticleId: string,
    @Query() filters: {
      limit?: string;
    },
  ) {
    const limit = parseInt(filters.limit || '3');

    const currentArticle = await this.prisma.article.findUnique({
      where: { id: parseInt(currentArticleId) },
      select: { id: true, tags: true, categoryId: true },
    });

    if (!currentArticle) {
      return { data: [] };
    }

    // Find next articles with similar tags/category (Smart Infinite Scroll)
    const articles = await this.prisma.article.findMany({
      where: {
        id: { not: currentArticle.id },
        status: 'PUBLISHED',
        OR: [
          currentArticle.categoryId && {
            categoryId: currentArticle.categoryId,
          },
          // Simple tag match (in production, use ML similarity)
          {
            tags: {
              path: '$',
              string_contains: JSON.stringify(currentArticle.tags || []),
            },
          },
        ],
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });

    return {
      data: articles,
      count: articles.length,
      nextArticleId: articles[0]?.id || null,
    };
  }

  /**
   * Check for fresh content
   */
  @Get('fresh')
  @HttpCode(HttpStatus.OK)
  async getFreshContent() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const articles = await this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: yesterday,
        },
      },
      include: {
        author: true,
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 20,
    });

    return {
      data: articles,
      count: articles.length,
    };
  }
}
