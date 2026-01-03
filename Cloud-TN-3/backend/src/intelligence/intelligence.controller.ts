import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligence: IntelligenceService) {}

  @UseGuards(JwtAuthGuard)
  @Post('ingest')
  async ingest(@Body() body: any, @Req() req: any) {
    return this.intelligence.ingestInteraction({
      tenantId: req?.tenantId ?? null,
      userId: req?.user?.id ?? null,
      type: body.type,
      payload: body.payload,
      nodeLabel: body.nodeLabel,
      nodeType: body.nodeType,
    });
  }
}
