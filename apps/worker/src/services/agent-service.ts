import { AgentManager, OllamaProvider, ToolRegistry, MemoryManager } from '@elavira/core';
import { AgentExecutionJob } from '../types';
import { logger } from '../utils/logger';

export class AgentService {
  private agentManager: AgentManager;
  private ollamaProvider: OllamaProvider;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;

  constructor() {
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialiser le provider Ollama
      this.ollamaProvider = new OllamaProvider({
        model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
        baseUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 1000,
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
        toolCalls: response.toolCalls.length,
        thoughts: response.thoughts.length,
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
      const stats = this.agentManager.getAgentStats();
      return {
        totalAgents: Object.keys(stats).length,
        stats,
      };
    } catch (error) {
      logger.error('Failed to get agent stats:', error);
      throw error;
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
      return await this.ollamaProvider.listModels();
    } catch (error) {
      logger.error('Failed to get available models:', error);
      return [];
    }
  }
}
