import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const node = await this.identity.resolveIdentity(req.user.id, req?.tenantId ?? null);
    return node;
  }

  @UseGuards(JwtAuthGuard)
  @Post('persona')
  async persona(@Body() body: { label: string; tag?: string }, @Req() req: any) {
    const node = await this.identity.resolveIdentity(req.user.id, req?.tenantId ?? null);
    return this.identity.linkPersona(node.id, body.label, req?.tenantId ?? null, body.tag);
  }

  @UseGuards(JwtAuthGuard)
  @Post('trust/:id')
  async trust(@Param('id', ParseIntPipe) id: number, @Body('delta') delta: number, @Body('reason') reason: string) {
    return this.identity.updateTrust(id, delta ?? 0, reason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('graph/:id')
  async graph(@Param('id', ParseIntPipe) id: number) {
    return this.identity.getGraph(id);
  }
}
