import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiValidationService } from './ai-validation.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiQueueService } from './ai-queue.service';
import { AiWorker } from './ai.worker';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AiValidationService, AiQueueService, AiWorker, RateLimitGuard],
  controllers: [AiController],
  exports: [AiValidationService, AiQueueService],
})
export class AiValidationModule {}
