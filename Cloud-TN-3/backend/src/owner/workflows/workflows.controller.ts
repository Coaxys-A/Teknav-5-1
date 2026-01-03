import { Controller, Get, Post, Param, HttpCode, HttpStatus, Query, Body } from '@nestjs/common';
import { WorkflowRunnerService } from '../../workflows/workflow-runner.service';
import { CacheService } from '../../redis/cache.service';
import { AuditLogService } from '../../logging/audit-log.service';
import { DataAccessLogService } from '../../logging/data-access-log.service';

@Controller('owner/workflows')
export class OwnerWorkflowsController {
  constructor(
    private readonly workflowRunner: WorkflowRunnerService,
    private readonly cache: CacheService,
    private readonly auditLog: AuditLogService,
    private readonly dataAccessLog: DataAccessLogService,
    private readonly prisma: any,
  ) {}

  @Get('instances')
  @HttpCode(HttpStatus.OK)
  async instances(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('workflowId') workflowId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const cacheKey = this.cache.buildVersionedKey('owner:workflows:instances:list');
    const skip = page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 20) : 0;

    const query: any = {};
    if (workflowId) query.workflowDefinitionId = parseInt(workflowId);
    if (status) query.status = status;
    if (from || to) {
      const dateRange: any = {};
      if (from) dateRange.gte = new Date(from);
      if (to) dateRange.lte = new Date(to);
      query.startedAt = dateRange;
    }

    return await this.cache.cacheWrap(
      cacheKey,
      30, // 30s TTL
      async () => {
        const [instances, total] = await Promise.all([
          this.prisma.workflowInstance.findMany({
            where: query,
            skip,
            take: limit ? parseInt(limit) : 20,
            orderBy: { startedAt: 'desc' },
            include: {
              workflowDefinition: {
                select: { id: true, name: true, description: true },
              },
              actorUser: {
                select: { id: true, name: true, email: true },
              },
              _count: {
                select: { steps: true },
              },
            },
          }),
          this.prisma.workflowInstance.count({ where: query }),
        ]);
        return { data: instances, meta: { total, page, limit } };
      },
    );
  }

  @Get('instances/:id')
  @HttpCode(HttpStatus.OK)
  async instanceDetails(
    @Param('id') id: string,
    @Query('actorId') actorId?: string,
  ) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: parseInt(id) },
      include: {
        workflowDefinition: true,
        actorUser: {
          select: { id: true, name: true, email: true },
        },
        stepExecutions: {
          orderBy: { startedAt: 'asc' },
          include: {
            step: {
              select: { id: true, type: true, name: true, config: true },
            },
          },
        },
      },
    });

    if (!instance) {
      throw new Error(`Workflow instance not found: ${id}`);
    }

    // Log data access
    if (actorId) {
      await this.dataAccessLog.logAccess({
        userId: parseInt(id),
        actorUserId: parseInt(actorId),
        action: 'owner.read.workflow_instance',
        targetType: 'WorkflowInstance',
        targetId: instance.id,
        metadata: {
          workflowDefinitionId: instance.workflowDefinitionId,
          status: instance.status,
          stepsCount: instance.stepExecutions.length,
        },
      });
    }

    return { data: instance };
  }

  @Post(':id/run')
  @HttpCode(HttpStatus.OK)
  async runWorkflow(
    @Param('id') id: string,
    @Body() body: { input?: Record<string, any>; tenantId?: number; workspaceId?: number },
  ) {
    const actorId = body.actorId || 1; // In real implementation, from auth context

    // Execute workflow
    const instance = await this.workflowRunner.executeWorkflow({
      workflowId: parseInt(id),
      actorId,
      tenantId: body.tenantId,
      workspaceId: body.workspaceId,
      input: body.input,
    });

    // Log audit event
    await this.auditLog.logAction({
      actorId,
      action: 'owner.workflow.run',
      resource: 'WorkflowInstance',
      payload: {
        workflowDefinitionId: parseInt(id),
        instanceId: instance.id,
        input: body.input,
      },
      ip: '127.0.0.1', // In real implementation, from request
      ua: 'unknown', // In real implementation, from request
    });

    return { data: instance };
  }
}
