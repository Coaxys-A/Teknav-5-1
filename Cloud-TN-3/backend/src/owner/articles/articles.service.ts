import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list(page: number = 1, limit: number = 10, status?: string) {
    const cacheKey = this.cache.buildVersionedKey('owner:articles:list');
    const skip = (page - 1) * limit;
    const where = status ? { status } : undefined;

    return await this.cache.cacheWrap(
      cacheKey,
      30, // 30s TTL
      async () => {
        const [articles, total] = await Promise.all([
          this.prisma.article.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              author: { select: { id: true, name: true, email: true } },
              category: { select: { id: true, name: true } },
              assignedReviewer: { select: { id: true, name: true } },
            },
          }),
          this.prisma.article.count({ where }),
        ]);
        return { data: articles, meta: { total, page, limit } };
      },
    );
  }

  async view(id: number) {
    const cacheKey = this.cache.buildVersionedKey(`owner:article:${id}`);
    const result = await this.cache.cacheGetJson(cacheKey);

    if (result) {
      return { data: result, meta: { cached: true, cacheKey } };
    }

    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!article) throw new NotFoundException('Article not found');

    await this.cache.cacheSetJson(cacheKey, article, 60); // 60s TTL for view
    return { data: article, meta: { cached: false, cacheKey } };
  }

  async updateStatus(id: number, dto: { status: string; reviewStatus?: string; reviewNotes?: string }) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.reviewStatus !== undefined && { reviewStatus: dto.reviewStatus }),
        ...(dto.reviewNotes !== undefined && { reviewNotes: dto.reviewNotes }),
      },
    });

    await this.invalidate();
    return { data: updated };
  }

  async forcePublish(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    const latestVersion = await this.prisma.articleVersion.findFirst({
      where: { articleId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestVersion) {
      throw new BadRequestException('No version found to publish');
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await this.invalidate();
    return { data: updated };
  }

  async revertVersion(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    const previousVersion = await this.prisma.articleVersion.findFirst({
      where: { articleId: id },
      orderBy: { createdAt: 'desc' },
      skip: 1,
    });

    if (!previousVersion) {
      throw new BadRequestException('No previous version found');
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        title: previousVersion.title,
        content: previousVersion.content,
        excerpt: previousVersion.excerpt,
        tags: previousVersion.tags,
        status: previousVersion.status,
      },
    });

    await this.invalidate();
    return { data: updated };
  }

  private async invalidate() {
    await this.cache.invalidateDomain('articles');
  }
}
