import { AgentManager, OllamaProvider, ToolRegistry, MemoryManager } from '@elavira/core';
import { AgentExecutionJob } from '../types';
import { logger } from '../utils/logger';

export class AgentService {
  private agentManager!: AgentManager;
  private ollamaProvider!: OllamaProvider;
  private toolRegistry!: ToolRegistry;
  private memoryManager!: MemoryManager;

  constructor() {
    // Le constructeur ne fait plus l'initialisation automatique
    // L'initialisation doit être appelée explicitement
  }

  public async initializeServices(): Promise<void> {
    try {
      // Initialiser le provider Ollama
      this.ollamaProvider = new OllamaProvider({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      });

      // Initialiser le registre d'outils
      this.toolRegistry = new ToolRegistry();
      
      // Initialiser le gestionnaire de mémoire
      this.memoryManager = new MemoryManager();

      // Initialiser le gestionnaire d'agents
      this.agentManager = new AgentManager(
        this.ollamaProvider,
        this.toolRegistry,
        this.memoryManager
      );

      // Charger les agents depuis la base de données PostgreSQL
      await this.loadAgentsFromDatabase();

      logger.info('Agent service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize agent service:', error);
      throw error;
    }
  }

  async executeAgent(jobData: AgentExecutionJob): Promise<any> {
    try {
      logger.info('Executing agent:', {
        agentId: jobData.agentId,
        message: jobData.message.substring(0, 100) + '...',
        sessionId: jobData.sessionId,
      });

      // Récupérer l'agent
      logger.info(`Looking for agent with ID: ${jobData.agentId}`);
      const agent = this.agentManager.getAgent(jobData.agentId);
      if (!agent) {
        logger.error(`Agent not found: ${jobData.agentId}`);
        logger.info(`Available agents:`, this.agentManager.getAllAgents().map(a => ({ id: a.getAgentId(), name: a.getConfig().name })));
        throw new Error(`Agent not found: ${jobData.agentId}`);
      }
      logger.info(`Agent found: ${agent.getConfig().name} (${agent.getAgentId()})`);

      // Préparer le contexte
      const context = {
        agentId: jobData.agentId,
        sessionId: jobData.sessionId || `session-${Date.now()}`,
        metadata: jobData.context || {},
      };

      // Exécuter l'agent
      const startTime = Date.now();
      const response = await agent.processMessage(jobData.message, context);
      const duration = Date.now() - startTime;

      logger.info('Agent execution completed:', {
        agentId: jobData.agentId,
        duration,
        toolCalls: response.toolCalls?.length || 0,
        thoughts: response.thoughts?.length || 0,
      });

      return {
        success: true,
        response,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Agent execution failed:', {
        agentId: jobData.agentId,
        error: (error as Error).message,
        stack: (error as Error).stack,
        fullError: error,
      });

      throw error;
    }
  }

  async getAgentStats(): Promise<any> {
    try {
      // Lire depuis la base de données PostgreSQL
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const agents = await prisma.agent.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          tools: true,
          knowledgePackIds: true,
          authorizations: true,
        },
      });
      
      await prisma.$disconnect();
      
      // Transformer en format attendu
      const stats: Record<string, any> = {};
      agents.forEach((agent: any) => {
        stats[agent.id] = {
          name: agent.name,
          role: agent.role,
          tools: Array.isArray(agent.tools) ? agent.tools.length : 0,
          knowledgePacks: Array.isArray(agent.knowledgePackIds) ? agent.knowledgePackIds.length : 0,
          authorizations: agent.authorizations,
        };
      });
      
      return {
        totalAgents: agents.length,
        stats,
      };
    } catch (error) {
      logger.error('Failed to get agent stats from database:', error);
      // Fallback aux données statiques en cas d'erreur
      const stats = {
        'assistant-001': {
          name: 'Assistant',
          role: 'Assistant général polyvalent',
          tools: 4,
          knowledgePacks: 0,
          authorizations: { network: false, filesystem: true },
        },
        'chef-001': {
          name: 'Chef',
          role: 'Chef cuisinier spécialisé',
          tools: 3,
          knowledgePacks: 1,
          authorizations: { network: false, filesystem: false },
        },
        'prof-001': {
          name: 'Prof',
          role: 'Professeur et tuteur',
          tools: 3,
          knowledgePacks: 1,
          authorizations: { network: false, filesystem: false },
        },
      };
      
      return {
        totalAgents: Object.keys(stats).length,
        stats,
      };
    }
  }

  async isOllamaAvailable(): Promise<boolean> {
    try {
      return await this.ollamaProvider.isAvailable();
    } catch (error) {
      logger.error('Failed to check Ollama availability:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Récupérer les vrais modèles depuis Ollama
      const models = await this.ollamaProvider.listModels();
      logger.info(`Retrieved ${models.length} models from Ollama:`, models);
      return models;
    } catch (error) {
      logger.error('Failed to get available models from Ollama:', error);
      // Fallback vers des modèles statiques en cas d'erreur
      return ['qwen2.5:7b', 'llama3.1:8b', 'mistral:7b'];
    }
  }

  // Méthodes pour l'orchestration
  getModelProvider(): OllamaProvider {
    return this.ollamaProvider;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }

  async getAvailableAgents(): Promise<any[]> {
    try {
      return this.agentManager.getAllAgents();
    } catch (error) {
      logger.error('Failed to get available agents:', error);
      return [];
    }
  }

  // Méthodes CRUD pour la gestion des agents
  async createAgent(agentData: any): Promise<any> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Créer l'agent dans la base de données
      const newAgent = await prisma.agent.create({
        data: {
          name: agentData.name,
          role: agentData.role,
          description: agentData.description,
          model: agentData.model,
          systemPrompt: agentData.systemPrompt || '',
          goals: agentData.goals || [],
          tools: agentData.tools || [],
          knowledgePackIds: agentData.knowledgePacks || [],
          authorizations: agentData.authorizations || { network: false, filesystem: true },
          style: agentData.style || { tone: 'professionnel', language: 'fr-CA' },
          isActive: true,
        },
      });

      await prisma.$disconnect();

      // Enregistrer l'agent dans l'AgentManager
      const agentConfig = {
        id: newAgent.id,
        name: newAgent.name,
        role: newAgent.role,
        description: newAgent.description || '',
        model: newAgent.model,
        goals: newAgent.goals || [],
        tools: newAgent.tools || [],
        permissions: {
          network: false,
          filesystem: true,
          tools: newAgent.tools || [],
        },
        knowledgePacks: newAgent.knowledgePackIds || [],
        style: newAgent.style || { tone: 'professionnel', language: 'fr-CA' },
        authorizations: newAgent.authorizations || { network: false, filesystem: true },
      };

      const agent = this.agentManager.registerAgent(agentConfig, newAgent.id);
      logger.info(`Agent created: ${newAgent.name} (${agent.getAgentId()})`);

      return {
        id: newAgent.id,
        name: newAgent.name,
        role: newAgent.role,
        description: newAgent.description,
        model: newAgent.model,
        tools: newAgent.tools,
        knowledgePacks: newAgent.knowledgePackIds,
        permissions: {
          network: false,
          filesystem: true,
          tools: newAgent.tools,
        },
        authorizations: newAgent.authorizations,
        createdAt: newAgent.createdAt.toISOString(),
        updatedAt: newAgent.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to create agent:', error);
      throw error;
    }
  }

  async updateAgent(agentId: string, agentData: any): Promise<any> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Mettre à jour l'agent dans la base de données
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          name: agentData.name,
          role: agentData.role,
          description: agentData.description,
          model: agentData.model,
          systemPrompt: agentData.systemPrompt || '',
          goals: agentData.goals || [],
          tools: agentData.tools || [],
          knowledgePackIds: agentData.knowledgePacks || [],
          authorizations: agentData.permissions || { network: false, filesystem: true },
          style: agentData.style || { tone: 'professionnel', language: 'fr-CA' },
          updatedAt: new Date(),
        },
      });

      await prisma.$disconnect();

      // Mettre à jour l'agent dans l'AgentManager
      const agentConfig = {
        id: updatedAgent.id,
        name: updatedAgent.name,
        role: updatedAgent.role,
        description: updatedAgent.description || '',
        model: updatedAgent.model,
        systemPrompt: updatedAgent.systemPrompt || '',
        goals: updatedAgent.goals || [],
        tools: updatedAgent.tools || [],
        permissions: {
          network: updatedAgent.authorizations?.network || false,
          filesystem: updatedAgent.authorizations?.filesystem || true,
          tools: updatedAgent.tools || [],
        },
        knowledgePacks: updatedAgent.knowledgePackIds || [],
        style: updatedAgent.style || { tone: 'professionnel', language: 'fr-CA' },
        authorizations: updatedAgent.authorizations || { network: false, filesystem: true },
      };

      // Supprimer l'ancien agent et enregistrer le nouveau
      this.agentManager.unregisterAgent(agentId);
      const agent = this.agentManager.registerAgent(agentConfig, updatedAgent.id);
      logger.info(`Agent updated: ${updatedAgent.name} (${agent.getAgentId()})`);

      return {
        id: updatedAgent.id,
        name: updatedAgent.name,
        role: updatedAgent.role,
        description: updatedAgent.description,
        model: updatedAgent.model,
        tools: updatedAgent.tools,
        knowledgePacks: updatedAgent.knowledgePackIds,
        permissions: {
          network: false,
          filesystem: true,
          tools: updatedAgent.tools,
        },
        authorizations: updatedAgent.authorizations,
        createdAt: updatedAgent.createdAt.toISOString(),
        updatedAt: updatedAgent.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to update agent:', error);
      throw error;
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Supprimer l'agent de la base de données
      await prisma.agent.delete({
        where: { id: agentId },
      });

      await prisma.$disconnect();

      // Supprimer l'agent de l'AgentManager
      this.agentManager.unregisterAgent(agentId);
      logger.info(`Agent deleted: ${agentId}`);
    } catch (error) {
      logger.error('Failed to delete agent:', error);
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<any> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      await prisma.$disconnect();

      if (!agent) {
        return null;
      }

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        model: agent.model,
        systemPrompt: agent.systemPrompt || '',
        tools: agent.tools,
        knowledgePacks: agent.knowledgePackIds,
        permissions: {
          network: false,
          filesystem: true,
          tools: agent.tools,
        },
        authorizations: agent.authorizations,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get agent:', error);
      throw error;
    }
  }

  private async loadAgentsFromDatabase(): Promise<void> {
    try {
      // Importer Prisma
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Récupérer tous les agents actifs depuis la base de données
      const agents = await prisma.agent.findMany({
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
        },
      });

      await prisma.$disconnect();

      logger.info(`Found ${agents.length} active agents in database`);

      // Enregistrer chaque agent dans l'AgentManager
      for (const dbAgent of agents) {
        try {
          // Convertir le format de la base de données en format AgentConfig
          const agentConfig = {
            id: dbAgent.id,
            name: dbAgent.name,
            role: dbAgent.role,
            description: dbAgent.description || '',
            model: dbAgent.model,
            systemPrompt: dbAgent.systemPrompt || '',
            goals: dbAgent.goals || [],
            tools: dbAgent.tools || [],
            permissions: {
              network: dbAgent.authorizations?.network || false,
              filesystem: dbAgent.authorizations?.filesystem || true,
              tools: dbAgent.tools || [],
            },
            knowledgePacks: dbAgent.knowledgePackIds || [],
            style: dbAgent.style || {
              tone: 'professionnel',
              language: 'fr-CA',
            },
            authorizations: dbAgent.authorizations || {
              network: false,
              filesystem: true,
            },
          };

          // Créer l'agent avec la configuration et l'ID de la base de données
          const agent = this.agentManager.registerAgent(agentConfig, dbAgent.id);
          logger.info(`Agent loaded from database: ${dbAgent.name} (${agent.getAgentId()})`);
        } catch (error) {
          logger.error(`Failed to load agent ${dbAgent.name} from database:`, error);
        }
      }

      logger.info(`Successfully loaded ${agents.length} agents from database`);
    } catch (error) {
      logger.error('Failed to load agents from database:', error);
      // En cas d'erreur, on continue sans agents plutôt que de faire planter l'application
    }
  }
}
