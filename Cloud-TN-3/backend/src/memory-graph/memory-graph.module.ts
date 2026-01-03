import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MemoryGraphService } from './memory-graph.service';
import { MemoryGraphController } from './memory-graph.controller';
import { MemoryGraphJobs } from './memory-graph.jobs';

@Module({
  imports: [PrismaModule],
  providers: [MemoryGraphService, MemoryGraphJobs],
  controllers: [MemoryGraphController],
  exports: [MemoryGraphService],
})
export class MemoryGraphModule {}
