import { Body, Controller, Post, Req } from '@nestjs/common';
import { UserEventsService } from './user-events.service';

@Controller('user-events')
export class UserEventsController {
  constructor(private readonly events: UserEventsService) {}

  @Post('log')
  async log(@Body() body: { eventType: string; entityType?: string; entityId?: number; context?: any; workspaceId?: number }, @Req() req: any) {
    const userId = req.user?.id;
    return this.events.logEvent({
      userId,
      workspaceId: body.workspaceId ?? req.workspaceId ?? null,
      eventType: body.eventType,
      entityType: body.entityType,
      entityId: body.entityId,
      context: body.context,
    });
  }

  @Post('recompute')
  async recompute(@Body() body: { userId?: number; workspaceId?: number }, @Req() req: any) {
    const userId = body.userId ?? req.user?.id;
    if (!userId) return { ok: false };
    const vector = await this.events.recomputeInterest(userId, body.workspaceId ?? req.workspaceId ?? undefined);
    return { ok: true, vector };
  }
}
