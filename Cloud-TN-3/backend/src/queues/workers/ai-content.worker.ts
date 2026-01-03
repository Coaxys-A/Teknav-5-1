import { Injectable, Logger } from '@nestjs/common';
import { AiRuntimeService } from '../../ai/ai-runtime.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_CONTENT_JOB_TYPES, JobEnvelope } from '../queue.registry';

@Injectable()
export class AiContentWorker {
  private readonly logger = new Logger(AiContentWorker.name);

  constructor(
    private readonly aiRuntime: AiRuntimeService,
    private readonly prisma: PrismaService,
  ) {}

  async processJob(job: JobEnvelope) {
    this.logger.debug(`Processing AI content job: ${job.type}`);

    const traceId = job.traceId;
    const startTime = Date.now();

    try {
      const aiRun = await this.aiRuntime.updateAiRun({
        tenantId: job.tenantId,
        workspaceId: job.workspaceId,
        taskId: null,
        status: 'running',
        traceId,
        durationMs: 0,
        cost: null,
      });

      let result: any;

      switch (job.type) {
        case AI_CONTENT_JOB_TYPES.GENERATE_ARTICLE_DRAFT:
          result = await this.generateArticleDraft(job.payload);
          break;
        case AI_CONTENT_JOB_TYPES.REWRITE_ARTICLE:
          result = await this.rewriteArticle(job.payload);
          break;
        case AI_CONTENT_JOB_TYPES.SUMMARIZE_ARTICLE:
          result = await this.summarizeArticle(job.payload);
          break;
        default:
          throw new Error(`Unknown AI content job type: ${job.type}`);
      }

      const durationMs = Date.now() - startTime;

      await this.aiRuntime.updateAiRun({
        id: aiRun.id,
        status: 'completed',
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        durationMs,
        cost: result.cost || null,
      });

      if (job.payload.messages) {
        for (const msg of job.payload.messages) {
          await this.aiRuntime.logAiMessage({
            runId: aiRun.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          });
        }
      }

      await this.aiRuntime.logAiEvent({
        tenantId: job.tenantId,
        workspaceId: job.workspaceId,
        runId: aiRun.id,
        level: 'info',
        message: 'ai.content.completed',
        metadata: {
          traceId,
          jobType: job.type,
          durationMs,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          cost: result.cost,
          input: job.payload,
          output: result,
        },
      });

      return { success: true, result };

    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      await this.aiRuntime.updateAiRun({
        tenantId: job.tenantId,
        workspaceId: job.workspaceId,
        taskId: null,
        status: 'failed',
        traceId,
        durationMs,
        errorMessage: error.message || 'Unknown error',
      });

      await this.aiRuntime.logAiEvent({
        tenantId: job.tenantId,
        workspaceId: job.workspaceId,
        level: 'error',
        message: 'ai.content.failed',
        metadata: {
          traceId,
          jobType: job.type,
          durationMs,
          error: error.message,
          stack: error.stack,
          input: job.payload,
        },
      });

      throw error;
    }
  }

  private async generateArticleDraft(payload: any) {
    this.logger.debug('Generating article draft...');

    const mockResult = {
      promptTokens: 1500,
      completionTokens: 2500,
      totalTokens: 4000,
      cost: 0.012,
      output: {
        title: 'مقاله تولید شده',
        content: 'محتوای مقاله تولید شده...',
        excerpt: 'چکیده مقاله...',
      },
    };

    if (payload.articleId) {
      await this.prisma.aiDraft.create({
        data: {
          articleId: payload.articleId,
          title: mockResult.output.title,
          content: mockResult.output.content,
          excerpt: mockResult.output.excerpt,
        },
      });
    }

    return mockResult;
  }

  private async rewriteArticle(payload: any) {
    this.logger.debug('Rewriting article...');

    return {
      promptTokens: 1000,
      completionTokens: 2000,
      totalTokens: 3000,
      cost: 0.009,
      output: {
        content: 'محتوای بازنویسی شده...',
      },
    };
  }

  private async summarizeArticle(payload: any) {
    this.logger.debug('Summarizing article...');

    return {
      promptTokens: 800,
      completionTokens: 400,
      totalTokens: 1200,
      cost: 0.0036,
      output: {
        summary: 'چکیده مقاله...',
      },
    };
  }
}
