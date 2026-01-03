import { api } from '../api-client';

/**
 * Owner Queues API Client
 *
 * Functions to interact with Owner Queues endpoints.
 */

/**
 * Get queue list
 */
export async function getQueueList(): Promise<{ data: any[] }> {
  return await api.get('/owner/queues');
}

/**
 * Pause queue
 */
export async function pauseQueue(queueName: string): Promise<{ data: { message: string; queue: string } }> {
  return await api.post(`/owner/queues/${queueName}/pause`, {});
}

/**
 * Resume queue
 */
export async function resumeQueue(queueName: string): Promise<{ data: { message: string; queue: string } }> {
  return await api.post(`/owner/queues/${queueName}/resume`, {});
}

/**
 * Purge queue
 */
export async function purgeQueue(queueName: string): Promise<{ data: { message: string; queue: string } }> {
  return await api.post(`/owner/queues/${queueName}/purge`, {});
}

/**
 * Get jobs by state
 */
export async function getQueueJobs(
  queueName: string,
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
  start = 0,
  end = 50,
): Promise<{ data: any[]; state: string; total: number }> {
  return await api.get(`/owner/queues/${queueName}/jobs?state=${state}&start=${start}&end=${end}`);
}

/**
 * Get job detail
 */
export async function getQueueJob(queueName: string, jobId: string): Promise<{ data: any }> {
  return await api.get(`/owner/queues/${queueName}/jobs/${jobId}`);
}

/**
 * Retry job
 */
export async function retryQueueJob(queueName: string, jobId: string): Promise<{ data: { message: string; queue: string; jobId: string } }> {
  return await api.post(`/owner/queues/${queueName}/jobs/${jobId}/retry`, {});
}

/**
 * Remove job
 */
export async function removeQueueJob(queueName: string, jobId: string): Promise<{ data: { message: string; queue: string; jobId: string } }> {
  return await api.post(`/owner/queues/${queueName}/jobs/${jobId}/remove`, {});
}

/**
 * Get DLQ jobs
 */
export async function getDLQJobs(
  queueName: string,
  filters?: {
    page?: number;
    pageSize?: number;
    startTime?: string;
    endTime?: string;
    errorType?: string;
    jobId?: string;
  },
): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.startTime) params.set('startTime', filters.startTime);
  if (filters?.endTime) params.set('endTime', filters.endTime);
  if (filters?.errorType) params.set('errorType', filters.errorType);
  if (filters?.jobId) params.set('jobId', filters.jobId);

  return await api.get(`/owner/queues/${queueName}/dlq?${params.toString()}`);
}

/**
 * Search DLQ jobs
 */
export async function searchDLQJobs(
  queueName: string,
  query: string,
  page = 1,
  pageSize = 20,
): Promise<{ data: any[]; page: number; pageSize: number; total: number }> {
  const params = new URLSearchParams();
  params.set('q', query);
  if (page) params.set('page', page.toString());
  if (pageSize) params.set('pageSize', pageSize.toString());

  return await api.get(`/owner/queues/${queueName}/dlq/search?${params.toString()}`);
}

/**
 * Replay DLQ job
 */
export async function replayDLQJob(
  queueName: string,
  dlqJobId: string,
): Promise<{ data: { message: string; queue: string; dlqJobId: string } }> {
  return await api.post(`/owner/queues/${queueName}/dlq/replay`, {
    dlqJobId,
  });
}

/**
 * Replay DLQ batch
 */
export async function replayDLQBatch(
  queueName: string,
  dlqJobIds: string[],
): Promise<{ data: { message: string; queue: string; result: { success: number; failed: number } } }> {
  return await api.post(`/owner/queues/${queueName}/dlq/replay-batch`, {
    dlqJobIds,
  });
}

/**
 * Purge DLQ
 */
export async function purgeDLQ(queueName: string): Promise<{ data: { message: string; queue: string; count: number } }> {
  return await api.post(`/owner/queues/${queueName}/dlq/purge`, {});
}

/**
 * Delete DLQ job
 */
export async function deleteDLQJob(
  queueName: string,
  dlqJobId: string,
): Promise<{ data: { message: string; queue: string; dlqJobId: string } }> {
  return await api.post(`/owner/queues/${queueName}/dlq/delete`, {
    dlqJobId,
  });
}
