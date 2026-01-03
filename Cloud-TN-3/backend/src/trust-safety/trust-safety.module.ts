import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrustSafetyService } from './trust-safety.service';
import { TrustSafetyController } from './trust-safety.controller';

@Module({
  imports: [PrismaModule],
  providers: [TrustSafetyService],
  controllers: [TrustSafetyController],
  exports: [TrustSafetyService],
})
export class TrustSafetyModule {}
