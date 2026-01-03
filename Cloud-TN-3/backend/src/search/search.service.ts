import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async search(params: {
    q: string;
    locale: string;
    page: number;
    pageSize: number;
  }) {
    const { q, locale, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const results = await this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        localeCode: locale,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
          { tags: { path: '$', string_contains: q } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: pageSize,
      skip,
    });

    const total = await this.prisma.article.count({
      where: {
        status: 'PUBLISHED',
        localeCode: locale,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
          { tags: { path: '$', string_contains: q } },
        ],
      },
    });

    return {
      data: results,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async indexDocument(params: {
    articleId: number;
    locales: string[];
  }) {
    const { articleId, locales } = params;

    this.logger.debug(`Updating search index for article ${articleId} for locales ${locales.join(', ')}`);

    await this.cacheInvalidation.invalidateArticleCaches(articleId);

    if (this.prisma.searchDocument) {
      for (const locale of locales) {
        const article = await this.prisma.article.findFirst({
          where: { id: articleId, localeCode: locale },
        });

        if (article) {
          const title = article.title || '';
          const body = article.body || '';
          const excerpt = article.excerpt || '';
          const tags = (article.tags as any) || {};
          const categories = (article.meta as any)?.categories || [];

          const vector = title + ' ' + body + ' ' + excerpt + ' ' + categories.join(' ');

          try {
            await this.prisma.searchDocument.upsert({
              where: { articleId, localeCode: locale },
              update: {
                title,
                body,
                excerpt,
                tags,
                categories,
                vector,
                updatedAt: new Date(),
              },
              create: {
                articleId,
                localeCode,
                title,
                body,
                excerpt,
                tags,
                categories,
                vector,
                createdAt: new Date(),
              },
            });

            this.logger.debug(`Upserted SearchDocument for article ${articleId} locale ${locale}`);
          } catch (error: any) {
            this.logger.error(`Failed to upsert SearchDocument for article ${articleId}:`, error);
          }
        }
      }
    } else {
      this.logger.warn(`SearchDocument model not found. Skipping indexing.`);
    }
  }
}
