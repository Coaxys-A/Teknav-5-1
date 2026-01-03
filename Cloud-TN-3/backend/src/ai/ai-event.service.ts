import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AiEventService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async log(input: {
    tenantId?: number;
    workspaceId?: number;
    taskId?: number;
    runId?: number;
    agentId?: number;
    toolId?: number;
    traceId?: string;
    spanId?: string;
    level?: string;
    message: string;
    metadata?: any;
  }) {
    return this.prisma.aiEventLog.create({
      data: {
        tenantId: input.tenantId,
        workspaceId: input.workspaceId,
        taskId: input.taskId,
        runId: input.runId,
        agentId: input.agentId,
        toolId: input.toolId,
        traceId: input.traceId,
        spanId: input.spanId,
        level: input.level ?? 'info',
        message: input.message,
        metadata: input.metadata,
      },
    });
  }

  async logCall(input: {
    tenantId?: number;
    workspaceId?: number;
    taskId?: number;
    runId?: number;
    agentId?: number;
    toolId?: number;
    traceId?: string;
    spanId?: string;
    model?: string;
    input?: any;
    output?: any;
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    cost?: number;
    durationMs?: number;
    flags?: Record<string, any>;
  }) {
    const meta = {
      model: input.model,
      input: input.input,
      output: input.output,
      totalTokens: input.totalTokens,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      cost: input.cost,
      durationMs: input.durationMs,
      flags: input.flags,
    };
    return this.log({
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      taskId: input.taskId,
      runId: input.runId,
      agentId: input.agentId,
      toolId: input.toolId,
      traceId: input.traceId,
      spanId: input.spanId,
      level: 'info',
      message: 'ai.call',
      metadata: meta,
    });
  }

  async cacheTaskStatus(taskId: number, status: any) {
    await this.redis.set(`cache:ai:tasks:running:${taskId}`, status, 300);
    await this.redis.hset('cache:ai:tasks:running', String(taskId), status);
  }
}
