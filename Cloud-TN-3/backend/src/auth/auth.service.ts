import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Role, User } from '@prisma/client';
import { SessionService } from './session.service';
import { OtpService } from './otp.service';
import { BruteForceService } from './bruteforce.service';
import { DeviceService } from './device.service';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly otpService: OtpService,
    private readonly bruteForce: BruteForceService,
    private readonly deviceService: DeviceService,
    private readonly logging: LoggingService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    return user;
  }

  async login(
    email: string,
    password: string,
    meta?: { ip?: string; userAgent?: string; deviceId?: string; otpCode?: string; geo?: string },
  ) {
    // Offline/seeded owner bypass (no DB needed)
    const fallbackEmail = process.env.FALLBACK_OWNER_EMAIL ?? 'arsam12sb@gmail.com';
    const fallbackPass = process.env.FALLBACK_OWNER_PASSWORD ?? 'FaR1619*';
    if (email === fallbackEmail && password === fallbackPass) {
      const payloadUser = {
        id: -1,
        email: fallbackEmail,
        role: Role.OWNER,
        name: 'Owner',
      };
      const accessToken = await this.issueAccessToken(payloadUser as any, undefined);
      await this.bruteForce.reset({ email, ip: meta?.ip });
      return {
        accessToken,
        refreshToken: null,
        sessionId: null,
        refreshExpiresAt: null,
        user: payloadUser,
      };
    }

    await this.bruteForce.checkOrThrow({ email, ip: meta?.ip });
    const user = await this.validateUser(email, password);
    if (user.otpEnabled) {
      if (!meta?.otpCode) {
        throw new BadRequestException('OTP_REQUIRED');
      }
      await this.otpService.verifyLoginOtp(user.id, meta.otpCode);
    }

    const { session, refreshToken } = await this.sessionService.createSession(user.id, meta);
    await this.deviceService.touch(user.id, meta?.deviceId, { ip: meta?.ip, userAgent: meta?.userAgent });

    const token = await this.issueAccessToken(user, session.id);
    await this.bruteForce.reset({ email, ip: meta?.ip });
    await this.logging.logSensitive('login', { userId: user.id, ip: meta?.ip, userAgent: meta?.userAgent, geo: meta?.geo });
    await this.logging.logSession('session.create', user.id, session.id, { ip: meta?.ip, userAgent: meta?.userAgent, geo: meta?.geo });
    return {
      accessToken: token,
      refreshToken,
      sessionId: session.id,
      refreshExpiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }

  async refreshSession(sessionId: string, refreshToken: string) {
    const { session, refreshToken: nextRefreshToken } = await this.sessionService.rotateSession(
      sessionId,
      refreshToken,
    );
    const user = await this.usersService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    const accessToken = await this.issueAccessToken(user, session.id);
    return {
      accessToken,
      refreshToken: nextRefreshToken,
      sessionId: session.id,
      refreshExpiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }

  async logout(sessionId: string, userId: number) {
    await this.sessionService.revokeSession(sessionId, userId);
  }

  async logoutAll(userId: number) {
    await this.sessionService.revokeAllForUser(userId);
  }

  async issueTokenForUser(user: User, sessionId?: string) {
    return this.issueAccessToken(user, sessionId);
  }

  private async issueAccessToken(user: User, sessionId?: string) {
    const payload = { sub: user.id, role: user.role, email: user.email, sid: sessionId };
    return this.jwtService.signAsync(payload);
  }

  async seedOwnerIfNeeded() {
    const owner = await this.usersService.findFirstByRole(Role.OWNER);
    if (!owner) {
      await this.usersService.ensureOwnerSeed();
    }
  }

  async issueOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const { code, expiresAt } = await this.otpService.createLoginOtp(user.id);
    if (process.env.NODE_ENV !== 'production') {
      // برای محیط توسعه در لاگ چاپ می‌کنیم.
      // eslint-disable-next-line no-console
      console.log(`OTP for ${email}: ${code} (expires at ${expiresAt.toISOString()})`);
    }
    return { success: true, expiresAt };
  }
}
