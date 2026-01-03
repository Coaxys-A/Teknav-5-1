import { Module } from '@nestjs/common';
import { OwnerAiLogsController } from './ai.controller';

@Module({
  controllers: [OwnerAiLogsController],
  exports: [],
})
export class OwnerAiModule {}
