import Queue from 'bull';
import { JobRequest, JobResult, JobProgress, JobType, JobStatus, IJobQueueService } from '../types';
import { logger } from '../utils/logger';

export class JobQueueService implements IJobQueueService {
  public queues: Map<JobType, Queue.Queue> = new Map();
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.initializeQueues();
  }

  public initializeQueues(): void {
    // Créer une queue pour chaque type de job
    Object.values(JobType).forEach(jobType => {
      const queue = new Queue(jobType, this.config.redisUrl, {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        limiter: {
          max: this.config.maxConcurrentJobs,
          duration: 1000,
        },
      });

      // Gestionnaire d'erreurs
      queue.on('error', (error) => {
        logger.error(`Queue error for ${jobType}:`, error);
      });

      queue.on('failed', (job, err) => {
        logger.error(`Job failed for ${jobType}:`, { jobId: job.id, error: err.message });
      });

      queue.on('completed', (job) => {
        logger.info(`Job completed for ${jobType}:`, { jobId: job.id });
      });

      this.queues.set(jobType, queue);
    });
  }

  async addJob(jobRequest: JobRequest): Promise<string> {
    const queue = this.queues.get(jobRequest.type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${jobRequest.type}`);
    }

    const job = await queue.add(jobRequest.data, {
      jobId: jobRequest.id,
      priority: jobRequest.priority || 0,
      timeout: jobRequest.timeout || this.config.jobTimeout,
      attempts: jobRequest.retries || 3,
    });

    logger.info(`Job added to queue:`, {
      jobId: job.id,
      type: jobRequest.type,
      priority: jobRequest.priority,
    });

    return job.id.toString();
  }

  async getJob(jobType: JobType, jobId: string): Promise<any> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${jobType}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      type: jobType,
      data: job.data,
      progress: job.progress(),
      status: await this.getJobStatusFromJob(job),
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    // Chercher le job dans toutes les queues
    for (const [jobType, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        
        switch (state) {
          case 'waiting':
            return JobStatus.PENDING;
          case 'active':
            return JobStatus.RUNNING;
          case 'completed':
            return JobStatus.COMPLETED;
          case 'failed':
            return JobStatus.FAILED;
          case 'delayed':
            return JobStatus.PENDING;
          case 'paused':
            return JobStatus.CANCELLED;
          default:
            return JobStatus.PENDING;
        }
      }
    }
    
    return JobStatus.UNKNOWN;
  }

  private async getJobStatusFromJob(job: Queue.Job): Promise<JobStatus> {
    const state = await job.getState();
    
    switch (state) {
      case 'waiting':
        return JobStatus.PENDING;
      case 'active':
        return JobStatus.RUNNING;
      case 'completed':
        return JobStatus.COMPLETED;
      case 'failed':
        return JobStatus.FAILED;
      case 'delayed':
        return JobStatus.PENDING;
      case 'paused':
        return JobStatus.CANCELLED;
      default:
        return JobStatus.PENDING;
    }
  }

  async cancelJob(jobType: JobType, jobId: string): Promise<boolean> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${jobType}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return false;
    }

    await job.remove();
    logger.info(`Job cancelled:`, { jobId, type: jobType });
    return true;
  }

  async getQueueStats(jobType: JobType): Promise<any> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${jobType}`);
    }

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    return {
      type: jobType,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async getAllStats(): Promise<any> {
    const stats = [];
    for (const [jobType, queue] of this.queues) {
      const queueStats = await this.getQueueStats(jobType);
      stats.push(queueStats);
    }
    return stats;
  }

  async cleanQueues(): Promise<void> {
    for (const [jobType, queue] of this.queues) {
      await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Nettoyer les jobs complétés de plus de 24h
      await queue.clean(24 * 60 * 60 * 1000, 'failed'); // Nettoyer les jobs échoués de plus de 24h
      logger.info(`Queue cleaned: ${jobType}`);
    }
  }

  async close(): Promise<void> {
    for (const [jobType, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue closed: ${jobType}`);
    }
  }

  // Méthodes pour enregistrer les processeurs de jobs
  async registerJobProcessor(jobType: JobType, processor: (job: Queue.Job) => Promise<any>): Promise<void> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${jobType}`);
    }

    queue.process(async (job) => {
      try {
        logger.info(`Processing job:`, { jobId: job.id, type: jobType });
        const result = await processor(job);
        logger.info(`Job processed successfully:`, { jobId: job.id, type: jobType });
        return result;
      } catch (error) {
        logger.error(`Job processing failed:`, { jobId: job.id, type: jobType, error: (error as Error).message });
        throw error;
      }
    });

    logger.info(`Job processor registered for: ${jobType}`);
  }

  // Méthodes supplémentaires pour compatibilité avec l'interface
  async updateJobStatus(jobId: string, status: JobStatus, result?: any): Promise<void> {
    // Pour Bull, le statut est géré automatiquement
    logger.info(`Job status updated:`, { jobId, status });
  }

  async getJobsByType(jobType: JobType): Promise<any[]> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      return [];
    }

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    const allJobs = [...waiting, ...active, ...completed, ...failed];
    const jobsWithStatus = await Promise.all(
      allJobs.map(async (job) => ({
        id: job.id,
        type: jobType,
        status: await this.getJobStatus(job.id.toString()),
        timestamp: job.timestamp,
        priority: job.opts.priority || 0,
      }))
    );

    return jobsWithStatus;
  }

  async getStats(): Promise<any> {
    return this.getAllStats();
  }

  async clear(): Promise<void> {
    for (const [jobType, queue] of this.queues) {
      await queue.empty();
      logger.info(`Queue cleared: ${jobType}`);
    }
  }

  async processJob(jobType: JobType, jobId: string, processor: (job: any) => Promise<any>): Promise<any> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${jobType}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    return await processor(job);
  }
}
