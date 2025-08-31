import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as path from 'path';
import * as fs from 'fs';

import { JobQueueService } from './services/job-queue';
import { AgentService } from './services/agent-service';
import { RAGService } from './services/rag-service';
import { createJobsRouter } from './routes/jobs';
import { createAgentsRouter } from './routes/agents';
import { createRAGRouter } from './routes/rag';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { logger } from './utils/logger';
import { JobType } from './types';

class WorkerApp {
  private app: express.Application;
  private jobQueueService!: JobQueueService;
  private agentService!: AgentService;
  private ragService!: RAGService;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupJobProcessors();
    this.setupErrorHandling();
  }

  private initializeServices(): void {
    // Configuration
    const config = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '5'),
      jobTimeout: parseInt(process.env.JOB_TIMEOUT || '300000'), // 5 minutes
      enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    };

    // Initialiser les services
    this.jobQueueService = new JobQueueService(config);
    this.agentService = new AgentService();
    this.ragService = new RAGService();

    // Créer les dossiers nécessaires
    this.createDirectories();
  }

  private createDirectories(): void {
    const directories = ['logs', 'uploads', 'data/vectors'];
    
    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info(`Created directory: ${fullPath}`);
      }
    });
  }

  private setupMiddleware(): void {
    // Sécurité
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    if (process.env.ENABLE_RATE_LIMIT !== 'false') {
      const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limite par IP
        message: {
          error: 'Too many requests from this IP, please try again later.',
        },
      });
      this.app.use(limiter);
    }

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    }));

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private setupRoutes(): void {
    // Routes de base
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Elavira Agents Worker',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getHealthStatus();
        res.json(health);
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({
          status: 'unhealthy',
          error: (error as Error).message,
        });
      }
    });

    // Routes API
    this.app.use('/api/jobs', createJobsRouter(this.jobQueueService));
    this.app.use('/api/agents', createAgentsRouter(this.agentService, this.jobQueueService));
    this.app.use('/api/rag', createRAGRouter(this.ragService, this.jobQueueService));

    // Route 404
    this.app.use(notFoundHandler);
  }

  private setupJobProcessors(): void {
    // Processeur pour l'exécution d'agents
    this.jobQueueService.registerJobProcessor(
      JobType.AGENT_EXECUTION,
      async (job) => {
        return await this.agentService.executeAgent(job.data);
      }
    );

    // Processeur pour l'indexation RAG
    this.jobQueueService.registerJobProcessor(
      JobType.RAG_INDEXING,
      async (job) => {
        const { filePath, directoryPath } = job.data;
        
        if (filePath) {
          return await this.ragService.indexFile(job.data);
        } else if (directoryPath) {
          return await this.ragService.indexDirectory(job.data);
        } else {
          throw new Error('Either filePath or directoryPath must be provided');
        }
      }
    );

    logger.info('Job processors registered');
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async getHealthStatus(): Promise<any> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Vérifier les services
    const services = {
      database: true, // À implémenter avec Prisma
      redis: true, // À vérifier avec Bull
      ollama: await this.agentService.isOllamaAvailable(),
      rag: true, // À vérifier avec RAGService
    };

    // Vérifier Redis
    try {
      // Test simple de connexion Redis via Bull
      const stats = await this.jobQueueService.getAllStats();
      if (!stats) {
        services.redis = false;
        errors.push('Redis connection failed');
      }
    } catch (error) {
      services.redis = false;
              errors.push(`Redis error: ${(error as Error).message}`);
    }

    // Déterminer le statut global
    const allHealthy = Object.values(services).every(service => service);
    const status = allHealthy ? 'healthy' : errors.length > 1 ? 'unhealthy' : 'degraded';

    return {
      status,
      timestamp: new Date(),
      services,
      errors: errors.length > 0 ? errors : undefined,
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
    };
  }

  async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || 'localhost';

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, () => {
        logger.info(`Worker server started on http://${host}:${port}`);
        logger.info('Environment:', process.env.NODE_ENV || 'development');
        resolve();
      });

      this.server.on('error', (error: any) => {
        logger.error('Failed to start server:', error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(async () => {
          logger.info('Worker server stopped');
          
          // Fermer les services
          await this.jobQueueService.close();
          
          resolve();
        });
      });
    }
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (app) {
    await app.stop();
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (app) {
    await app.stop();
    process.exit(0);
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Démarrer l'application
const app = new WorkerApp();

app.start().catch((error) => {
  logger.error('Failed to start worker application:', error);
  process.exit(1);
});
