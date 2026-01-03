import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowsController } from './workflows.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowRegistry } from './workflow.registry';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiModule } from '../ai/ai.module';
import { QueueModule } from '../queue/queue.module';
import { AuditModule } from '../audit/audit.module';
import { SearchModule } from '../search/search.module';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [PrismaModule, NotificationsModule, AiModule, forwardRef(() => QueueModule), AuditModule, SearchModule],
  controllers: [WorkflowsController],
  providers: [WorkflowService, WorkflowRegistry, OrchestratorService],
  exports: [WorkflowService, OrchestratorService],
})
export class WorkflowsModule {}
