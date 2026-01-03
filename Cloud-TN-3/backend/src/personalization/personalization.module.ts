import { Module } from '@nestjs/common';
import { RedisModule } from '../redis';
import { PersonalizationService } from './personalization.service';
import { PersonalizationController } from './personalization.controller';
import { MemoryGraphModule } from '../memory-graph/memory-graph.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [RedisModule, MemoryGraphModule, PrismaModule],
  providers: [PersonalizationService],
  controllers: [PersonalizationController],
  exports: [PersonalizationService],
})
export class PersonalizationModule {}
