import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AiRuntimeService {
  private readonly logger = new Logger(AiRuntimeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log AI request/response to AiEventLog
   */
  async logAiEvent(params: {
    tenantId?: number | null;
    workspaceId?: number | null;
    taskId?: number | null;
    runId?: number | null;
    agentId?: number | null;
    toolId?: number | null;
    traceId?: string;
    level: 'info' | 'error';
    message: string;
    metadata?: Record<string, any>;
  }) {
    const traceId = params.traceId || randomUUID();
    const sanitizedMetadata = this.sanitizeMetadata(params.metadata);

    await this.prisma.aiEventLog.create({
      data: {
        tenantId: params.tenantId || null,
        workspaceId: params.workspaceId || null,
        taskId: params.taskId || null,
        runId: params.runId || null,
        agentId: params.agentId || null,
        toolId: params.toolId || null,
        traceId,
        level: params.level,
        message: params.message,
        metadata: sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null,
      },
    });

    this.logger.debug(`AI Event logged: ${params.message}`);
  }

  /**
   * Create or update AiRun with trace metadata
   */
  async updateAiRun(params: {
    id?: number;  // If provided, update existing run
    tenantId?: number | null;
    workspaceId?: number | null;
    taskId?: number | null;
    status: string;
    model?: string;
    provider?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    durationMs: number;
    cost?: number | null;
    traceId?: string;
    errorMessage?: string | null;
  }) {
    const traceId = params.traceId || randomUUID();
    const data: any = {
      status: params.status,
      traceId,
      ...(params.tenantId !== undefined && { tenantId: params.tenantId || null }),
      ...(params.workspaceId !== undefined && { workspaceId: params.workspaceId || null }),
      ...(params.taskId !== undefined && { taskId: params.taskId || null }),
    };

    if (params.model) data.model = params.model;
    if (params.provider) data.provider = params.provider;
    if (params.promptTokens !== undefined) data.promptTokens = params.promptTokens;
    if (params.completionTokens !== undefined) data.completionTokens = params.completionTokens;
    if (params.totalTokens !== undefined) data.totalTokens = params.totalTokens;
    if (params.durationMs !== undefined) data.durationMs = params.durationMs;
    if (params.cost !== undefined) data.cost = params.cost;
    if (params.errorMessage) data.errorMessage = params.errorMessage;

    let aiRun;
    if (params.id) {
      // Update existing run
      aiRun = await this.prisma.aiRun.update({
        where: { id: params.id },
        data,
      });
    } else {
      // Create new run
      aiRun = await this.prisma.aiRun.create({
        data: {
          ...data,
          startedAt: new Date(),
        },
      });
    }

    this.logger.debug(`AiRun ${params.id ? 'updated' : 'created'}: ${aiRun.id}`);
    return aiRun;
  }

  /**
   * Store prompt/response messages in AiMessage
   */
  async logAiMessage(params: {
    runId: number;
    role: 'user' | 'assistant' | 'system';
    content: string | Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    const sanitizedContent = typeof params.content === 'string'
      ? this.truncateText(params.content)
      : this.sanitizeMetadata(params.content);

    await this.prisma.aiMessage.create({
      data: {
        runId: params.runId,
        role: params.role,
        content: typeof sanitizedContent === 'string' ? sanitizedContent : JSON.stringify(sanitizedContent),
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    this.logger.debug(`AiMessage logged: run=${params.runId}, role=${params.role}`);
  }

  /**
   * Sanitize metadata to remove API keys and secrets
   */
  private sanitizeMetadata(metadata: Record<string, any> | null | undefined): Record<string, any> | null {
    if (!metadata) return null;

    const copy = { ...metadata };
    const secretFields = [
      'apiKey', 'apiToken', 'secretKey', 'privateKey',
      'accessToken', 'refreshToken', 'authToken', 'password',
      'openAiApiKey', 'anthropicApiKey', 'providerKey',
    ];

    // Recursively sanitize
    const sanitizeRecursive = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) {
        return obj.map(sanitizeRecursive);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (secretFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          result[key] = '***';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeRecursive(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeRecursive(copy) as Record<string, any>;
  }

  /**
   * Truncate very large texts to safe length
   */
  private truncateText(text: string, maxLength: number = 50000): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
