import { JobRequest, JobResult, JobProgress, JobType, JobStatus, IJobQueueService } from '../types';
import { logger } from '../utils/logger';

export class SimpleJobQueueService implements IJobQueueService {
  private jobs: Map<string, any> = new Map();
  private config: any;
  private processors: Map<JobType, (job: any) => Promise<any>> = new Map();
  private isProcessing: boolean = false;

  constructor(config: any) {
    this.config = config;
    logger.info('Simple job queue initialized (no Redis required)');
    
    // Démarrer le traitement automatique des jobs
    this.startJobProcessor();
  }

  async addJob(jobRequest: JobRequest): Promise<string> {
    const jobId = jobRequest.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      type: jobRequest.type,
      data: jobRequest.data,
      status: JobStatus.PENDING,
      timestamp: new Date(),
      priority: jobRequest.priority || 0,
      timeout: jobRequest.timeout || this.config.jobTimeout,
      attempts: jobRequest.retries || 3,
      currentAttempt: 0,
    };

    this.jobs.set(jobId, job);

    logger.info(`Job added to simple queue:`, {
      jobId: job.id,
      type: jobRequest.type,
      priority: jobRequest.priority,
    });

    return jobId;
  }

  async getJob(jobType: JobType, jobId: string): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job || job.type !== jobType) {
      return null;
    }

    return {
      id: job.id,
      type: job.type,
      data: job.data,
      progress: 0,
      status: job.status,
      timestamp: job.timestamp,
      createdOn: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      result: job.result, // Ajouter le résultat du job
    };
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = this.jobs.get(jobId);
    return job ? job.status : JobStatus.UNKNOWN;
  }

  async updateJobStatus(jobId: string, status: JobStatus, result?: any): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      if (status === JobStatus.COMPLETED) {
        job.finishedOn = new Date();
        job.result = result;
      } else if (status === JobStatus.FAILED) {
        job.finishedOn = new Date();
        job.failedReason = result;
      }
    }
  }

  async getJobsByType(jobType: JobType): Promise<any[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.type === jobType)
      .map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        data: job.data,
        result: job.result,
        error: job.failedReason,
        progress: job.progress,
        createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: job.finishedOn?.toISOString() || job.createdAt?.toISOString() || new Date().toISOString(),
        priority: job.priority,
        retries: job.retries,
      }));
  }

  async getStats(): Promise<any> {
    const stats = {
      totalJobs: this.jobs.size,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    for (const job of this.jobs.values()) {
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
    }

    return stats;
  }

  async clear(): Promise<void> {
    this.jobs.clear();
    logger.info('Simple job queue cleared');
  }

  // Méthodes supplémentaires pour compatibilité avec JobQueueService
  async cancelJob(jobType: JobType, jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (job && job.type === jobType) {
      job.status = JobStatus.CANCELLED;
      job.finishedOn = new Date();
      return true;
    }
    return false;
  }

  async getQueueStats(jobType: JobType): Promise<any> {
    const jobsOfType = Array.from(this.jobs.values()).filter(job => job.type === jobType);
    return {
      waiting: jobsOfType.filter(job => job.status === JobStatus.PENDING).length,
      active: jobsOfType.filter(job => job.status === JobStatus.RUNNING).length,
      completed: jobsOfType.filter(job => job.status === JobStatus.COMPLETED).length,
      failed: jobsOfType.filter(job => job.status === JobStatus.FAILED).length,
      delayed: 0,
      paused: 0
    };
  }

  async getAllStats(): Promise<any> {
    const stats = {
      totalJobs: this.jobs.size,
      byType: {} as Record<string, any>,
      byStatus: {} as Record<string, number>,
    };

    for (const job of this.jobs.values()) {
      if (!stats.byType[job.type]) {
        stats.byType[job.type] = await this.getQueueStats(job.type);
      }
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
    }

    return stats;
  }

  async close(): Promise<void> {
    logger.info('Simple job queue closed');
  }

  async registerJobProcessor(jobType: JobType, processor: (job: any) => Promise<any>): Promise<void> {
    this.processors.set(jobType, processor);
    logger.info(`Job processor registered for type: ${jobType}`);
  }

  private startJobProcessor(): void {
    // Traiter les jobs toutes les 2 secondes
    setInterval(async () => {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      try {
        await this.processPendingJobs();
      } catch (error) {
        logger.error('Error processing jobs:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 2000);
    
    logger.info('Job processor started (checking every 2 seconds)');
  }

  private async processPendingJobs(): Promise<void> {
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === JobStatus.PENDING)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const job of pendingJobs) {
      const processor = this.processors.get(job.type);
      if (processor) {
        try {
          logger.info(`Processing job: ${job.id} (${job.type})`);
          job.status = JobStatus.RUNNING;
          
          const result = await processor(job);
          
          job.status = JobStatus.COMPLETED;
          job.result = result;
          job.finishedOn = new Date();
          
          logger.info(`Job completed: ${job.id}`, { result });
        } catch (error) {
          job.status = JobStatus.FAILED;
          job.failedReason = error instanceof Error ? error.message : String(error);
          job.finishedOn = new Date();
          
          logger.error(`Job failed: ${job.id}`, { 
            error: job.failedReason,
            stack: error instanceof Error ? error.stack : undefined,
            fullError: error
          });
        }
      } else {
        logger.warn(`No processor found for job type: ${job.type}`);
      }
    }
  }

  async processJob(jobType: JobType, jobId: string, processor: (job: any) => Promise<any>): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job || job.type !== jobType) {
      throw new Error(`Job not found: ${jobId}`);
    }

    try {
      job.status = JobStatus.RUNNING;
      const result = await processor(job);
      job.status = JobStatus.COMPLETED;
      job.result = result;
      job.finishedOn = new Date();
      return result;
    } catch (error) {
      job.status = JobStatus.FAILED;
      job.failedReason = error instanceof Error ? error.message : String(error);
      job.finishedOn = new Date();
      throw error;
    }
  }

  // Méthodes supplémentaires pour compatibilité complète avec JobQueueService
  get queues(): Map<JobType, any> {
    // Retourner une Map vide pour compatibilité
    return new Map();
  }

  initializeQueues(): void {
    // Déjà fait dans le constructeur
    logger.info('Queues already initialized in SimpleJobQueueService');
  }

  async cleanQueues(): Promise<void> {
    this.jobs.clear();
    logger.info('Simple job queues cleaned');
  }
}
