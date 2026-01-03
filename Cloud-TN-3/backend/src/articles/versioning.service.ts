import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Article } from '@prisma/client';

@Injectable()
export class VersioningService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(article: Article, userId?: number) {
    await this.prisma.articleVersion.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        tags: article.tags,
        status: article.status,
        createdById: userId,
      },
    });
  }

  async listVersions(articleId: number) {
    return this.prisma.articleVersion.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rollback(articleId: number, versionId: number) {
    const version = await this.prisma.articleVersion.findUnique({ where: { id: versionId } });
    if (!version || version.articleId !== articleId) {
      throw new Error('VERSION_NOT_FOUND');
    }
    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt ?? undefined,
        tags: version.tags ?? undefined,
        status: 'PENDING',
      },
    });
    await this.snapshot(updated);
    return updated;
  }
}
