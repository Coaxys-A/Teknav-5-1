import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Device Service
 *
 * Manages UserDevice records.
 * Handles:
 * - Upsert Device on login/usage
 * - Trust/Untrust Device
 * - Get Device Risk Signals
 */

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert Device
   * Creates or updates UserDevice record.
   */
  async upsertDevice(
    userId: number,
    deviceId: string,
    ip: string,
    ua: string,
  ): Promise<any> {
    this.logger.log(`Upserting device ${deviceId} for user ${userId}`);

    return await this.prisma.userDevice.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      create: {
        userId,
        deviceId,
        ip,
        userAgent: ua,
        trusted: false,
        firstSeen: new Date(),
        lastUsed: new Date(),
      },
      update: {
        ip,
        userAgent: ua,
        lastUsed: new Date(),
      },
    });
  }

  /**
   * List Devices for User
   */
  async listDevices(userId: number): Promise<any[]> {
    return await this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
    });
  }

  /**
   * Trust Device
   */
  async trustDevice(userId: number, deviceId: string): Promise<void> {
    this.logger.log(`Trusting device ${deviceId} for user ${userId}`);

    await this.prisma.userDevice.updateMany({
      where: {
        userId,
        deviceId,
      },
      data: {
        trusted: true,
      },
    });
  }

  /**
   * Untrust Device
   */
  async untrustDevice(userId: number, deviceId: string): Promise<void> {
    this.logger.log(`Untrusting device ${deviceId} for user ${userId}`);

    await this.prisma.userDevice.updateMany({
      where: {
        userId,
        deviceId,
      },
      data: {
        trusted: false,
      },
    });
  }

  /**
   * Get Device Risk Signals
   * Returns true if device is new IP/UA compared to last session
   */
  async getDeviceRisk(
    userId: number,
    deviceId: string,
    currentIp: string,
    currentUa: string,
  ): Promise<boolean> {
    // Get device record
    const device = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });

    if (!device) {
      // New device
      return true;
    }

    // Check IP/UA mismatch
    if (device.ip !== currentIp || device.userAgent !== currentUa) {
      return true;
    }

    return false;
  }
}
