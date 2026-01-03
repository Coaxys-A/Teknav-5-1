import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuditService } from '../audit/audit.service';
import { Role } from '@prisma/client';
import { TrustSafetyService } from '../trust-safety/trust-safety.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly trust: TrustSafetyService,
  ) {}

  async add(dto: CreateCommentDto, user?: { id?: number; role?: Role }, tenantId?: number | null) {
    const article = await this.prisma.article.findUnique({ where: { id: dto.articleId } });
    if (!article) throw new NotFoundException('ARTICLE_NOT_FOUND');
    const status = user?.role && user.role !== 'GUEST' ? 'visible' : 'pending';
    const comment = await this.prisma.comment.create({
      data: {
        articleId: dto.articleId,
        parentId: dto.parentId ?? null,
        body: dto.body,
        guestName: dto.guestName,
        userId: user?.id ?? null,
        status,
        tenantId: tenantId ?? null,
      },
    });
    await this.audit.log('comment.add', user?.id, { commentId: comment.id, articleId: dto.articleId });
    if (status === 'visible' && user?.id) {
      await this.prisma.user.update({ where: { id: user.id }, data: { reputation: { increment: 1 } } });
    }
    return comment;
  }

  async list(articleId: number, limit = 50) {
    return this.prisma.comment.findMany({
      where: { articleId, status: { in: ['visible', 'pending'] } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async moderate(id: number, status: string, actor: { id: number; role: Role }) {
    if (actor.role !== Role.ADMIN && actor.role !== Role.OWNER && actor.role !== Role.EDITOR) {
      throw new UnauthorizedException();
    }
    const updated = await this.prisma.comment.update({ where: { id }, data: { status } });
    await this.audit.log('comment.moderate', actor.id, { commentId: id, status });
    if (status === 'visible' && updated.userId) {
      await this.prisma.user.update({ where: { id: updated.userId }, data: { reputation: { increment: 1 } } });
    }
    return updated;
  }

  async report(commentId: number, reason?: string, reporterId?: number, tenantId?: number | null) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('COMMENT_NOT_FOUND');
    await this.prisma.comment.update({ where: { id: commentId }, data: { status: 'pending' } });
    return this.trust.report({
      targetType: 'comment',
      targetId: commentId,
      commentId,
      reason,
      reporterId,
      tenantId: tenantId ?? null,
    });
  }
}
