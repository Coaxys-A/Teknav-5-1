import { Processor, ProcessError } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AiRuntimeService } from '../../ai/ai-runtime.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';

/**
 * AI Content Jobs Consumer
 * 
 * Queue: ai:content
 * Job Types:
 * - generate_article_draft
 * - rewrite_article_section
 * - summarize_article
 * - translate_article
 */

@Injectable()
export class AiContentConsumer {
  private readonly logger = new Logger(AiContentConsumer.name);

  constructor(
    private readonly aiRuntime: AiRuntimeService,
    private readonly prisma: PrismaService,
  ) {}

  @Processor('generate_article_draft')
  async handleGenerateArticleDraft(job: Job) {
    const traceId = randomUUID();
    const startTime = Date.now();
    
    this.logger.debug(`Processing generate_article_draft job ${job.id}`);
    
    try {
      const data = job.data;
      
      // Create/update AiRun
      const aiRun = await this.aiRuntime.updateAiRun({
        tenantId: data.tenantId || null,
        workspaceId: data.workspaceId || null,
        taskId: data.taskId || null,
        status: 'running',
        traceId,
        durationMs: 0,
        cost: null,
      });

      // Load required data
      const article = await this.prisma.article.findUnique({
        where: { id: data.articleId },
        include: { author: true },
      });

      if (!article) {
        throw new Error(`Article not found: ${data.articleId}`);
      }

      // Call AI (simulated here, real in production)
      const mockResult = {
        title: 'مقاله تولید شده',
        content: 'محتوای مقاله تولید شده...',
        excerpt: 'چکیده مقاله...',
      };

      const durationMs = Date.now() - startTime;

      // Store output in AiDraft
      await this.prisma.aiDraft.create({
        data: {
          articleId: data.articleId,
          title: mockResult.title,
          content: mockResult.content,
          excerpt: mockResult.excerpt,
        },
      });

      // Update AiRun with success
      await this.aiRuntime.updateAiRun({
        id: aiRun.id,
        status: 'completed',
        totalTokens: 4000,
        completionTokens: 2500,
        durationMs,
        cost: 0.012,
      });

      // Log messages
      await this.aiRuntime.logAiMessage({
        runId: aiRun.id,
        role: 'user',
        content: `Generate article draft for: ${article.title}`,
      });

      await this.aiRuntime.logAiMessage({
        runId: aiRun.id,
        role: 'assistant',
        content: mockResult.content,
      });

      // Log success event
      await this.aiRuntime.logAiEvent({
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        runId: aiRun.id,
        level: 'info',
        message: 'ai.content.generate.completed',
        metadata: {
          traceId,
          jobType: 'generate_article_draft',
          durationMs,
          promptTokens: 1500,
          completionTokens: 2500,
          totalTokens: 4000,
          cost: 0.012,
          input: data,
          output: mockResult,
        },
      });

      return mockResult;

    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      // Update AiRun with error
      await this.aiRuntime.updateAiRun({
        tenantId: job.data.tenantId || null,
        workspaceId: job.data.workspaceId || null,
        taskId: job.data.taskId || null,
        status: 'failed',
        traceId,
        durationMs,
        errorMessage: error.message || 'Unknown error',
      });

      // Log error event
      await this.aiRuntime.logAiEvent({
        tenantId: job.data.tenantId,
        workspaceId: job.data.workspaceId,
        level: 'error',
        message: 'ai.content.generate.failed',
        metadata: {
          traceId,
          jobType: 'generate_article_draft',
          durationMs,
          error: error.message,
          stack: error.stack,
          input: job.data,
        },
      });

      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('rewrite_article_section')
  async handleRewriteArticleSection(job: Job) {
    this.logger.debug(`Processing rewrite_article_section job ${job.id}`);
    // Similar implementation to generate_article_draft
    // For now, simulate success
    return { success: true, rewritten: true };
  }

  @Processor('summarize_article')
  async handleSummarizeArticle(job: Job) {
    this.logger.debug(`Processing summarize_article job ${job.id}`);
    // Similar implementation to generate_article_draft
    return { success: true, summarized: true };
  }

  @Processor('translate_article')
  async handleTranslateArticle(job: Job) {
    this.logger.debug(`Processing translate_article job ${job.id}`);
    // Similar implementation to generate_article_draft
    return { success: true, translated: true };
  }
}
