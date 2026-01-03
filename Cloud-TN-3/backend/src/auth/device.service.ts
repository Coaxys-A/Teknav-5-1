import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async touch(userId: number, deviceId: string | undefined, meta: { userAgent?: string; ip?: string }) {
    if (!deviceId) return;
    await this.prisma.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: {
        userId,
        deviceId,
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip?.slice(0, 255),
        trusted: false,
      },
      update: {
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip?.slice(0, 255),
        lastUsed: new Date(),
      },
    });
  }
}
