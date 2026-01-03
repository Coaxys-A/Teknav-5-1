import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaces: WorkspaceService) {}

  @Get()
  async list(@Req() req: any) {
    return this.workspaces.listWorkspaces(req.user.id);
  }

  @Post()
  async create(@Req() req: any, @Body() body: { name: string; slug: string; description?: string }) {
    return this.workspaces.createWorkspace(req.user.id, body);
  }
}
