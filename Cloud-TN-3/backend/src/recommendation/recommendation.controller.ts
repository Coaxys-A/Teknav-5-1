import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recService: RecommendationService) {}

  @Get('related/:id')
  async related(@Param('id', ParseIntPipe) id: number, @Query('limit') limit?: string) {
    return this.recService.relatedArticles(id, limit ? Number(limit) : 5);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async feed(@CurrentUser() user: { id: number; role: Role }, @Query('limit') limit?: string) {
    return this.recService.feedForUser(user?.id, user?.role ?? Role.GUEST, limit ? Number(limit) : 10);
  }
}
