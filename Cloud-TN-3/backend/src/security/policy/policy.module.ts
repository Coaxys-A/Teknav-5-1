import { Module } from '@nestjs/common';
import { PolicyEngineService } from './policy.engine.service';
import { PolicyRulesService } from './policy.rules.service';
import { PolicyGuard } from './policy.guard';
import { PolicyInterceptor } from './policy.interceptor';
import { RedisModule } from '../../redis/redis.module';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Policy Module
 *
 * Provides:
 * - Policy Engine Service
 * - Policy Rules Service
 * - Policy Guard
 * - Policy Interceptor
 */

@Module({
  imports: [RedisModule, PrismaModule],
  providers: [
    PolicyEngineService,
    PolicyRulesService,
    PolicyGuard,
    PolicyInterceptor,
  ],
  exports: [
    PolicyEngineService,
    PolicyRulesService,
    PolicyGuard,
    PolicyInterceptor,
  ],
})
export class PolicyModule {}
