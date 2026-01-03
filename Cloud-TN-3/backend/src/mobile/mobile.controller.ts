import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticlesService } from '../articles/articles.service';
import { SearchService } from '../search/search.service';

@Controller('m/v1')
export class MobileController {
  constructor(private readonly articles: ArticlesService, private readonly search: SearchService) {}

  @Get('feed')
  async feed(@Query('status') status?: string) {
    const items = await this.articles.findPublic(status ?? 'PUBLISH');
    return { items };
  }

  @Get('articles/:slug')
  async article(@Param('slug') slug: string) {
    // simple lookup
    const results = await this.articles.findPublic('PUBLISH');
    const found = results.find((a) => a.slug === slug);
    return found ?? {};
  }

  @Get('search')
  async searchArticles(@Query('q') q: string, @Query('locale') locale?: string) {
    const res = await this.search.search({ query: q, locale, limit: 20, skip: 0 });
    return { items: res };
  }
}
