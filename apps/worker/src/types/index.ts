// Types pour l'application worker

export interface WorkerConfig {
  port: number;
  host: string;
  redisUrl: string;
  maxConcurrentJobs: number;
  jobTimeout: number;
  enableRateLimit: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export interface JobRequest {
  id: string;
  type: JobType;
  data: any;
  priority?: number;
  timeout?: number;
  retries?: number;
}

export interface JobResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface JobProgress {
  id: string;
  progress: number;
  status: JobStatus;
  message?: string;
  timestamp: Date;
}

export enum JobType {
  AGENT_EXECUTION = 'agent_execution',
  RAG_INDEXING = 'rag_indexing',
  DOCUMENT_PROCESSING = 'document_processing',
  WORKFLOW_EXECUTION = 'workflow_execution',
  KNOWLEDGE_PACK_UPDATE = 'knowledge_pack_update'
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown'
}

// Interface commune pour les job queue services
export interface IJobQueueService {
  addJob(jobRequest: JobRequest): Promise<string>;
  getJob(jobType: JobType, jobId: string): Promise<any>;
  getJobStatus(jobId: string): Promise<JobStatus>;
  updateJobStatus(jobId: string, status: JobStatus, result?: any): Promise<void>;
  getJobsByType(jobType: JobType): Promise<any[]>;
  getStats(): Promise<any>;
  clear(): Promise<void>;
  cancelJob(jobType: JobType, jobId: string): Promise<boolean>;
  getQueueStats(jobType: JobType): Promise<any>;
  getAllStats(): Promise<any>;
  close(): Promise<void>;
  registerJobProcessor(jobType: JobType, processor: (job: any) => Promise<any>): Promise<void>;
  processJob(jobType: JobType, jobId: string, processor: (job: any) => Promise<any>): Promise<any>;
  queues: Map<JobType, any>;
  initializeQueues(): void;
  cleanQueues(): Promise<void>;
}

export interface AgentExecutionJob {
  agentId: string;
  message: string;
  sessionId?: string;
  context?: any;
}

export interface RAGIndexingJob {
  filePath?: string;
  directoryPath?: string;
  knowledgePackId?: string;
  metadata?: any;
}

export interface DocumentProcessingJob {
  filePath: string;
  processorType: string;
  options?: any;
}

export interface WorkflowExecutionJob {
  workflowId: string;
  input: any;
  parameters?: any;
}

export interface KnowledgePackUpdateJob {
  packId: string;
  updates: any;
}

export interface WorkerStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  runningJobs: number;
  averageJobDuration: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  services: {
    database: boolean;
    redis: boolean;
    ollama: boolean;
    rag: boolean;
  };
  errors?: string[];
}
