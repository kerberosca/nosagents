import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as path from 'path';
import * as fs from 'fs';

import { JobQueueService } from './services/job-queue';
import { SimpleJobQueueService } from './services/job-queue-simple';
import { AgentService } from './services/agent-service';
import { RAGService } from './services/rag-service';
import { databaseService } from './services/database-service';
import { createJobsRouter } from './routes/jobs';
import { createAgentsRouter } from './routes/agents';
import { createRAGRouter } from './routes/rag';
import systemConfigRouter from './routes/system-config';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { logger } from './utils/logger';
import { JobType, IJobQueueService } from './types';

class WorkerApp {
  private app: express.Application;
  private jobQueueService!: IJobQueueService;
  private agentService!: AgentService;
  private ragService!: RAGService;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupErrorHandling();
    // setupRoutes() sera appelé après l'initialisation des services
  }

  async initialize(): Promise<void> {
    await this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    // Configuration
    const config = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '5'),
      jobTimeout: parseInt(process.env.JOB_TIMEOUT || '300000'), // 5 minutes
      enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    };

    // Initialiser la base de données en premier
    try {
      logger.info('🔌 Initialisation de la connexion à la base de données...');
      await databaseService.connect();
      logger.info('✅ Base de données initialisée avec succès');
    } catch (error) {
      logger.error('❌ Échec de l\'initialisation de la base de données:', error);
      throw error;
    }

    // Initialiser les services
    // Utiliser la version simple si Redis n'est pas disponible
    const useSimpleQueue = process.env.NODE_ENV === 'development' || !process.env.REDIS_URL;
    if (useSimpleQueue) {
      this.jobQueueService = new SimpleJobQueueService(config);
    } else {
      this.jobQueueService = new JobQueueService(config);
    }
    this.agentService = new AgentService();
    // Attendre l'initialisation de l'AgentService
    await this.agentService.initializeServices();
    
    // Initialiser le service RAG avec gestion d'erreur
    try {
      this.ragService = new RAGService();
    } catch (error) {
      logger.warn('RAG service initialization failed, continuing without RAG:', error);
      // Créer un service RAG factice pour éviter les erreurs
      this.ragService = {
        indexFile: async () => ({ success: false, error: 'RAG service not available' }),
        indexDirectory: async () => ({ success: false, error: 'RAG service not available' }),
        search: async () => ({ results: [], error: 'RAG service not available' }),
        getStats: async () => ({ totalDocuments: 0, totalChunks: 0, totalSize: 0, lastUpdated: new Date() }),
      } as any;
    }

    // Créer les dossiers nécessaires
    this.createDirectories();
    
    // Configurer les processeurs de jobs après l'initialisation des services
    this.setupJobProcessors();
    
    // Configurer les routes APRÈS l'initialisation des services
    this.setupRoutes();
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
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting (désactivé pour les tests)
    if (process.env.ENABLE_RATE_LIMIT !== 'false' && process.env.NODE_ENV !== 'development') {
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
    this.app.use('/api/system-config', systemConfigRouter);
    
    // Route de test de la base de données
    this.app.get('/api/database/test', async (req, res) => {
      try {
        const stats = await databaseService.getDatabaseStats();
        res.json({
          success: true,
          message: 'Test de la base de données réussi',
          stats
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Test de la base de données échoué',
          message: (error as Error).message
        });
      }
    });

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
    
    // Gestion globale des erreurs non gérées
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  private async getHealthStatus(): Promise<any> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Vérifier les services
    const services = {
      database: databaseService.isDatabaseConnected,
      redis: true, // À vérifier avec Bull
      ollama: true, // Ollama est géré par AgentService, pas besoin de vérifier ici
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
    const port = parseInt(process.env.WORKER_PORT || process.env.PORT || '3001');
    const host = process.env.WORKER_HOST || process.env.HOST || 'localhost';
    
    // Debug: afficher les variables d'environnement
    logger.info(`Environment variables - WORKER_PORT: ${process.env.WORKER_PORT}, PORT: ${process.env.PORT}, HOST: ${process.env.HOST}`);
    logger.info(`Calculated port: ${port}, host: ${host}`);

    // Initialiser les services (y compris la base de données)
    try {
      await this.initialize();
      logger.info('✅ Tous les services initialisés avec succès');
    } catch (error) {
      logger.error('❌ Échec de l\'initialisation des services:', error);
      throw error;
    }

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
          
          // Fermer la connexion à la base de données
          await databaseService.disconnect();
          
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
