import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiRuntimeService } from './ai-runtime.service';
import { AiMemoryService } from './ai-memory.service';
import { AiToolsService } from './ai-tools.service';
import { AiPromptService } from './ai-prompt.service';
import { AiJobsService } from './ai-jobs.service';
import { AiEventService } from './ai-event.service';
import { AiPersonalizationService } from './ai-personalization.service';
import { AiScenarioService } from './ai-scenario.service';
import { AiContentService } from './ai-content.service';
import { AiPluginBridgeService } from './ai-plugin-bridge.service';
import { PrismaService } from '../prisma/prisma.service';
import { PluginsModule } from '../plugins/plugins.module';
import { AiEmbeddingService } from './ai-embedding.service';

@Module({
  imports: [PluginsModule],
  controllers: [AiController],
  providers: [
    PrismaService,
    AiService,
    AiRuntimeService,
    AiMemoryService,
    AiToolsService,
    AiPromptService,
    AiJobsService,
    AiEventService,
    AiPersonalizationService,
    AiScenarioService,
    AiContentService,
    AiPluginBridgeService,
    AiEmbeddingService,
  ],
  exports: [
    AiService,
    AiRuntimeService,
    AiMemoryService,
    AiToolsService,
    AiPromptService,
    AiJobsService,
    AiEventService,
    AiPersonalizationService,
    AiScenarioService,
    AiContentService,
    AiPluginBridgeService,
    AiEmbeddingService,
  ],
})
export class AiModule {}
