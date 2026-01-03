import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { RagController } from '../ai/rag.controller';
import { TtsController } from './tts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ArticlesController,
    RagController,
    TtsController,
  ],
  providers: [],
  exports: [],
})
export class ArticlesModule {}
