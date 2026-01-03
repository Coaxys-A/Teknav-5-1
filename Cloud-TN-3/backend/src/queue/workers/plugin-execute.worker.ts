import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessError } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PluginSandboxService } from '../../../plugins/plugin-sandbox.service';
import { AuditLogService } from '../../../logging/audit-log.service';

/**
 * Plugin Execute Worker
 */

@Injectable()
export class PluginExecuteWorker {
  private readonly logger = new Logger(PluginExecuteWorker.name);

  constructor(
    private readonly pluginSandbox: PluginSandboxService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Processor('execute-plugin')
  async handleExecutePlugin(job: Job) {
    this.logger.debug(`Processing plugin execution job: ${job.id}`);
    const data = job.data;

    try {
      const result = await this.pluginSandbox.execute({
        pluginId: data.pluginId,
        workspaceId: data.workspaceId,
        eventType: data.eventType,
        payload: data.payload,
      });

      await this.auditLog.logAction({
        actorId: 0,
        action: 'plugin.executed',
        resource: 'PluginExecution',
        payload: { pluginId: data.pluginId },
        ip: '127.0.0.1',
        ua: 'BullMQ Worker',
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to execute plugin:`, error);
      throw new ProcessError(error.message, error.stack);
    }
  }
}
