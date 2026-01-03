import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slug.util';

@Injectable()
export class TranslationService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertArticleTranslation(
    articleId: number,
    localeCode: string,
    data: {
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
    return this.prisma.articleTranslation.upsert({
      where: { articleId_localeCode: { articleId, localeCode } },
      update: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        status: data.status ?? 'draft',
        isMachineTranslated: data.isMachineTranslated ?? false,
        isHumanVerified: data.isHumanVerified ?? false,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        publishedAt: data.publishedAt ?? undefined,
      },
      create: {
        articleId,
        localeCode,
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        content: data.content,
        status: data.status ?? 'draft',
        isMachineTranslated: data.isMachineTranslated ?? false,
        isHumanVerified: data.isHumanVerified ?? false,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        publishedAt: data.publishedAt ?? undefined,
      },
    });
  }

  async getArticleTranslation(articleId: number, localeCode: string) {
    return this.prisma.articleTranslation.findUnique({
      where: { articleId_localeCode: { articleId, localeCode } },
    });
  }

  async listArticleTranslations(articleId: number) {
    return this.prisma.articleTranslation.findMany({
      where: { articleId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listLocales() {
    return (this.prisma as any).locale.findMany({ where: { isEnabled: true }, orderBy: [{ isDefault: 'desc' }, { code: 'asc' }] });
  }

  async createLocale(data: { code: string; name: string; direction?: string; isDefault?: boolean }) {
    if (data.isDefault) {
      await (this.prisma as any).locale.updateMany({ data: { isDefault: false }, where: {} });
    }
    return (this.prisma as any).locale.upsert({
      where: { code: data.code },
      update: { name: data.name, direction: data.direction ?? 'LTR', isDefault: data.isDefault ?? false, isEnabled: true },
      create: { code: data.code, name: data.name, direction: data.direction ?? 'LTR', isDefault: data.isDefault ?? false, isEnabled: true },
    });
  }

  async generateTranslation(articleId: number, targetLocale: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new Error('ARTICLE_NOT_FOUND');
    const sourceSlug = article.slug;
    const newSlug = `${sourceSlug}-${targetLocale}`;
    const title = article.title;
    const summary = article.excerpt ?? '';
    const content = article.content ?? '';
    return this.upsertArticleTranslation(articleId, targetLocale, {
      title,
      slug: slugify(newSlug),
      summary,
      content,
      status: 'draft',
      isMachineTranslated: true,
      isHumanVerified: false,
      metaTitle: article.metaTitle ?? undefined,
      metaDescription: article.metaDescription ?? undefined,
    });
  }

  async markHumanReviewed(articleId: number, localeCode: string) {
    return this.prisma.articleTranslation.update({
      where: { articleId_localeCode: { articleId, localeCode } },
      data: { isHumanVerified: true, isMachineTranslated: false, status: 'reviewed' },
    });
  }

  async diff(articleId: number, sourceLocale: string, targetLocale: string) {
    const base = await this.getArticleTranslation(articleId, sourceLocale);
    const target = await this.getArticleTranslation(articleId, targetLocale);
    const baseLines = (base?.content ?? '').split('\n');
    const targetLines = (target?.content ?? '').split('\n');
    const max = Math.max(baseLines.length, targetLines.length);
    const diffs: { line: number; source?: string; target?: string }[] = [];
    for (let i = 0; i < max; i++) {
      const s = baseLines[i] ?? '';
      const t = targetLines[i] ?? '';
      if (s !== t) diffs.push({ line: i + 1, source: s, target: t });
    }
    return { diffs, sourceLocale, targetLocale };
  }
}
