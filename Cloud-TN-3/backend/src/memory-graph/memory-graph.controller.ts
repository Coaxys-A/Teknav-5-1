import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { MemoryGraphService } from './memory-graph.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('memory')
export class MemoryGraphController {
  constructor(private readonly memory: MemoryGraphService) {}

  @Post('events')
  @UseGuards(JwtAuthGuard)
  async record(@Body() body: any, @Req() req: any) {
    return this.memory.recordEvent({
      tenantId: req?.tenantId ?? null,
      userId: req?.user?.id ?? null,
      type: body.type,
      payload: body.payload,
      nodeId: body.nodeId ?? null,
      nodeLabel: body.nodeLabel,
      nodeType: body.nodeType,
      relatedNodeId: body.relatedNodeId ?? null,
    });
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async recent(@Req() req: any) {
    return this.memory.getRecentEvents(req?.tenantId ?? null, 100);
  }
}
