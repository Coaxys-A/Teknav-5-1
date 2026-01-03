import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessions: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? 'change_this_in_prod',
    });
  }

  async validate(payload: { sub: number; email: string; role: string; sid?: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return null;
    }
    if (payload.sid) {
      const session = await this.sessions.verifySession(payload.sid, user.id);
      if (!session) throw new UnauthorizedException('SESSION_INVALID');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionId: payload.sid,
    };
  }
}
