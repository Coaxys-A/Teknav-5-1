import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AiTemplatesService } from './ai-templates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller('ai-templates')
@UseGuards(JwtAuthGuard, RolesGuard, WorkspaceGuard)
export class AiTemplatesController {
  constructor(private readonly templates: AiTemplatesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER, Role.EDITOR)
  async create(@Body() body: { workspaceId: number; name: string; description?: string; type: string; parameters?: any; createdById?: number }) {
    return this.templates.createTemplate(body.workspaceId, body);
  }

  @Get()
  async list(@Query('workspaceId') workspaceId: string) {
    return this.templates.listTemplates(Number(workspaceId));
  }

  @Post(':id/run')
  async run(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { workspaceId: number; content?: string; topic?: string; keyword?: string; articleId?: number; userId?: number },
  ) {
    return this.templates.runTemplate(body.workspaceId, id, body);
  }
}
