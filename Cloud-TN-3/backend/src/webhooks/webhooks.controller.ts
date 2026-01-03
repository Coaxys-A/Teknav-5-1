import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER)
  async create(@Body() body: { workspaceId: number; url: string; secret?: string; events?: string[] }) {
    return this.webhooks.createEndpoint(body.workspaceId, body);
  }

  @Get()
  async list(@Query('workspaceId') workspaceId: string) {
    return this.webhooks.listEndpoints(Number(workspaceId));
  }
}
