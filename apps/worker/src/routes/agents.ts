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

  // POST /agents - Créer un nouvel agent
  router.post('/', async (req: Request, res: Response) => {
    try {
      const agentData = req.body;
      
      // Validation des données requises
      if (!agentData.name || !agentData.role || !agentData.description || !agentData.model || !agentData.systemPrompt) {
        return res.status(400).json({
          error: 'Missing required fields: name, role, description, model, systemPrompt',
        });
      }

      // Créer l'agent via le service
      const newAgent = await agentService.createAgent(agentData);

      res.status(201).json({
        success: true,
        data: newAgent,
        message: 'Agent created successfully',
      });
    } catch (error) {
      logger.error('Failed to create agent:', error);
      res.status(500).json({
        error: 'Failed to create agent',
        message: (error as Error).message,
      });
    }
  });

  // PUT /agents/:id - Mettre à jour un agent
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const agentId = req.params.id;
      const agentData = req.body;
      
      if (!agentId) {
        return res.status(400).json({
          error: 'Agent ID is required',
        });
      }

      // Mettre à jour l'agent via le service
      const updatedAgent = await agentService.updateAgent(agentId, agentData);

      res.json({
        success: true,
        data: updatedAgent,
        message: 'Agent updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update agent:', error);
      res.status(500).json({
        error: 'Failed to update agent',
        message: (error as Error).message,
      });
    }
  });

  // DELETE /agents/:id - Supprimer un agent
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const agentId = req.params.id;
      
      if (!agentId) {
        return res.status(400).json({
          error: 'Agent ID is required',
        });
      }

      // Supprimer l'agent via le service
      await agentService.deleteAgent(agentId);

      res.json({
        success: true,
        message: 'Agent deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete agent:', error);
      res.status(500).json({
        error: 'Failed to delete agent',
        message: (error as Error).message,
      });
    }
  });

  // GET /agents/:id - Obtenir un agent spécifique
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const agentId = req.params.id;
      
      if (!agentId) {
        return res.status(400).json({
          error: 'Agent ID is required',
        });
      }

      // Récupérer l'agent via le service
      const agent = await agentService.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({
          error: 'Agent not found',
        });
      }

      res.json({
        success: true,
        data: agent,
      });
    } catch (error) {
      logger.error('Failed to get agent:', error);
      res.status(500).json({
        error: 'Failed to get agent',
        message: (error as Error).message,
      });
    }
  });

  // GET /agents - Obtenir la liste de tous les agents (DOIT ÊTRE EN DERNIER)
  router.get('/', async (req: Request, res: Response) => {
    try {
      // Lire directement depuis la base de données au lieu de l'AgentManager
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const dbAgents = await prisma.agent.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          role: true,
          description: true,
          model: true,
          systemPrompt: true,
          goals: true,
          tools: true,
          knowledgePackIds: true,
          authorizations: true,
          style: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await prisma.$disconnect();

      // Transformer les données de la base en format pour l'interface
      const agents = dbAgents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description || '',
        model: agent.model || 'qwen2.5:7b',
        systemPrompt: agent.systemPrompt || '',
        tools: agent.tools || [],
        knowledgePacks: agent.knowledgePackIds || [],
        permissions: {
          network: agent.authorizations?.network || false,
          filesystem: agent.authorizations?.filesystem || true,
          tools: agent.tools || [],
        },
        authorizations: agent.authorizations || { network: false, filesystem: true },
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
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
