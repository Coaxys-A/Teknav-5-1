import { Controller, Post, Body } from '@nestjs/common';
import { ArticleWorkflowService } from './article-workflow.service';

@Controller('owner/publish')
export class PublisherController {
  constructor(private readonly workflow: ArticleWorkflowService) {}

  @Post('generate-slug')
  generateSlug(@Body('title') title: string) {
    return { slug: this.workflow.generateSlug(title) };
  }

  @Post('validate')
  validate(@Body() body: any) {
    this.workflow.validateFrontmatter(body);
    return { ok: true };
  }

  @Post()
  async publish(@Body() body: any) {
    const res = await this.workflow.publishToFs(body);
    return { ok: true, ...res };
  }
}
