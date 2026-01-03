import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { OtpChannel, OtpPurpose } from '@prisma/client';

@Injectable()
export class OtpService {
  private readonly ttl: number;

  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {
    this.ttl = this.configService.get<number>('auth.otpTtlSeconds') ?? 300;
  }

  async createLoginOtp(userId: number, channel: OtpChannel = OtpChannel.EMAIL) {
    const code = this.generateCode();
    const hash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.ttl * 1000);

    await this.prisma.otpCode.create({
      data: {
        userId,
        codeHash: hash,
        purpose: OtpPurpose.LOGIN,
        channel,
        expiresAt,
      },
    });

    return { code, expiresAt };
  }

  async verifyLoginOtp(userId: number, code: string) {
    const latest = await this.prisma.otpCode.findFirst({
      where: { userId, purpose: OtpPurpose.LOGIN, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) {
      throw new UnauthorizedException('OTP_REQUIRED');
    }
    const isValid = await bcrypt.compare(code, latest.codeHash);
    if (!isValid) {
      throw new UnauthorizedException('OTP_INVALID');
    }
    await this.prisma.otpCode.update({
      where: { id: latest.id },
      data: { usedAt: new Date() },
    });
    return true;
  }

  private generateCode() {
    const n = randomInt(0, 999999);
    return n.toString().padStart(6, '0');
  }
}
