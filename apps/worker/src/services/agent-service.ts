import { AgentManager, OllamaProvider, ToolRegistry, MemoryManager } from '@elavira/core';
import { AgentExecutionJob } from '../types';
import { logger } from '../utils/logger';

export class AgentService {
  private agentManager!: AgentManager;
  private ollamaProvider!: OllamaProvider;
  private toolRegistry!: ToolRegistry;
  private memoryManager!: MemoryManager;

  constructor() {
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialiser le provider Ollama
      this.ollamaProvider = new OllamaProvider(
        process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      );

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

      // Charger les agents depuis les fichiers YAML
      await this.loadAgentsFromFiles();

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
      const agent = this.agentManager.getAgent(jobData.agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${jobData.agentId}`);
      }

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
      // Retourner des modèles statiques pour l'instant
      return ['qwen2.5:7b', 'llama3.1:8b', 'mistral:7b'];
    } catch (error) {
      logger.error('Failed to get available models:', error);
      return [];
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

  private async loadAgentsFromFiles(): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      const yaml = require('js-yaml');

      const agentsDir = path.join(process.cwd(), '..', '..', 'agents');
      
      if (!fs.existsSync(agentsDir)) {
        logger.warn('Agents directory not found:', agentsDir);
        return;
      }

      const files = fs.readdirSync(agentsDir);
      const yamlFiles = files.filter((file: string) => file.endsWith('.yaml') || file.endsWith('.yml'));

      logger.info(`Found ${yamlFiles.length} agent configuration files`);

      for (let i = 0; i < yamlFiles.length; i++) {
        const file = yamlFiles[i];
        try {
          const filePath = path.join(agentsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const config = yaml.load(content);

          // Créer l'agent avec la configuration
          const agent = this.agentManager.registerAgent(config);
          logger.info(`Agent loaded: ${config.name} (${agent.getAgentId()})`);
        } catch (error) {
          logger.error(`Failed to load agent from ${file}:`, error);
        }
      }

      const stats = this.agentManager.getAgentStats();
      const agentCount = stats && typeof stats === 'object' ? Object.keys(stats).length : 0;
      logger.info(`Successfully loaded ${agentCount} agents`);
    } catch (error) {
      logger.error('Failed to load agents from files:', error);
    }
  }
}
