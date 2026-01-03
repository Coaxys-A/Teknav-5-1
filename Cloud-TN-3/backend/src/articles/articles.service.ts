import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Role } from '@prisma/client';
import { slugify } from '../common/utils/slug.util';
import { AuditService } from '../audit/audit.service';
import { AiQueueService } from '../ai-validation/ai-queue.service';
import { AiValidationService } from '../ai-validation/ai-validation.service';
import { VersioningService } from './versioning.service';
import { SeoService } from '../seo/seo.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { WorkflowService } from '../workflows/workflow.service';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly aiQueue: AiQueueService,
    private readonly aiValidation: AiValidationService,
    private readonly versioning: VersioningService,
    private readonly seoService: SeoService,
    private readonly recommendation: RecommendationService,
    private readonly workflows: WorkflowService,
  ) {}

  private resolveStatusForCreate(role: Role, scheduledFor?: Date | null) {
    if (scheduledFor && scheduledFor.getTime() > Date.now()) {
      return 'SCHEDULED';
    }
    if (role === Role.OWNER || role === Role.ADMIN) return 'PUBLISH';
    return 'PROPOSED';
  }

  async create(dto: CreateArticleDto, user: { id: number; role: Role }, workspaceId?: number) {
    const slugBase = slugify(dto.title);
    const slug = await this.ensureUniqueSlug(slugBase);
    const scheduled = dto.scheduledFor ? new Date(dto.scheduledFor) : null;
    const readingTime = dto.readingTime ?? this.seoService.estimateReadingTime(dto.content);
    const readability = this.seoService.calcReadability(dto.content);
    const seoScore = this.seoService.calcSeoScore({
      content: dto.content,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      mainKeyword: dto.mainKeyword,
    });
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt,
        slug,
        status: this.resolveStatusForCreate(user.role, scheduled),
        authorId: user.id,
        categoryId: dto.categoryId ?? undefined,
        tags: dto.tags ?? undefined,
        scheduledFor: scheduled ?? undefined,
        metaTitle: dto.metaTitle ?? undefined,
        metaDescription: dto.metaDescription ?? undefined,
        aiDecision: 'PENDING',
        mainKeyword: dto.mainKeyword ?? undefined,
        readingTime,
        readability,
        seoScore,
        coverImageId: dto.coverImageId ?? undefined,
        workspaceId: workspaceId ?? undefined,
      },
      include: { author: true, aiReports: true },
    });
    if (dto.tagIds?.length) {
      await this.setTags(article.id, dto.tagIds);
    }

    await this.versioning.snapshot(article, user.id);
    await this.recommendation.upsertVector(article.id, article.content);
    await this.audit.log('article.create', user.id, { articleId: article.id });
    if (article.status === 'PROPOSED' || article.status === 'PENDING') {
      await this.workflows.start('article.submitted_for_review', { article });
    }
    if (article.status !== 'REJECTED' && article.status !== 'SCHEDULED') {
      this.aiQueue.enqueue(article.id);
    }
    return article;
  }

  async ensureUniqueSlug(base: string) {
    let slug = base;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.article.findUnique({ where: { slug } });
      if (!existing) return slug;
      slug = `${base}-${counter++}`;
    }
  }

  async listForUser(user: { id: number; role: Role }, status?: string, workspaceId?: number) {
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (user.role === Role.WRITER) {
      where.authorId = user.id;
    }
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.prisma.article.findMany({
      where,
      include: { author: true, aiReports: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublic(status = 'PUBLISH', workspaceId?: number) {
    return this.prisma.article.findMany({
      where: { status, ...(workspaceId ? { workspaceId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { author: true, aiReports: { orderBy: { createdAt: 'desc' }, take: 1 }, sponsorships: true },
    });
  }

  async listVersions(articleId: number, user: { id: number; role: Role }) {
    const existing = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!existing) {
      throw new NotFoundException('ARTICLE_NOT_FOUND');
    }
    const isOwner = user.role === Role.OWNER || user.role === Role.ADMIN || user.role === Role.EDITOR || user.role === Role.MANAGER;
    const isAuthor = existing.authorId === user.id;
    if (!isOwner && !isAuthor) {
      throw new UnauthorizedException('NOT_ALLOWED');
    }
    return this.versioning.listVersions(articleId);
  }

  async approve(id: number, actor: { id: number; role: Role }) {
    const isPrivileged = actor.role === Role.ADMIN || actor.role === Role.OWNER;
    if (!isPrivileged) {
      throw new UnauthorizedException();
    }
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('ARTICLE_NOT_FOUND');
    const aiReport = await this.aiValidation.analyzeArticle(existing.content);
    await this.prisma.aIReport.create({
      data: {
        articleId: id,
        originalityScore: aiReport.originalityScore ?? undefined,
        seoScore: aiReport.seoScore ?? undefined,
        structureValid: aiReport.structureValid ?? undefined,
        aiProbability: aiReport.aiProbability ?? undefined,
        feedback: aiReport.feedback,
        modelUsed: aiReport.modelUsed,
        raw: aiReport.raw,
      },
    });
    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'PUBLISH', publishedAt: new Date(), aiDecision: 'MANUAL_APPROVE' },
      include: { author: true, aiReports: true },
    });
    await this.audit.log('article.approve', actor.id, { articleId: id });
    await this.workflows.start('article.published', { article });
    return article;
  }

  async reject(id: number, reason: string | undefined, actor: { id: number; role: Role }) {
    const isPrivileged = actor.role === Role.ADMIN || actor.role === Role.OWNER;
    if (!isPrivileged) {
      throw new UnauthorizedException();
    }
    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'REJECTED', excerpt: reason ?? undefined, aiDecision: 'MANUAL_REJECT', autoPublished: false },
      include: { author: true, aiReports: true },
    });
    await this.audit.log('article.reject', actor.id, { articleId: id, reason });
    await this.workflows.start('article.rejected', { article });
    return article;
  }

  async update(id: number, dto: UpdateArticleDto, user: { id: number; role: Role }) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ARTICLE_NOT_FOUND');
    }
    const isOwner = user.role === Role.OWNER || user.role === Role.ADMIN;
    const isAuthor = existing.authorId === user.id && user.role === Role.WRITER;
    if (!isOwner && !isAuthor) {
      throw new UnauthorizedException('NOT_ALLOWED');
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        content: dto.content ?? existing.content,
        excerpt: dto.excerpt ?? existing.excerpt,
        status: dto.status ?? existing.status,
        categoryId: dto.categoryId ?? existing.categoryId,
        tags: dto.tags ?? existing.tags,
        aiScore: dto.aiScore ?? existing.aiScore,
        aiDecision: dto.aiDecision ?? existing.aiDecision,
        autoPublished: dto.autoPublished ?? existing.autoPublished,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : existing.scheduledFor,
        metaTitle: dto.metaTitle ?? existing.metaTitle,
        metaDescription: dto.metaDescription ?? existing.metaDescription,
        mainKeyword: dto.mainKeyword ?? existing.mainKeyword,
        readingTime: dto.readingTime ?? this.seoService.estimateReadingTime(dto.content ?? existing.content),
        readability: dto.content ? this.seoService.calcReadability(dto.content) : existing.readability,
        seoScore: this.seoService.calcSeoScore({
          content: dto.content ?? existing.content,
          metaTitle: dto.metaTitle ?? existing.metaTitle,
          metaDescription: dto.metaDescription ?? existing.metaDescription,
          mainKeyword: dto.mainKeyword ?? existing.mainKeyword,
        }),
        coverImageId: dto.coverImageId ?? existing.coverImageId,
      },
      include: { author: true, aiReports: true },
    });
    if (dto.tagIds) {
      await this.setTags(id, dto.tagIds);
    }
    await this.versioning.snapshot(updated, user.id);
    await this.recommendation.upsertVector(updated.id, updated.content);
    await this.audit.log('article.update', user.id, { articleId: id });
    if (dto.content) {
      this.aiQueue.enqueue(id);
    }
    return updated;
  }

  private async setTags(articleId: number, tagIds: number[]) {
    await this.prisma.articleTag.deleteMany({ where: { articleId } });
    if (!tagIds.length) return;
    await this.prisma.articleTag.createMany({
      data: tagIds.map((tagId) => ({ articleId, tagId })),
      skipDuplicates: true,
    });
  }

  async autosave(id: number, dto: { content: string; title: string }, user: { id: number; role: Role }) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('ARTICLE_NOT_FOUND');
    const isOwner = user.role === Role.OWNER || user.role === Role.ADMIN || existing.authorId === user.id;
    if (!isOwner) throw new UnauthorizedException('NOT_ALLOWED');
    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        content: dto.content ?? existing.content,
        title: dto.title ?? existing.title,
        updatedAt: new Date(),
      },
      include: { author: true },
    });
    await this.versioning.snapshot(updated, user.id);
    return { ok: true, versioned: true };
  }
}
