import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async add(@Body() dto: CreateCommentDto, @CurrentUser() user: any, @Req() req: any) {
    return this.comments.add(dto, user, req?.tenantId ?? null);
  }

  @Get('article/:id')
  async list(@Param('id', ParseIntPipe) id: number, @Query('limit') limit?: string) {
    return this.comments.list(id, limit ? Number(limit) : 50);
  }

  @Post(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER, Role.EDITOR)
  async moderate(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @CurrentUser() user: any) {
    return this.comments.moderate(id, status, user);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async report(@Param('id', ParseIntPipe) id: number, @Body('reason') reason: string, @CurrentUser() user: any, @Req() req: any) {
    return this.comments.report(id, reason, user?.id, req?.tenantId ?? null);
  }
}
