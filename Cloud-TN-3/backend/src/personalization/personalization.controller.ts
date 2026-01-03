import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PersonalizationService } from './personalization.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('personalization')
export class PersonalizationController {
  constructor(private readonly personalization: PersonalizationService) {}

  @UseGuards(JwtAuthGuard)
  @Get('state')
  async state(@Req() req: any) {
    const userId = req.user?.id;
    const tenantId = req.tenantId ?? null;
    return {
      preferences: await this.personalization.getPreferences(userId, tenantId),
      realtime: await this.personalization.getRealtimeState(userId, tenantId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('events')
  async event(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id;
    const tenantId = req.tenantId ?? null;
    if (body.type === 'preference') {
      return this.personalization.updatePreferences(userId, tenantId, body.delta ?? {});
    }
    if (body.type === 'state') {
      return this.personalization.updateRealtimeState(userId, tenantId, body.state ?? {});
    }
    if (body.type === 'fingerprint' && body.hash) {
      await this.personalization.updateFingerprint(userId, tenantId, body.hash, body.meta ?? {});
      return { ok: true };
    }
    return { ok: true };
  }
}
