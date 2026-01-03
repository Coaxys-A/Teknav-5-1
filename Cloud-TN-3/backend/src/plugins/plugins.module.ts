import { Module } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PluginSandboxService } from './plugin-sandbox.service';
import { PluginExecutorService } from './plugin-executor.service';
import { PluginRateLimitService } from './rate-limit.service';
import { PluginEventDispatcherService } from './plugin-event-dispatcher.service';
import { RedisModule } from '../redis';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    PluginsService,
    PluginSandboxService,
    PluginExecutorService,
    PluginRateLimitService,
    PluginEventDispatcherService,
  ],
  controllers: [PluginsController],
  exports: [
    PluginsService,
    PluginSandboxService,
    PluginExecutorService,
    PluginRateLimitService,
    PluginEventDispatcherService,
  ],
})
export class PluginsModule {}
