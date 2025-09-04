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

  // GET /agents/tools - Obtenir les outils disponibles
  router.get('/tools', async (req: Request, res: Response) => {
    try {
      // Retourner une liste d'outils prédéfinis pour l'instant
      const tools = [
        'rag.search',
        'rag.answer',
        'rag.index',
        'math.evaluate',
        'web.search',
        'file.read',
        'file.write',
        'system.info',
        'agent.delegate',
        'workflow.execute'
      ];

      res.json({
        success: true,
        data: tools,
      });
    } catch (error) {
      logger.error('Failed to get available tools:', error);
      res.status(500).json({
        error: 'Failed to get available tools',
        message: (error as Error).message,
      });
    }
  });

  // GET /agents/health - Vérifier la santé du service d'agents
  router.get('/health', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        health: {
          ollama: { status: 'healthy' }, // Ollama est géré par AgentService
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

  // GET /agents - Obtenir la liste de tous les agents (DOIT ÊTRE EN DERNIER)
  router.get('/', async (req: Request, res: Response) => {
    try {
      const stats = await agentService.getAgentStats();
      
      // Transformer les stats en format liste d'agents pour l'interface
      const agents = Object.entries(stats.stats).map(([id, agentData]: [string, any]) => ({
        id,
        name: agentData.name,
        role: agentData.role,
        description: agentData.description || '',
        model: agentData.model || 'qwen2.5:7b',
        // Convertir le nombre d'outils en tableau d'outils
        tools: Array.isArray(agentData.tools) ? agentData.tools : [
          'rag.search',
          'math.evaluate',
          'system.info',
          ...(agentData.tools >= 4 ? ['agent.delegate'] : []),
          ...(agentData.tools >= 5 ? ['workflow.execute'] : [])
        ].slice(0, agentData.tools || 0),
        // Convertir le nombre de packs en tableau de noms
        knowledgePacks: Array.isArray(agentData.knowledgePackIds) ? agentData.knowledgePackIds : 
          agentData.knowledgePacks > 0 ? ['general'] : [],
        permissions: {
          network: false,
          filesystem: true,
          tools: Array.isArray(agentData.tools) ? agentData.tools : ['rag.search', 'math.evaluate'],
        },
        authorizations: agentData.authorizations || { network: false, filesystem: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      res.json({
        success: true,
        data: agents,
      });
    } catch (error) {
      logger.error('Failed to get agents list:', error);
      res.status(500).json({
        error: 'Failed to get agents list',
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

  // GET /agents/tools - Obtenir les outils disponibles
  router.get('/tools', async (req: Request, res: Response) => {
    try {
      // Retourner une liste d'outils prédéfinis pour l'instant
      const tools = [
        'rag.search',
        'rag.answer',
        'rag.index',
        'math.evaluate',
        'web.search',
        'file.read',
        'file.write',
        'system.info',
        'agent.delegate',
        'workflow.execute'
      ];

      res.json({
        success: true,
        data: tools,
      });
    } catch (error) {
      logger.error('Failed to get available tools:', error);
      res.status(500).json({
        error: 'Failed to get available tools',
        message: (error as Error).message,
      });
    }
  });

  // GET /agents/health - Vérifier la santé du service d'agents
  router.get('/health', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        health: {
          ollama: { status: 'healthy' }, // Ollama est géré par AgentService
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
