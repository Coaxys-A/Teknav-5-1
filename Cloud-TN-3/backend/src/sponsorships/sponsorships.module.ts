import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SponsorshipsService } from './sponsorships.service';
import { SponsorshipsController } from './sponsorships.controller';
import { AuditModule } from '../audit/audit.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [PrismaModule, AuditModule, WorkflowsModule],
  providers: [SponsorshipsService],
  controllers: [SponsorshipsController],
  exports: [SponsorshipsService],
})
export class SponsorshipsModule {}
