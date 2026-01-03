import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import slugify from 'slugify';

type PublishPayload = {
  id: number;
  slug?: string;
  title: string;
  content: string;
  meta?: Record<string, any>;
};

@Injectable()
export class ArticleWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async setStatus(id: number, status: string) {
    return this.prisma.article.update({ where: { id }, data: { status } });
  }

  async submit(id: number) {
    return this.setStatus(id, 'SUBMITTED');
  }

  async startReview(id: number) {
    return this.setStatus(id, 'IN_REVIEW');
  }

  async requestChanges(id: number, notes?: string) {
    return this.prisma.article.update({ where: { id }, data: { status: 'CHANGES_REQUESTED', reviewNotes: notes ?? null } });
  }

  async approve(id: number) {
    return this.setStatus(id, 'APPROVED');
  }

  async schedule(id: number, date: Date) {
    return this.prisma.article.update({ where: { id }, data: { status: 'SCHEDULED', scheduledFor: date } });
  }

  async publish(id: number) {
    return this.setStatus(id, 'PUBLISHED');
  }

  async forcePublish(id: number) {
    return this.publish(id);
  }

  async lock(id: number) {
    return this.prisma.article.update({ where: { id }, data: { status: 'LOCKED' as any } });
  }

  async overrideMeta(id: number, meta: Record<string, any>) {
    return this.prisma.article.update({ where: { id }, data: { metaDescription: meta.metaDescription ?? null, metaTitle: meta.metaTitle ?? null } });
  }

  async overrideCategory(id: number, categoryId: number) {
    return this.prisma.article.update({ where: { id }, data: { categoryId } });
  }

  generateSlug(title: string) {
    return slugify(title, { lower: true, strict: true });
  }

  validateFrontmatter(payload: PublishPayload) {
    if (!payload.title || !payload.content) throw new Error('invalid_frontmatter');
    return true;
  }

  async publishToFs(payload: PublishPayload) {
    this.validateFrontmatter(payload);
    const slug = payload.slug ?? this.generateSlug(payload.title);
    const frontmatter = [
      '---',
      `title: "${payload.title.replace(/"/g, '\\"')}"`,
      `slug: "${slug}"`,
      `date: "${new Date().toISOString()}"`,
      payload.meta?.tags ? `tags: ${JSON.stringify(payload.meta.tags)}` : null,
      payload.meta?.description ? `description: "${payload.meta.description.replace(/"/g, '\\"')}"` : null,
      payload.meta?.seoKeywords ? `seoKeywords: ${JSON.stringify(payload.meta.seoKeywords)}` : null,
      '---',
    ]
      .filter(Boolean)
      .join('\n');
    const fileContent = `${frontmatter}\n\n${payload.content}`;
    const target = join(process.cwd(), 'content', 'articles', `${slug}.mdx`);
    await fs.writeFile(target, fileContent, { encoding: 'utf8' });
    return { slug, path: target };
  }
}
