import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { RedisModule } from '../redis';
import { PolicyGuard } from './policy.guard';
import { APP_GUARD } from '@nestjs/core';
import { RbacAuditInterceptor } from './rbac.audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    RbacService,
    {
      provide: APP_GUARD,
      useClass: PolicyGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RbacAuditInterceptor,
    },
  ],
  controllers: [RbacController],
  exports: [RbacService],
})
export class RbacModule {}
