import { Module } from '@nestjs/common';
import { OwnerWorkflowsController } from './workflows.controller';

@Module({
  controllers: [OwnerWorkflowsController],
  exports: [],
})
export class OwnerWorkflowsOwnerModule {}
