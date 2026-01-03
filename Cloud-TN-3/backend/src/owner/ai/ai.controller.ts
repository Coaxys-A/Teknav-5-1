import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AiRuntimeService } from '../../ai/ai-runtime.service';
import { CacheService } from '../../redis/cache.service';

@Controller('owner/ai')
export class OwnerAiLogsController {
  constructor(
    private readonly aiRuntime: AiRuntimeService,
    private readonly cache: CacheService,
    private readonly prisma: any,
  ) {}

  @Get('event-logs')
  @HttpCode(HttpStatus.OK)
  async eventLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('level') level?: string,
    @Query('message') message?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const cacheKey = this.cache.buildVersionedKey('owner:ai:event-logs:list');
    const skip = page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 20) : 0;

    const query: any = {};
    if (workspaceId) query.workspaceId = parseInt(workspaceId);
    if (tenantId) query.tenantId = parseInt(tenantId);
    if (level) query.level = level;
    if (message) query.message = { contains: message };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.gte = new Date(from);
      if (to) query.createdAt.lte = new Date(to);
    }

    return await this.cache.cacheWrap(
      cacheKey,
      30, // 30s TTL
      async () => {
        const [logs, total] = await Promise.all([
          this.prisma.aiEventLog.findMany({
            where: query,
            skip,
            take: limit ? parseInt(limit) : 20,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.aiEventLog.count({ where: query }),
        ]);
        return { data: logs, meta: { total, page, limit } };
      },
    );
  }

  @Get('runs')
  @HttpCode(HttpStatus.OK)
  async runs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const cacheKey = this.cache.buildVersionedKey('owner:ai:runs:list');
    const skip = page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 20) : 0;

    const query: any = {};
    if (status) query.status = status;

    return await this.cache.cacheWrap(
      cacheKey,
      30, // 30s TTL
      async () => {
        const [runs, total] = await Promise.all([
          this.prisma.aiRun.findMany({
            where: query,
            skip,
            take: limit ? parseInt(limit) : 20,
            orderBy: { startedAt: 'desc' },
          }),
          this.prisma.aiRun.count({ where: query }),
        ]);
        return { data: runs, meta: { total, page, limit } };
      },
    );
  }

  @Get('tasks')
  @HttpCode(HttpStatus.OK)
  async tasks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const cacheKey = this.cache.buildVersionedKey('owner:ai:tasks:list');
    const skip = page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 20) : 0;

    const query: any = {};
    if (status) query.status = status;

    return await this.cache.cacheWrap(
      cacheKey,
      30, // 30s TTL
      async () => {
        const [tasks, total] = await Promise.all([
          this.prisma.aiTask.findMany({
            where: query,
            skip,
            take: limit ? parseInt(limit) : 20,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.aiTask.count({ where: query }),
        ]);
        return { data: tasks, meta: { total, page, limit } };
      },
    );
  }

  @Get('messages')
  @HttpCode(HttpStatus.OK)
  async messages(
    @Query('runId') runId?: string,
    @Query('taskId') taskId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const skip = page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 20) : 0;
    const query: any = {};
    if (runId) query.runId = parseInt(runId);
    if (taskId) query.taskId = parseInt(taskId);

    const [messages, total] = await Promise.all([
      this.prisma.aiMessage.findMany({
        where: query,
        skip,
        take: limit ? parseInt(limit) : 20,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.aiMessage.count({ where: query }),
    ]);

    return { data: messages, meta: { total, page, limit } };
  }
}
