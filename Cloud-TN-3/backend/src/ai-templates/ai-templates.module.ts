import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiTemplatesService } from './ai-templates.service';
import { AiTemplatesController } from './ai-templates.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [AiTemplatesService],
  controllers: [AiTemplatesController],
  exports: [AiTemplatesService],
})
export class AiTemplatesModule {}
