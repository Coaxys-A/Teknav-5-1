import { Processor, ProcessError } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';

/**
 * AI SEO Jobs Consumer
 * 
 * Queue: ai-seo
 * Job Types:
 * - seo_optimize_article
 * - generate_meta
 * - keyword_suggest
 */

@Injectable()
export class AiSeoConsumer {
  private readonly logger = new Logger(AiSeoConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @Processor('seo_optimize_article')
  async handleSeoOptimizeArticle(job: Job) {
    this.logger.debug(`Processing seo_optimize_article job ${job.id}`);
    
    try {
      const data = job.data;
      const articleId = data.articleId;
      
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      // Simulate AI SEO optimization
      const mockResult = {
        metaTitle: article.title + ' | بهینه شده برای سئو',
        metaDescription: article.content?.substring(0, 160) || '',
        mainKeyword: 'کلمه کلیدی اصلی',
        seoScore: 85,
        readability: 78,
      };

      // Update Article with SEO fields
      await this.prisma.article.update({
        where: { id: articleId },
        data: {
          metaTitle: mockResult.metaTitle,
          metaDescription: mockResult.metaDescription,
          mainKeyword: mockResult.mainKeyword,
          seoScore: mockResult.seoScore,
          readability: mockResult.readability,
        },
      });

      // Create AIReport
      await this.prisma.aIReport.create({
        data: {
          articleId,
          originalityScore: 92,
          seoScore: mockResult.seoScore,
          structureValid: true,
          aiProbability: 0.95,
          modelUsed: 'gpt-4',
          raw: JSON.stringify(mockResult),
        },
      });

      return mockResult;

    } catch (error: any) {
      this.logger.error(`SEO optimization failed for article ${job.data.articleId}:`, error.message);
      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('generate_meta')
  async handleGenerateMeta(job: Job) {
    this.logger.debug(`Processing generate_meta job ${job.id}`);
    return { success: true, metaGenerated: true };
  }

  @Processor('keyword_suggest')
  async handleKeywordSuggest(job: Job) {
    this.logger.debug(`Processing keyword_suggest job ${job.id}`);
    return { success: true, keywords: ['کلمه1', 'کلمه2', 'کلمه3'] };
  }
}
