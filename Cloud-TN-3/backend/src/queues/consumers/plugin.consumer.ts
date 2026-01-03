import { Processor, ProcessError } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';

/**
 * Plugin Jobs Consumer
 * 
 * Queue: plugin
 * Job Types:
 * - execute_plugin
 * - install_plugin
 * - update_plugin
 */

@Injectable()
export class PluginConsumer {
  private readonly logger = new Logger(PluginConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @Processor('execute_plugin')
  async handleExecutePlugin(job: Job) {
    const traceId = randomUUID();
    const startTime = Date.now();
    this.logger.debug(`Processing execute_plugin job ${job.id}`);

    try {
      const data = job.data;
      const pluginId = data.pluginId;

      const plugin = await this.prisma.plugin.findUnique({
        where: { id: pluginId },
      });

      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      // Simulate plugin execution
      const mockResult = {
        success: true,
        output: 'Plugin execution result...',
      };

      const durationMs = Date.now() - startTime;

      // Write PluginExecutionLog
      await this.prisma.pluginExecutionLog.create({
        data: {
          pluginId,
          traceId,
          status: 'completed',
          durationMs,
          errorStack: null,
          input: JSON.stringify(data),
          output: JSON.stringify(mockResult),
          metadata: JSON.stringify({ ip: '127.0.0.1', ua: 'unknown' }),
        },
      });

      return mockResult;

    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      // Write PluginExecutionLog with error
      await this.prisma.pluginExecutionLog.create({
        data: {
          pluginId: job.data.pluginId,
          traceId,
          status: 'failed',
          durationMs,
          errorStack: error.stack,
          input: JSON.stringify(job.data),
          output: null,
          metadata: JSON.stringify({ error: error.message }),
        },
      });

      throw new ProcessError(error.message, error.stack);
    }
  }

  @Processor('install_plugin')
  async handleInstallPlugin(job: Job) {
    this.logger.debug(`Processing install_plugin job ${job.id}`);
    // Similar to execute_plugin
    return { success: true, installed: true };
  }

  @Processor('update_plugin')
  async handleUpdatePlugin(job: Job) {
    this.logger.debug(`Processing update_plugin job ${job.id}`);
    // Similar to execute_plugin
    return { success: true, updated: true };
  }
}
