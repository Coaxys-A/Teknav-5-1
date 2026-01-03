import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import {
  QUEUE_NAMES,
  QUEUE_CONFIGS,
  QueueName,
  QUEUE_STATS_KEYS,
} from './contracts';

/**
 * Queue Monitor Service
 *
 * Provides advanced monitoring:
 * - Real-time queue metrics
 * - Worker health monitoring
 * - Performance analytics
 * - Alert triggering
 */

export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  throughput: number; // jobs/minute
  avgProcessingTime: number; // ms
  successRate: number; // percentage
  errorRate: number; // percentage
  timestamp: number;
}

export interface WorkerStats {
  queueName: string;
  workerId: string;
  active: boolean;
  processingCount: number;
  totalProcessed: number;
  avgProcessingTime: number;
  successCount: number;
  failCount: number;
  timestamp: number;
}

export interface QueueHealth {
  queueName: string;
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class QueueMonitorService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueMonitorService.name);
  private readonly queueMetrics = new Map<string, QueueMetrics>();
  private readonly workerStats = new Map<string, WorkerStats>();
  private readonly queueEvents = new Map<string, QueueEvents>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly processingTimes = new Map<string, number[]>();

  constructor(
    private readonly queueFactory: any, // QueueFactoryService
    private readonly redis: RedisService,
  ) {}

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async onModuleInit() {
    await this.setupQueueMonitoring();
  }

  private async setupQueueMonitoring() {
    const queueNames: QueueName[] = [
      QUEUE_NAMES.AI,
      QUEUE_NAMES.WORKFLOWS,
      QUEUE_NAMES.ANALYTICS,
      QUEUE_NAMES.EMAIL,
      QUEUE_NAMES.PLUGINS,
      QUEUE_NAMES.SYSTEM,
    ];

    for (const queueName of queueNames) {
      await this.monitorQueue(queueName);
    }

    // Start metrics refresh interval
    this.startMetricsRefresh();
  }

  /**
   * Monitor a queue
   */
  private async monitorQueue(queueName: QueueName) {
    const queue = this.queueFactory.getQueue(queueName);
    const queueEvents = new QueueEvents(queue);

    this.queueEvents.set(queueName, queueEvents);

    // Setup event listeners
    queueEvents.on('waiting', async ({ jobId }) => {
      await this.recordJobEvent(queueName, 'waiting', jobId);
    });

    queueEvents.on('active', async ({ jobId, prev }) => {
      if (prev === 'waiting') {
        await this.recordJobStart(queueName, jobId);
      }
    });

    queueEvents.on('completed', async ({ jobId, returnvalue }) => {
      await this.recordJobCompletion(queueName, jobId);
      await this.recordJobSuccess(queueName, jobId);
    });

    queueEvents.on('failed', async ({ jobId, failedReason }) => {
      await this.recordJobFailure(queueName, jobId, failedReason);
    });

    queueEvents.on('stalled', async ({ jobId }) => {
      await this.recordJobStalled(queueName, jobId);
    });

    queueEvents.on('progress', async ({ jobId, data }) => {
      await this.recordJobProgress(queueName, jobId, data);
    });

    queueEvents.on('delayed', async ({ jobId, delay }) => {
      await this.recordJobDelayed(queueName, jobId, delay);
    });

    queueEvents.on('error', async (error) => {
      this.logger.error(`Queue ${queueName} error:`, error);
      await this.triggerAlert(queueName, 'error', error.message);
    });

    this.logger.log(`Started monitoring queue: ${queueName}`);
  }

  // ==========================================================================
  // JOB EVENT RECORDING
  // ==========================================================================

  private async recordJobEvent(
    queueName: string,
    eventType: string,
    jobId: string,
  ) {
    const key = `q:events:${queueName}:${jobId}`;
    const event = {
      type: eventType,
      ts: Date.now(),
    };

    await this.redis.set(key, JSON.stringify(event), 86400); // 24 hours
  }

  private async recordJobStart(queueName: string, jobId: string) {
    const key = `q:job:start:${queueName}:${jobId}`;
    await this.redis.set(key, Date.now().toString(), 3600); // 1 hour
  }

  private async recordJobCompletion(queueName: string, jobId: string) {
    const startKey = `q:job:start:${queueName}:${jobId}`;
    const startTime = await this.redis.get(startKey);

    if (startTime) {
      const processingTime = Date.now() - parseInt(startTime);
      await this.recordProcessingTime(queueName, processingTime);
      await this.redis.del(startKey);
    }
  }

  private async recordJobSuccess(queueName: string, jobId: string) {
    const key = `q:job:success:${queueName}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // 24 hours
  }

  private async recordJobFailure(queueName: string, jobId: string, reason?: string) {
    const key = `q:job:fail:${queueName}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // 24 hours

    // Record failure reason for analysis
    const failReasonKey = `q:job:fail:reason:${queueName}:${Date.now()}`;
    await this.redis.set(failReasonKey, reason || 'Unknown', 86400);
  }

  private async recordJobStalled(queueName: string, jobId: string) {
    const key = `q:job:stalled:${queueName}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 3600); // 1 hour

    await this.triggerAlert(queueName, 'stalled', `Job ${jobId} stalled`);
  }

  private async recordJobProgress(queueName: string, jobId: string, progress: any) {
    const key = `q:job:progress:${queueName}:${jobId}`;
    await this.redis.set(key, JSON.stringify(progress), 3600);
  }

  private async recordJobDelayed(queueName: string, jobId: string, delay: number) {
    const key = `q:job:delayed:${queueName}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 3600); // 1 hour
  }

  /**
   * Record processing time for analytics
   */
  private async recordProcessingTime(queueName: string, processingTime: number) {
    const key = `q:processing_times:${queueName}`;
    const times = this.processingTimes.get(queueName) || [];

    times.push(processingTime);

    // Keep only last 1000 processing times
    if (times.length > 1000) {
      times.shift();
    }

    this.processingTimes.set(queueName, times);

    // Calculate average
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;

    // Store in Redis
    await this.redis.set(`${key}:avg`, avg.toString(), 300); // 5 minutes
  }

  // ==========================================================================
  // METRICS COLLECTION
  // ==========================================================================

  /**
   * Collect queue metrics
   */
  async collectQueueMetrics(queueName: QueueName): Promise<QueueMetrics> {
    const queue = this.queueFactory.getQueue(queueName);

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    // Calculate throughput (jobs/minute over last 5 minutes)
    const throughput = await this.calculateThroughput(queueName);

    // Calculate average processing time
    const avgProcessingTime = await this.calculateAvgProcessingTime(queueName);

    // Calculate success rate
    const successCount = parseInt((await this.redis.get(`q:job:success:${queueName}`)) || '0');
    const failCount = parseInt((await this.redis.get(`q:job:fail:${queueName}`)) || '0');
    const total = successCount + failCount;
    const successRate = total > 0 ? (successCount / total) * 100 : 100;
    const errorRate = total > 0 ? (failCount / total) * 100 : 0;

    const metrics: QueueMetrics = {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      throughput,
      avgProcessingTime,
      successRate,
      errorRate,
      timestamp: Date.now(),
    };

    this.queueMetrics.set(queueName, metrics);

    // Cache in Redis
    const cacheKey = QUEUE_STATS_KEYS.STATS(queueName);
    await this.redis.set(cacheKey, JSON.stringify(metrics), 10);

    return metrics;
  }

  /**
   * Calculate throughput (jobs/minute)
   */
  private async calculateThroughput(queueName: string): Promise<number> {
    const key = `q:throughput:${queueName}`;
    const cacheKey = `${key}:current`;

    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return parseFloat(cached);
    }

    // Calculate from completed count over last 5 minutes
    // This is a simplified calculation - in production, you'd use a sliding window
    const completed = await this.queueFactory.getQueue(queueName).then(q => q.getCompletedCount());
    const throughput = Math.floor(completed / 5); // rough estimate

    await this.redis.set(cacheKey, throughput.toString(), 60);

    return throughput;
  }

  /**
   * Calculate average processing time
   */
  private async calculateAvgProcessingTime(queueName: string): Promise<number> {
    const key = `q:processing_times:${queueName}:avg`;
    const cached = await this.redis.get(key);

    if (cached) {
      return parseFloat(cached);
    }

    return 0;
  }

  /**
   * Start metrics refresh interval
   */
  private startMetricsRefresh() {
    // Refresh metrics every 10 seconds
    const interval = setInterval(async () => {
      await this.refreshAllMetrics();
    }, 10000);

    this.timers.set('metrics_refresh', interval);

    this.logger.log('Started metrics refresh interval');
  }

  /**
   * Refresh all queue metrics
   */
  private async refreshAllMetrics() {
    const queueNames: QueueName[] = [
      QUEUE_NAMES.AI,
      QUEUE_NAMES.WORKFLOWS,
      QUEUE_NAMES.ANALYTICS,
      QUEUE_NAMES.EMAIL,
      QUEUE_NAMES.PLUGINS,
      QUEUE_NAMES.SYSTEM,
    ];

    await Promise.all(
      queueNames.map(async (queueName) => {
        try {
          await this.collectQueueMetrics(queueName);
        } catch (error) {
          this.logger.error(`Failed to collect metrics for ${queueName}:`, error);
        }
      }),
    );

    // Calculate queue health
    await this.calculateQueueHealth();
  }

  // ==========================================================================
  // QUEUE HEALTH ASSESSMENT
  // ==========================================================================

  /**
   * Calculate queue health
   */
  async calculateQueueHealth(): Promise<void> {
    const queueNames = Object.keys(this.queueMetrics);

    for (const queueName of queueNames) {
      const metrics = this.queueMetrics.get(queueName);
      if (!metrics) continue;

      const health = this.assessQueueHealth(metrics);

      // Cache health status
      const healthKey = `q:health:${queueName}`;
      await this.redis.set(healthKey, JSON.stringify(health), 60);

      // Trigger alerts if critical
      if (health.status === 'critical') {
        await this.triggerAlert(
          queueName as QueueName,
          'critical',
          `Queue health critical: ${health.issues.join(', ')}`,
        );
      }
    }
  }

  /**
   * Assess queue health based on metrics
   */
  private assessQueueHealth(metrics: QueueMetrics): QueueHealth {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check waiting jobs count
    if (metrics.waiting > 1000) {
      score -= 20;
      issues.push('High number of waiting jobs');
      recommendations.push('Consider increasing worker concurrency');
    } else if (metrics.waiting > 500) {
      scale -= 10;
      issues.push('Moderate number of waiting jobs');
    }

    // Check failed jobs count
    if (metrics.failed > 100) {
      score -= 30;
      issues.push('High number of failed jobs');
      recommendations.push('Check DLQ and error logs');
    } else if (metrics.failed > 50) {
      score -= 15;
      issues.push('Moderate number of failed jobs');
    }

    // Check error rate
    if (metrics.errorRate > 10) {
      score -= 25;
      issues.push('High error rate');
      recommendations.push('Investigate common error patterns');
    } else if (metrics.errorRate > 5) {
      score -= 10;
      issues.push('Elevated error rate');
    }

    // Check success rate
    if (metrics.successRate < 90) {
      score -= 20;
      issues.push('Low success rate');
      recommendations.push('Review job logic and error handling');
    }

    // Check processing time
    if (metrics.avgProcessingTime > 60000) {
      score -= 15;
      issues.push('High average processing time');
      recommendations.push('Optimize job logic or increase timeout');
    }

    // Check if queue is paused
    if (metrics.paused) {
      score -= 10;
      issues.push('Queue is paused');
      recommendations.push('Resume queue if needed');
    }

    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 70) {
      status = 'healthy';
    } else if (score >= 40) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      queueName: metrics.queueName,
      status,
      score,
      issues,
      recommendations,
    };
  }

  // ==========================================================================
  // WORKER MONITORING
  // ==========================================================================

  /**
   * Get worker stats
   */
  async getWorkerStats(queueName: QueueName): Promise<WorkerStats[]> {
    // Get active jobs to infer worker count
    const queue = this.queueFactory.getQueue(queueName);
    const activeJobs = await queue.getActiveCount();

    // In a real implementation, you'd query each worker directly
    // For now, return aggregated stats
    const stats: WorkerStats[] = [];

    if (activeJobs > 0) {
      stats.push({
        queueName,
        workerId: 'worker-1',
        active: true,
        processingCount: activeJobs,
        totalProcessed: 0,
        avgProcessingTime: await this.calculateAvgProcessingTime(queueName),
        successCount: parseInt((await this.redis.get(`q:job:success:${queueName}`)) || '0'),
        failCount: parseInt((await this.redis.get(`q:job:fail:${queueName}`)) || '0'),
        timestamp: Date.now(),
      });
    }

    this.workerStats.set(queueName, stats[0]);

    return stats;
  }

  // ==========================================================================
  // ALERTING
  // ==========================================================================

  /**
   * Trigger alert
   */
  private async triggerAlert(
    queueName: QueueName,
    severity: 'warning' | 'error' | 'critical',
    message: string,
  ) {
    const alert = {
      type: 'queue.alert',
      queue: queueName,
      severity,
      message,
      ts: Date.now(),
    };

    // Publish to Redis pub/sub
    await this.redis.set(
      `pubsub:teknav:queues:alerts:latest`,
      JSON.stringify(alert),
      300,
    );

    // In production, you'd send to notification service
    this.logger.warn(`Queue Alert [${severity}] ${queueName}: ${message}`);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Get all queue metrics
   */
  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];

    for (const [queueName, queueMetrics] of this.queueMetrics.entries()) {
      metrics.push(queueMetrics);
    }

    return metrics;
  }

  /**
   * Get queue metrics by name
   */
  async getQueueMetrics(queueName: QueueName): Promise<QueueMetrics | null> {
    return this.queueMetrics.get(queueName) || null;
  }

  /**
   * Get queue health
   */
  async getQueueHealth(queueName: QueueName): Promise<QueueHealth | null> {
    const healthKey = `q:health:${queueName}`;
    const cached = await this.redis.get(healthKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Get all queue health
   */
  async getAllQueueHealth(): Promise<QueueHealth[]> {
    const health: QueueHealth[] = [];
    const queueNames: QueueName[] = [
      QUEUE_NAMES.AI,
      QUEUE_NAMES.WORKFLOWS,
      QUEUE_NAMES.ANALYTICS,
      QUEUE_NAMES.EMAIL,
      QUEUE_NAMES.PLUGINS,
      QUEUE_NAMES.SYSTEM,
    ];

    for (const queueName of queueNames) {
      const queueHealth = await this.getQueueHealth(queueName);
      if (queueHealth) {
        health.push(queueHealth);
      }
    }

    return health;
  }

  /**
   * Get processing times history
   */
  async getProcessingTimesHistory(
    queueName: QueueName,
    limit = 100,
  ): Promise<number[]> {
    const times = this.processingTimes.get(queueName) || [];
    return times.slice(-limit);
  }

  /**
   * Get failure reasons
   */
  async getFailureReasons(
    queueName: QueueName,
    limit = 50,
  ): Promise<string[]> {
    const pattern = `q:job:fail:reason:${queueName}:*`;
    const keys = await this.redis.scanKeys(pattern);

    const reasons: string[] = [];
    for (const key of keys.slice(0, limit)) {
      const reason = await this.redis.get(key);
      if (reason) {
        reasons.push(reason);
      }
    }

    return reasons;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  async onModuleDestroy() {
    // Stop timers
    for (const [name, timer] of this.timers.entries()) {
      clearInterval(timer);
      this.logger.debug(`Stopped timer: ${name}`);
    }

    // Close queue events
    for (const [name, queueEvents] of this.queueEvents.entries()) {
      await queueEvents.close();
      this.logger.debug(`Closed queue events: ${name}`);
    }

    this.queueEvents.clear();
    this.queueMetrics.clear();
    this.workerStats.clear();
    this.processingTimes.clear();
    this.timers.clear();
  }
}
