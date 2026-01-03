import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AiRuntimeService } from '../ai/ai-runtime.service';
import { slugify } from '../common/utils/slug.util';

@Controller('translation')
export class TranslationController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly aiRuntime: AiRuntimeService,
  ) {}

  @Get('article/:id')
  async get(@Param('id', ParseIntPipe) id: number, @Query('locale') locale: string) {
    return this.translationService.getArticleTranslation(id, locale);
  }

  @Get('article/:id/list')
  async list(@Param('id', ParseIntPipe) id: number) {
    return this.translationService.listArticleTranslations(id);
  }

  @Get('locales')
  async locales() {
    return this.translationService.listLocales();
  }

  @Post('locales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async upsertLocale(@Body() body: { code: string; name: string; direction?: string; isDefault?: boolean }) {
    return this.translationService.createLocale(body);
  }

  @Post('article/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER)
  async upsert(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      localeCode: string;
      title: string;
      slug: string;
      summary?: string;
      content: string;
      status?: string;
      isMachineTranslated?: boolean;
      isHumanVerified?: boolean;
      metaTitle?: string;
      metaDescription?: string;
      publishedAt?: Date | null;
    },
  ) {
    return this.translationService.upsertArticleTranslation(id, body.localeCode, body);
  }

  @Post('article/:id/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER)
  async generate(@Param('id', ParseIntPipe) id: number, @Body('targetLocale') targetLocale: string) {
    return this.translationService.generateTranslation(id, targetLocale);
  }

  @Post('translate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER, Role.WRITER)
  async translateAi(
    @Body()
    body: {
      articleId?: number;
      source?: string;
      target: string;
      text: string;
      title?: string;
    },
  ) {
    const result = await this.aiRuntime.runAgent({
      agentId: Number(process.env.DEFAULT_TRANSLATION_AGENT_ID ?? 0),
      input: { task: 'translate', source: body.source ?? 'fa', target: body.target, text: body.text },
    });
    const output = (result as any)?.result ?? (result as any)?.output ?? body.text;
    const slug = body.title ? slugify(`${body.title}-${body.target}`) : undefined;
    if (body.articleId) {
      await this.translationService.upsertArticleTranslation(body.articleId, body.target, {
        title: body.title ?? `Translated ${body.target}`,
        slug: slug ?? `${body.articleId}-${body.target}`,
        content: output,
        summary: '',
        status: 'draft',
        isMachineTranslated: true,
        isHumanVerified: false,
      });
    }
    return { translated: output };
  }

  @Post('article/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER)
  async review(@Param('id', ParseIntPipe) id: number, @Body('locale') locale: string) {
    return this.translationService.markHumanReviewed(id, locale);
  }

  @Get('article/:id/diff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER)
  async diff(
    @Param('id', ParseIntPipe) id: number,
    @Query('source') source: string,
    @Query('target') target: string,
  ) {
    return this.translationService.diff(id, source, target);
  }
}
