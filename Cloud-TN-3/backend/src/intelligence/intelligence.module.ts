import { Module } from '@nestjs/common';
import { MemoryGraphModule } from '../memory-graph/memory-graph.module';
import { PersonalizationModule } from '../personalization/personalization.module';
import { IdentityModule } from '../identity/identity.module';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';

@Module({
  imports: [MemoryGraphModule, PersonalizationModule, IdentityModule],
  providers: [IntelligenceService],
  controllers: [IntelligenceController],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
