import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function simpleEmbedding(text: string, dimensions = 16): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  for (const w of words) {
    const code = Array.from(w).reduce((s, c) => s + c.charCodeAt(0), 0);
    vec[code % dimensions] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function cosine(a: number[], b: number[]) {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / ((Math.sqrt(na) || 1) * (Math.sqrt(nb) || 1));
}

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertVector(articleId: number, content: string) {
    const vector = simpleEmbedding(content);
    await this.prisma.recommendationVector.upsert({
      where: { articleId },
      update: { vector: vector as unknown as Prisma.InputJsonValue },
      create: { articleId, vector: vector as unknown as Prisma.InputJsonValue },
    });
  }

  async relatedArticles(articleId: number, limit = 5) {
    const target = await this.prisma.recommendationVector.findUnique({ where: { articleId } });
    if (!target) return [];
    const all = await this.prisma.recommendationVector.findMany({ where: { articleId: { not: articleId } }, take: 100 });
    const scores = all.map((v) => {
      const score = cosine(target.vector as unknown as number[], v.vector as unknown as number[]);
      return { articleId: v.articleId, score };
    });
    const top = scores.sort((a, b) => b.score - a.score).slice(0, limit);
    const articles = await this.prisma.article.findMany({
      where: { id: { in: top.map((t) => t.articleId) }, status: 'PUBLISH' },
      select: { id: true, title: true, slug: true, excerpt: true, coverImageId: true, categoryId: true },
    });
    return articles;
  }

  async feedForUser(userId: number | undefined, role: Role, limit = 10) {
    // naive behavior-based: prefer published articles, optionally filter by past reading tags (future analytics integration)
    return this.feed(undefined, limit);
  }

  async feed(workspaceId?: number, limit = 20) {
    const articles = await this.prisma.article.findMany({
      where: { status: 'PUBLISH', ...(workspaceId ? { workspaceId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return articles;
  }
}
