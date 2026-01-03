import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Device Module
 *
 * Provides DeviceService.
 */

@Module({
  imports: [PrismaModule],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
