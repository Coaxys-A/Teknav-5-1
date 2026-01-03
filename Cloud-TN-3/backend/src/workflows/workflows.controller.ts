import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowService } from './workflow.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly prisma: PrismaService, private readonly workflows: WorkflowService) {}

  @Get('definitions')
  async listDefinitions() {
    return (this.prisma as any).workflowDefinition.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('definitions')
  async createDefinition(@Body() dto: CreateWorkflowDto) {
    return (this.prisma as any).workflowDefinition.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        triggers: dto.triggers as any,
        steps: dto.steps as any,
        isActive: dto.isActive ?? true,
        tenantId: dto.tenantId ?? null,
        workspaceId: dto.workspaceId ?? null,
      },
    });
  }

  @Get('definitions/:key/versions')
  async listVersions(@Param('key') key: string) {
    return (this.prisma as any).workflowDefinition.findMany({
      where: { key },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('definitions/:key/graph')
  async saveGraphVersion(
    @Param('key') key: string,
    @Body()
    body: {
      name: string;
      description?: string;
      triggers: any;
      graph: any;
      steps: any[];
      versionLabel?: string;
      deploy?: boolean;
      tenantId?: number | null;
      workspaceId?: number | null;
    },
  ) {
    const versionMeta = {
      version: body.versionLabel ?? new Date().toISOString(),
      graph: body.graph,
      steps: body.steps ?? [],
    };
    const created = await (this.prisma as any).workflowDefinition.create({
      data: {
        key,
        name: body.name ?? key,
        description: body.description ?? versionMeta.version,
        triggers: body.triggers as any,
        steps: versionMeta as any,
        isActive: !!body.deploy,
        tenantId: body.tenantId ?? null,
        workspaceId: body.workspaceId ?? null,
      },
    });
    if (body.deploy) {
      await (this.prisma as any).workflowDefinition.updateMany({
        where: { key, id: { not: created.id } },
        data: { isActive: false },
      });
    }
    return created;
  }

  @Post('definitions/:id/deploy')
  async deploy(@Param('id', ParseIntPipe) id: number) {
    const def = await (this.prisma as any).workflowDefinition.findUnique({ where: { id } });
    if (!def) throw new Error('NOT_FOUND');
    await (this.prisma as any).workflowDefinition.updateMany({ where: { key: def.key }, data: { isActive: false } });
    return (this.prisma as any).workflowDefinition.update({ where: { id }, data: { isActive: true } });
  }

  @Post('definitions/:key/rollback')
  async rollback(@Param('key') key: string) {
    const versions = await (this.prisma as any).workflowDefinition.findMany({
      where: { key },
      orderBy: { createdAt: 'desc' },
    });
    if (versions.length < 2) {
      return { ok: false, message: 'No previous version' };
    }
    const target = versions[1];
    await (this.prisma as any).workflowDefinition.updateMany({ where: { key }, data: { isActive: false } });
    await (this.prisma as any).workflowDefinition.update({ where: { id: target.id }, data: { isActive: true } });
    return { ok: true, activeVersion: target.id };
  }

  @Patch('definitions/:id/toggle')
  async toggle(@Param('id', ParseIntPipe) id: number, @Body('isActive') isActive: boolean) {
    return (this.prisma as any).workflowDefinition.update({ where: { id }, data: { isActive } });
  }

  @Get('instances')
  async instances() {
    return (this.prisma as any).workflowInstance.findMany({
      orderBy: { createdAt: 'desc' },
      include: { workflow: true },
      take: 50,
    });
  }

  @Get('instances/:id/steps')
  async instanceSteps(@Param('id', ParseIntPipe) id: number) {
    return (this.prisma as any).workflowStepExecution.findMany({
      where: { instanceId: id },
      orderBy: { id: 'asc' },
    });
  }

  @Post('trigger')
  async trigger(@Body() body: { trigger: string; context: Record<string, any> }, @Req() req: any) {
    await this.workflows.start(body.trigger, body.context ?? {}, req?.tenantId ?? null);
    return { ok: true };
  }
}
