import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../../auth/session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: any = context.switchToHttp().getRequest();
    const sessionId = req.user?.sessionId ?? req.user?.sid ?? null;
    const userId = req.user?.id ?? null;
    if (!sessionId || !userId) throw new UnauthorizedException('SESSION_REQUIRED');
    const session = await this.sessions.verifySession(sessionId, userId);
    if (!session) throw new UnauthorizedException('SESSION_INVALID');
    return true;
  }
}
