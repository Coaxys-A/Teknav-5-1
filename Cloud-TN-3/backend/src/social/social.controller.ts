import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reaction')
  async toggleReaction(@Body() body: { entityType: string; entityId: number; reactionType: string; workspaceId?: number }, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return { ok: false };
    const existing = await (this.prisma as any).reaction.findFirst({
      where: { userId, entityType: body.entityType, entityId: body.entityId, reactionType: body.reactionType },
    });
    if (existing) {
      await (this.prisma as any).reaction.delete({ where: { id: existing.id } });
      return { ok: true, removed: true };
    }
    await (this.prisma as any).reaction.create({
      data: {
        userId,
        entityType: body.entityType,
        entityId: body.entityId,
        reactionType: body.reactionType,
        workspaceId: body.workspaceId ?? req.workspaceId ?? null,
      },
    });
    return { ok: true };
  }

  @Post('bookmark')
  async bookmark(@Body() body: { articleId: number; workspaceId?: number }, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return { ok: false };
    const existing = await (this.prisma as any).bookmark.findFirst({ where: { userId, articleId: body.articleId } });
    if (existing) {
      await (this.prisma as any).bookmark.delete({ where: { id: existing.id } });
      return { ok: true, removed: true };
    }
    await (this.prisma as any).bookmark.create({
      data: { userId, articleId: body.articleId, workspaceId: body.workspaceId ?? req.workspaceId ?? null },
    });
    return { ok: true };
  }

  @Get('bookmarks')
  async listBookmarks(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return [];
    return (this.prisma as any).bookmark.findMany({ where: { userId }, include: { article: true } });
  }

  @Post('follow')
  async follow(@Body() body: { followedType: string; followedId: number; workspaceId?: number }, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return { ok: false };
    const existing = await (this.prisma as any).follow.findFirst({
      where: { followerId: userId, followedType: body.followedType, followedId: body.followedId },
    });
    if (existing) {
      await (this.prisma as any).follow.delete({ where: { id: existing.id } });
      return { ok: true, removed: true };
    }
    await (this.prisma as any).follow.create({
      data: {
        followerId: userId,
        followedType: body.followedType,
        followedId: body.followedId,
        workspaceId: body.workspaceId ?? req.workspaceId ?? null,
      },
    });
    return { ok: true };
  }
}
