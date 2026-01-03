import { Controller, Get, Query, Req } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { UserEventsService } from '../user-events/user-events.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('recommendations')
export class PersonalizedController {
  constructor(
    private readonly recommendation: RecommendationService,
    private readonly events: UserEventsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('personalized')
  async personalized(@Req() req: any, @Query('workspaceId') workspaceId?: string) {
    const wsId = workspaceId ? Number(workspaceId) : req.workspaceId ?? undefined;
    const userId = req.user?.id;
    const vector = userId ? await this.prisma.userInterestVector.findUnique({ where: { userId_workspaceId: { userId, workspaceId: wsId ?? null } } }) : null;
    const articles = await this.recommendation.feed(wsId);
    if (!vector || !vector.vector) return { items: articles };
    const prefs = (vector.vector as any[]).map((v) => v.k);
    const scored = articles.map((a) => {
      let score = 0;
      if (a.tags && Array.isArray(a.tags)) {
        for (const t of a.tags as any[]) {
          if (prefs.includes(`tag:${t}`)) score += 2;
        }
      }
      return { ...a, _score: score };
    });
    scored.sort((a, b) => b._score - a._score);
    return { items: scored };
  }
}
