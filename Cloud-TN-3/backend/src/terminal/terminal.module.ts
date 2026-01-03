import { Module } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';
import { TerminalSessionManager } from './terminal-session.manager';
import { RedisModule } from '../redis';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [RedisModule, QueueModule],
  providers: [TerminalGateway, TerminalSessionManager],
  exports: [TerminalGateway],
})
export class TerminalModule {}
