import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiValidationService } from './ai-validation.service';
import { Role } from '@prisma/client';

const STRUCTURE_THRESHOLD = true;
const MIN_SEO_SCORE = 0.4;
const MIN_ORIGINALITY = 60;
const MAX_AI_PROBABILITY = 90;
const AUTO_PUBLISH_SCORE = 80;

@Injectable()
export class AiQueueService {
  private readonly logger = new Logger(AiQueueService.name);
  private readonly queue: number[] = [];
  private processing = false;

  constructor(private readonly prisma: PrismaService, private readonly aiService: AiValidationService) {}

  enqueue(articleId: number) {
    this.queue.push(articleId);
    void this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const articleId = this.queue.shift()!;
        const article = await this.prisma.article.findUnique({ where: { id: articleId } });
        if (!article) {
          continue;
        }
        const result = await this.aiService.analyzeArticle(article.content);
        const compositeScore = this.calcScore(result);
        await this.prisma.aIReport.create({
          data: {
            articleId,
            originalityScore: result.originalityScore ?? undefined,
            seoScore: result.seoScore ?? undefined,
            structureValid: result.structureValid ?? undefined,
            aiProbability: result.aiProbability ?? undefined,
            feedback: result.feedback,
            modelUsed: result.modelUsed,
            raw: result.raw,
          },
        });

        const shouldAutoReject =
          (STRUCTURE_THRESHOLD && result.structureValid === false) ||
          (result.seoScore !== null && result.seoScore < MIN_SEO_SCORE) ||
          (result.originalityScore !== null && result.originalityScore < MIN_ORIGINALITY) ||
          (result.aiProbability !== null && result.aiProbability > MAX_AI_PROBABILITY);

        if (shouldAutoReject) {
          await this.prisma.article.update({
            where: { id: articleId },
            data: {
              status: 'REJECTED',
              aiScore: compositeScore,
              aiDecision: 'AUTO_REJECT',
              autoPublished: false,
            },
          });
        } else if (compositeScore >= AUTO_PUBLISH_SCORE) {
          await this.prisma.article.update({
            where: { id: articleId },
            data: {
              status: 'PUBLISH',
              publishedAt: new Date(),
              aiScore: compositeScore,
              aiDecision: 'AUTO_PUBLISH',
              autoPublished: true,
            },
          });
        } else {
          await this.prisma.article.update({
            where: { id: articleId },
            data: {
              status: 'PENDING',
              aiScore: compositeScore,
              aiDecision: 'REVIEW_REQUIRED',
              autoPublished: false,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('AI queue processing failed', error as Error);
    } finally {
      this.processing = false;
    }
  }

  private calcScore(result: Awaited<ReturnType<AiValidationService['analyzeArticle']>>) {
    const seo = result.seoScore !== null ? result.seoScore * 100 : 50;
    const originality = result.originalityScore ?? 50;
    const structure = result.structureValid === false ? 0 : 15;
    const antiAi = result.aiProbability !== null ? Math.max(0, 100 - result.aiProbability) : 50;
    const base = (seo + originality + structure + antiAi) / 4;
    return Math.min(100, Math.max(0, Math.round(base)));
  }
}
