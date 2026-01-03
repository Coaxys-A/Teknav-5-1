import { Module } from '@nestjs/common';
import { PublishService } from './publish.service';
import { PublishController } from './publish.controller';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [PublishService],
  controllers: [PublishController],
  exports: [PublishService],
})
export class PublishModule {}
