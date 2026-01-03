import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiValidationModule } from '../ai-validation/ai-validation.module';
import { SeoModule } from '../seo/seo.module';
import { WorkflowService } from '../workflows/workflow.service';
import { WorkflowRegistry } from '../workflows/workflow.registry';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [PrismaModule, AiValidationModule, SeoModule, WorkflowsModule],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
