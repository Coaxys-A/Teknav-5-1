import { Injectable } from '@nestjs/common';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { slugify } from '../common/utils/slug.util';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class PublishService {
  constructor(private readonly logging: LoggingService) {}

  async publish(body: { id: number; title: string; content: string; slug?: string; meta?: any }) {
    const slug = slugify(body.slug ?? body.title ?? `article-${body.id}`);
    const dir = join(process.cwd(), 'content', 'articles');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const frontmatter = [
      '---',
      `title: "${body.title.replace(/"/g, '\\"')}"`,
      `slug: "${slug}"`,
      body.meta?.description ? `description: "${String(body.meta.description).replace(/"/g, '\\"')}"` : null,
      body.meta?.tags ? `tags: ${JSON.stringify(body.meta.tags)}` : null,
      '---',
      '',
    ]
      .filter(Boolean)
      .join('\n');
    const filepath = join(dir, `${slug}.mdx`);
    writeFileSync(filepath, `${frontmatter}${body.content ?? ''}`, 'utf8');
    await this.logging.logPublish(null, body.id, null);
    return { ok: true, slug, path: filepath };
  }
}
