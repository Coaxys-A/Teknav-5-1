import { Body, Controller, Post, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { ConsentService } from '../consent/consent.service';

@Controller('events')
export class EventsController {
  constructor(private readonly analyticsService: AnalyticsService, private readonly consent: ConsentService) {}

  @Post('track')
  async track(@Body() body: TrackEventDto, @Req() req: any) {
    const userId = req.user?.id;
    if (userId) {
      const consents = await this.consent.getConsents(userId);
      const analyticsConsent = consents.find((c) => c.consentType === 'analytics');
      if (analyticsConsent && analyticsConsent.status === 'denied') {
        return { ok: true, skipped: true };
      }
    }
    await this.analyticsService.log(body.eventType, { ...body.meta, ua: req.headers['user-agent'] }, userId);
    return { ok: true, queued: true };
  }
}
