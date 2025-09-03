import { Router, Request, Response } from 'express';
import { AgentService } from '../services/agent-service';
import { JobQueueService } from '../services/job-queue';
import { JobType, IJobQueueService } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export function createAgentsRouter(
  agentService: AgentService,
  jobQueueService: IJobQueueService
): Router {
  const router = Router();

  // POST /agents/execute - Exécuter un agent
  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const { agentId, message, sessionId, context, priority } = req.body;

      if (!agentId || !message) {
        return res.status(400).json({
          error: 'Agent ID and message are required',
        });
      }

      const jobId = uuidv4();
      const jobData = {
        agentId,
        message,
        sessionId,
        context,
      };

      // Ajouter le job à la queue
      await jobQueueService.addJob({
        id: jobId,
        type: JobType.AGENT_EXECUTION,
        data: jobData,
        priority,
      });

      logger.info('Agent execution job created:', { jobId, agentId });

      res.status(202).json({
        success: true,
        jobId,
        message: 'Agent execution job created',
      });
    } catch (error) {
      logger.error('Failed to create agent execution job:', error);
      res.status(500).json({
        error: 'Failed to create agent execution job',
        message: (error as Error).message,
      });
    }
  });

  // GET /agents/stats - Obtenir les statistiques des agents
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await agentService.getAgentStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Failed to get agent stats:', error);
      res.status(500).json({
        error: 'Failed to get agent stats',
        message: (error as Error).message,
      });
    }
  });

  // GET /agents/models - Obtenir les modèles disponibles
  router.get('/models', async (req: Request, res: Response) => {
    try {
      const models = await agentService.getAvailableModels();

      res.json({
        success: true,
        models,
      });
    } catch (error) {
      logger.error('Failed to get available models:', error);
      res.status(500).json({
        error: 'Failed to get available models',
        message: (error as Error).message,
      });
    }
  });

  // GET /agents/health - Vérifier la santé du service d'agents
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const ollamaAvailable = await agentService.isOllamaAvailable();

      res.json({
        success: true,
              health: {
        ollama: { status: ollamaAvailable ? 'healthy' : 'unhealthy' },
        database: { status: 'healthy' }, // À implémenter avec Prisma
        jobQueue: { status: 'healthy' }, // SimpleJobQueueService en mémoire
        rag: { status: 'healthy' }, // À vérifier avec RAGService
      },
      });
    } catch (error) {
      logger.error('Failed to check agent health:', error);
      res.status(500).json({
        error: 'Failed to check agent health',
        message: (error as Error).message,
      });
    }
  });

  return router;
}
