import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeoService } from './seo.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('seo')
export class SeoController {
  constructor(private readonly prisma: PrismaService, private readonly seoService: SeoService) {}

  @Get('article/:id')
  async getArticleMeta(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.article.findUnique({
      where: { id, status: 'PUBLISH' },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        mainKeyword: true,
        coverImageId: true,
        readingTime: true,
        readability: true,
        seoScore: true,
      },
    });
  }

  @Patch('article/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.OWNER)
  async updateArticleMeta(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      metaTitle?: string;
      metaDescription?: string;
      mainKeyword?: string;
      canonicalUrl?: string;
      noindex?: boolean;
    },
  ) {
    const seoScore = this.seoService.calcSeoScore({
      content: '',
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      mainKeyword: body.mainKeyword,
    });
    return this.prisma.article.update({
      where: { id },
      data: {
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        mainKeyword: body.mainKeyword,
        seoScore,
      },
      select: {
        id: true,
        metaTitle: true,
        metaDescription: true,
        mainKeyword: true,
        seoScore: true,
      },
    });
  }
}
