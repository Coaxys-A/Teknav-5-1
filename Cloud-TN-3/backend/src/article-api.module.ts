import { Module, Controller, Get, Post, Body, Param, Query, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import Redis from 'ioredis';
import { promises as fs } from 'fs';
import { join } from 'path';

const redis = new Redis(process.env.REDIS_URL || '');

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  draftKey(id: string) {
    return `draft:${id}`;
  }

  async loadDraft(id: string) {
    const cached = await redis.get(this.draftKey(id));
    if (cached) return JSON.parse(cached);
    const article = await this.prisma.article.findUnique({ where: { id: Number(id) } });
    return article ? { articleId: id, content: article.content, meta: { title: article.title } } : null;
  }

  async saveDraft(id: string, content: string, meta?: any) {
    await redis.set(this.draftKey(id), JSON.stringify({ articleId: id, content, meta }), 'EX', 3600);
    return { ok: true };
  }

  async getPublished(slug: string) {
    const file = join(process.cwd(), 'content', 'articles', `${slug}.mdx`);
    const content = await fs.readFile(file, 'utf8');
    return { slug, content };
  }
}

@Injectable()
export class ArticleAIService {
  async cache(key: string, value: any) {
    await redis.set(`ai-cache:${key}`, JSON.stringify(value), 'EX', 600);
  }
}

@Injectable()
export class ArticleReviewService {
  async setQualityScore(id: number, score: number) {
    await redis.set(`review:${id}:quality`, String(score), 'EX', 600);
    return { ok: true };
  }
}

@Injectable()
export class TemplateService {
  private readonly templates = [
    { key: 'cyber-tutorial', titlePattern: 'راهنمای امنیت: {topic}' },
    { key: 'news', titlePattern: 'خبر: {headline}' },
  ];
  list() {
    return this.templates;
  }
}

@Injectable()
export class PublicationService {
  constructor(private readonly article: ArticleService) {}

  async publish(id: number, payload: { title: string; content: string; slug?: string; meta?: any }) {
    const slug = payload.slug ?? payload.title.toLowerCase().replace(/\s+/g, '-');
    await this.article.saveDraft(String(id), payload.content, payload.meta);
    return { slug };
  }

  async validate(payload: { title: string; content: string }) {
    if (!payload.title || !payload.content) throw new Error('invalid');
    return { ok: true };
  }
}

@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticleService) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.loadDraft(id);
  }
}

@Controller('articles/review')
export class ArticleReviewController {
  constructor(private readonly review: ArticleReviewService) {}

  @Post('quality')
  setQuality(@Body() body: any) {
    return this.review.setQualityScore(Number(body.id), Number(body.score));
  }
}

@Controller('articles/ai')
export class ArticleAIController {
  constructor(private readonly ai: ArticleAIService) {}

  @Post('cache')
  cache(@Body() body: any) {
    return this.ai.cache(body.key, body.value);
  }
}

@Controller('templates')
export class TemplateController {
  constructor(private readonly templates: TemplateService) {}
  @Get()
  list() {
    return this.templates.list();
  }
}

@Controller('publish')
export class PublicationController {
  constructor(private readonly publication: PublicationService) {}

  @Post('validate')
  validate(@Body() body: any) {
    return this.publication.validate(body);
  }

  @Post()
  publish(@Body() body: any) {
    return this.publication.publish(Number(body.id), body);
  }
}

@Module({
  controllers: [ArticlesController, ArticleReviewController, ArticleAIController, TemplateController, PublicationController],
  providers: [ArticleService, ArticleAIService, ArticleReviewService, TemplateService, PublicationService, PrismaService],
})
export class ArticleApiModule {}
