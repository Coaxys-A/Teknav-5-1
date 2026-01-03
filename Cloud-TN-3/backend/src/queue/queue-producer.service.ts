import { Injectable, Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bullmq';
import { QueueFactoryService } from './queue.factory.service';
import { QueueRegistryService } from './queue.registry.service';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(
    private readonly queueFactory: QueueFactoryService,
    private readonly registry: QueueRegistryService,
  ) {}

  private getQueue(type: keyof typeof this.registry.QUEUES): Queue<any> {
    return this.queueFactory.getQueueByType(type);
  }

  async enqueueAIContent(params: any) {
    const queue = this.getQueue('AI_CONTENT');
    const jobOpts: JobOptions = { jobId: `ai.content:${params.articleId}:${Date.now()}` };
    await queue.add('generate-draft', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueAISeo(params: any) {
    const queue = this.getQueue('AI_SEO');
    const jobOpts: JobOptions = { jobId: `ai.seo:${params.articleId}:${Date.now()}` };
    await queue.add('optimize-seo', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueWorkflowRun(params: any) {
    const queue = this.getQueue('WORKFLOWS');
    const jobOpts: JobOptions = { jobId: `workflow.run:${params.workflowInstanceId}:${Date.now()}` };
    await queue.add('run-workflow', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueuePluginExecution(params: any) {
    const queue = this.getQueue('PLUGINS');
    const jobOpts: JobOptions = { jobId: `plugin.execute:${params.pluginId}:${Date.now()}` };
    await queue.add('execute-plugin', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueAnalyticsSnapshot(params: any) {
    const queue = this.getQueue('ANALYTICS');
    const jobOpts: JobOptions = { jobId: `analytics.snapshot:${params.bucket}:${Date.now()}` };
    await queue.add('process-snapshot', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueArticleStatsRebuild(params: any) {
    const queue = this.getQueue('ANALYTICS');
    const jobOpts: JobOptions = { jobId: `analytics.rebuild:${Date.now()}` };
    await queue.add('rebuild-article-stats', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueEmailSend(params: any) {
    const queue = this.getQueue('EMAIL');
    const jobOpts: JobOptions = { jobId: `email.send:${params.emailLogId}:${Date.now()}` };
    await queue.add('send-email', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueOtpSend(params: any) {
    const queue = this.getQueue('OTP');
    const jobOpts: JobOptions = { jobId: `otp.send:${params.otpCodeId}:${Date.now()}` };
    await queue.add('send-otp', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueSearchIndex(params: any) {
    const queue = this.getQueue('SEARCH_INDEX');
    const jobOpts: JobOptions = { jobId: `search.index:${params.articleId}:${Date.now()}` };
    await queue.add('index-article', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueArticlePublish(params: any) {
    const queue = this.getQueue('ARTICLE_PUBLISH');
    const jobOpts: JobOptions = { jobId: `article.publish:${params.articleId}:${Date.now()}` };
    await queue.add('publish-now', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }

  async enqueueArticleAutosave(params: any) {
    const queue = this.getQueue('ARTICLE_AUTOSAVE');
    const jobOpts: JobOptions = { jobId: `article.autosave:${params.articleId}:${Date.now()}`, removeOnComplete: { count: 0, age: 3600 } } };
    await queue.add('autosave', params, jobOpts);
    return { jobId: jobOpts.jobId };
  }
}
