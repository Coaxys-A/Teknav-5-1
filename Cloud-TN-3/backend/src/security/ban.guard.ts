import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SecurityService } from './security.service';

@Injectable()
export class BanGuard implements CanActivate {
  constructor(private readonly security: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip = (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req?.ip || 'unknown';
    await this.security.checkBan(ip);
    return true;
  }
}
