import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { RedisModule } from '../redis';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [IdentityService],
  controllers: [IdentityController],
  exports: [IdentityService],
})
export class IdentityModule {}
