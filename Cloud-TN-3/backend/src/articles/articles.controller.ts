import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CacheInterceptor } from '../common/interceptors/cache.interceptor';
import { RedisService } from '../redis/redis.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService, private readonly redis: RedisService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER, Role.ADMIN, Role.OWNER)
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: any, @Query('workspaceId') workspaceId?: number) {
    return this.articlesService.create(dto, user, workspaceId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER, Role.ADMIN, Role.OWNER)
  list(@Query('status') status: string | undefined, @Query('workspaceId') workspaceId: string | undefined, @CurrentUser() user: any) {
    return this.articlesService.listForUser(user, status, workspaceId ? Number(workspaceId) : undefined);
  }

  @Get('public')
  findPublic(@Query('status') status?: string, @Query('workspaceId') workspaceId?: string) {
    return this.articlesService.findPublic(status ?? 'PUBLISH', workspaceId ? Number(workspaceId) : undefined);
  }

  @Get('cached/public')
  @UseInterceptors(CacheInterceptor)
  findPublicCached(@Query('status') status?: string) {
    return this.articlesService.findPublic(status ?? 'PUBLISH');
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.articlesService.approve(id, user);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.reject(id, reason, user);
  }

  @Post(':id/autosave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  autosave(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
    @Body('title') title: string,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.autosave(id, { content, title }, user);
  }

  @Post(':id/autosave/cache')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async autosaveCache(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
    @Body('title') title: string,
    @CurrentUser() user: any,
  ) {
    const key = `autosave:article:${id}:user:${user?.id ?? 'anon'}`;
    await this.redis.set(key, { content, title, ts: Date.now(), userId: user?.id ?? null }, 3600);
    return { ok: true, cached: true };
  }

  @Get(':id/autosave/cache')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER, Role.EDITOR, Role.ADMIN, Role.OWNER)
  async getAutosaveCache(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const key = `autosave:article:${id}:user:${user?.id ?? 'anon'}`;
    const cached = await this.redis.get<{ content: string; title: string; ts: number }>(key);
    return { cached };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER, Role.ADMIN, Role.OWNER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleDto, @CurrentUser() user: any) {
    return this.articlesService.update(id, dto, user);
  }

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER, Role.ADMIN, Role.OWNER, Role.EDITOR, Role.AUTHOR, Role.MANAGER)
  listVersions(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.articlesService.listVersions(id, user);
  }
}
