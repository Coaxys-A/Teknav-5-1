import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OWNER)
  async list() {
    return this.agents.listAgents();
  }

  @Post('run')
  @Roles(Role.ADMIN, Role.OWNER)
  async run(@Body('key') key: string) {
    return this.agents.runAgent(key);
  }
}
