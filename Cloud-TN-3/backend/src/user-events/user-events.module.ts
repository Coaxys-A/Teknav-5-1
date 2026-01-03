import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserEventsService } from './user-events.service';
import { UserEventsController } from './user-events.controller';
import { TopicsModule } from '../topics/topics.module';
import { MemoryGraphModule } from '../memory-graph/memory-graph.module';
import { PersonalizationModule } from '../personalization/personalization.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [PrismaModule, TopicsModule, MemoryGraphModule, PersonalizationModule, IdentityModule],
  providers: [UserEventsService],
  controllers: [UserEventsController],
  exports: [UserEventsService],
})
export class UserEventsModule {}
