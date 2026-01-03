import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiRuntimeService } from './ai-runtime.service';
import { AiContentService } from './ai-content.service';
import { AiScenarioService } from './ai-scenario.service';
import { AiPluginBridgeService } from './ai-plugin-bridge.service';
import { AiToolsService } from './ai-tools.service';
import { AiMemoryService } from './ai-memory.service';
import { AiEventService } from './ai-event.service';
import { AiEmbeddingService } from './ai-embedding.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly runtime: AiRuntimeService,
    private readonly content: AiContentService,
    private readonly scenario: AiScenarioService,
    private readonly plugins: AiPluginBridgeService,
    private readonly tools: AiToolsService,
    private readonly memory: AiMemoryService,
    private readonly events: AiEventService,
    private readonly embeddings: AiEmbeddingService,
  ) {}

  @Get('agents')
  listAgents(@Query('workspaceId') workspaceId?: string) {
    return this.ai.listAgents(workspaceId ? Number(workspaceId) : undefined);
  }

  @Get('models')
  listModels() {
    return this.ai.listModels();
  }

  @Post('tasks')
  createTask(@Body() body: any) {
    return this.ai.createTask({
      workspaceId: body.workspaceId,
      tenantId: body.tenantId,
      agentId: body.agentId,
      toolId: body.toolId,
      type: body.type ?? 'generic',
      payload: body.payload ?? {},
      createdByUserId: body.userId,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      priority: body.priority,
    });
  }

  @Get('tasks/:id')
  getTask(@Param('id') id: string) {
    return this.ai.getTask(Number(id));
  }

  @Post('agents/:id/run')
  runAgent(@Param('id') id: string, @Body() body: any) {
    return this.runtime.runAgent({
      agentId: Number(id),
      workspaceId: body.workspaceId,
      tenantId: body.tenantId,
      input: body.input,
      userId: body.userId,
    });
  }

  @Post('content/analyze')
  analyzeContent(@Body() body: any) {
    return this.content.analyzeArticle(body);
  }

  @Post('scenario/generate')
  generateScenario(@Body() body: any) {
    return this.scenario.generate(body);
  }

  @Get('plugins/bindings')
  listBindings(@Query('workspaceId') workspaceId?: string) {
    return this.plugins.listBindings(workspaceId ? Number(workspaceId) : undefined);
  }

  @Post('plugins/bind')
  bindPlugin(@Body() body: any) {
    return this.plugins.bindTool({
      workspaceId: body.workspaceId,
      tenantId: body.tenantId,
      pluginId: body.pluginId,
      pluginVersionId: body.pluginVersionId,
      aiToolId: body.aiToolId,
      config: body.config,
    });
  }

  @Post('plugins/execute/:id')
  executePluginTool(@Param('id') id: string, @Body() body: any) {
    return this.plugins.executePluginTool(Number(id), body);
  }

  @Get('tools')
  listTools(@Query('workspaceId') workspaceId?: string) {
    return this.tools.listTools(workspaceId ? Number(workspaceId) : undefined);
  }

  @Get('memory')
  listMemory(@Query('workspaceId') workspaceId?: string, @Query('userId') userId?: string, @Query('scope') scope?: string) {
    return this.memory.list(workspaceId ? Number(workspaceId) : undefined, userId ? Number(userId) : undefined, scope as any);
  }

  @Post('memory')
  addMemory(@Body() body: any) {
    return this.memory.upsertMemory({
      workspaceId: body.workspaceId,
      tenantId: body.tenantId,
      userId: body.userId,
      scope: body.scope,
      source: body.source,
      content: body.content,
      tags: body.tags,
      importance: body.importance,
    });
  }

  @Post('memory/conversation')
  storeConversation(@Body() body: any) {
    return this.memory.storeConversationMemory({
      workspaceId: body.workspaceId,
      tenantId: body.tenantId,
      userId: body.userId,
      role: body.role ?? 'user',
      content: body.content,
      scope: body.scope,
    });
  }

  @Post('memory/article')
  storeArticleContext(@Body() body: any) {
    return this.memory.storeArticleContext({
      workspaceId: body.workspaceId,
      tenantId: body.tenantId,
      articleId: body.articleId,
      content: body.content,
      scope: body.scope,
    });
  }

  @Get('events')
  listEvents(
    @Query('workspaceId') workspaceId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ) {
    return (this.ai as any)['prisma']?.aiEventLog.findMany({
      where: {
        workspaceId: workspaceId ? Number(workspaceId) : undefined,
        tenantId: tenantId ? Number(tenantId) : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 100,
    });
  }

  @Post('embeddings/nodes')
  createEmbeddingNode(@Body() body: any) {
    return this.embeddings.createNode({
      label: body.label,
      type: body.type,
      tenantId: body.tenantId,
      workspaceId: body.workspaceId,
      payload: body.payload,
      contextTags: body.contextTags,
      priority: body.priority,
      decay: body.decay,
    });
  }

  @Post('embeddings/:id/embedding')
  addEmbedding(@Param('id') id: string, @Body() body: any) {
    return this.embeddings.addEmbedding({
      nodeId: Number(id),
      vector: body.vector,
      modality: body.modality,
    });
  }

  @Get('embeddings')
  listEmbeddings(@Query('tenantId') tenantId?: string, @Query('workspaceId') workspaceId?: string) {
    return this.embeddings.listNodes(tenantId ? Number(tenantId) : undefined, workspaceId ? Number(workspaceId) : undefined);
  }

  @Get('embeddings/similar')
  similarEmbeddings(
    @Query('tenantId') tenantId?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.embeddings.querySimilar({
      tenantId: tenantId ? Number(tenantId) : undefined,
      workspaceId: workspaceId ? Number(workspaceId) : undefined,
      type: type ?? undefined,
      limit: limit ? Number(limit) : undefined,
      queryText: q ?? undefined,
    });
  }

  @Get('recommendations')
  recommend(
    @Query('tenantId') tenantId?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.embeddings.querySimilar({
      tenantId: tenantId ? Number(tenantId) : undefined,
      workspaceId: workspaceId ? Number(workspaceId) : undefined,
      queryText: q ?? '',
      limit: limit ? Number(limit) : 10,
    });
  }
}
