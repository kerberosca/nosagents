import { Agent } from './agent';
import { Agent as AgentConfig } from '@elavira/config';
import { ModelProvider } from '../models/model-provider';
import { ToolRegistry } from '../tools/tool-registry';
import { MemoryManager } from '../memory/memory-manager';
import { Logger } from '../utils/logger';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private modelProvider: ModelProvider;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;
  private logger: Logger;

  constructor(
    modelProvider: ModelProvider,
    toolRegistry: ToolRegistry,
    memoryManager: MemoryManager
  ) {
    this.modelProvider = modelProvider;
    this.toolRegistry = toolRegistry;
    this.memoryManager = memoryManager;
    this.logger = new Logger('AgentManager');
  }

  registerAgent(config: AgentConfig): Agent {
    const agent = new Agent(
      config,
      this.modelProvider,
      this.toolRegistry,
      this.memoryManager
    );

    this.agents.set(agent.getAgentId(), agent);
    this.logger.info(`Agent ${config.name} enregistré avec l'ID ${agent.getAgentId()}`);
    
    return agent;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async processMessageWithAgent(
    agentId: string,
    content: string,
    context: { agentId: string; sessionId: string; userId?: string; metadata: Record<string, any> }
  ): Promise<{ content: string; toolCalls: any[]; thoughts: string[]; metadata: Record<string, any> }> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} non trouvé`);
    }

    return await agent.processMessage(content, context);
  }

  async delegateTask(
    fromAgentId: string,
    toAgentId: string,
    task: string,
    context: { agentId: string; sessionId: string; userId?: string; metadata: Record<string, any> }
  ): Promise<{ content: string; toolCalls: any[]; thoughts: string[]; metadata: Record<string, any> }> {
    this.logger.info(`Délégation de ${fromAgentId} vers ${toAgentId}: ${task}`);

    const targetAgent = this.getAgent(toAgentId);
    if (!targetAgent) {
      throw new Error(`Agent cible ${toAgentId} non trouvé`);
    }

    // Créer un nouveau contexte pour la délégation
    const delegationContext: { agentId: string; sessionId: string; userId?: string; metadata: Record<string, any> } = {
      ...context,
      metadata: {
        ...context.metadata,
        delegatedFrom: fromAgentId,
        delegationTask: task,
        timestamp: new Date().toISOString(),
      },
    };

    // Traiter la tâche avec l'agent cible
    const response = await targetAgent.processMessage(task, delegationContext);

    // Enregistrer la délégation dans la mémoire
    await this.memoryManager.addMemory({
      agentId: fromAgentId,
      type: 'conversation',
      content: `Délégation vers ${toAgentId}: ${task}`,
      metadata: {
        toAgentId,
        task,
        response: response.content,
        timestamp: new Date().toISOString(),
      },
    });

    return response;
  }

  async findBestAgentForTask(
    task: string,
    availableAgentIds?: string[]
  ): Promise<string | null> {
    const agents = availableAgentIds 
      ? availableAgentIds.map(id => this.getAgent(id)).filter(Boolean) as Agent[]
      : this.getAllAgents();

    if (agents.length === 0) {
      return null;
    }

    // Algorithme simple de sélection basé sur les mots-clés
    const taskLower = task.toLowerCase();
    let bestAgent: Agent | null = null;
    let bestScore = 0;

    for (const agent of agents) {
      const config = agent.getConfig();
      let score = 0;

      // Score basé sur le rôle
      const roleLower = config.role.toLowerCase();
      if (taskLower.includes('cuisine') && roleLower.includes('cuisinier')) score += 3;
      if (taskLower.includes('enseignement') && roleLower.includes('enseignant')) score += 3;
      if (taskLower.includes('assistant') && roleLower.includes('assistant')) score += 2;

      // Score basé sur les objectifs
      for (const goal of config.goals) {
        const goalLower = goal.toLowerCase();
        if (taskLower.includes(goalLower) || goalLower.includes(taskLower)) {
          score += 2;
        }
      }

      // Score basé sur les outils disponibles
      for (const tool of config.tools) {
        if (taskLower.includes(tool.replace('.', ' '))) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent ? bestAgent.getAgentId() : null;
  }

  async createMultiAgentSession(
    agentIds: string[],
    initialTask: string,
    context: { agentId: string; sessionId: string; userId?: string; metadata: Record<string, any> }
  ): Promise<MultiAgentSession> {
    const agents = agentIds.map(id => this.getAgent(id)).filter(Boolean) as Agent[];
    
    if (agents.length === 0) {
      throw new Error('Aucun agent valide fourni pour la session multi-agents');
    }

    const session = new MultiAgentSession(
      agents,
      this,
      context
    );

    this.logger.info(`Session multi-agents créée avec ${agents.length} agents`);
    return session;
  }

  removeAgent(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    if (removed) {
      this.logger.info(`Agent ${agentId} supprimé`);
    }
    return removed;
  }

  getAgentStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [agentId, agent] of this.agents) {
      const config = agent.getConfig();
      stats[agentId] = {
        name: config.name,
        role: config.role,
        tools: config.tools.length,
        knowledgePacks: config.knowledge_packs.length,
        authorizations: config.authorizations,
      };
    }

    return stats;
  }
}

export class MultiAgentSession {
  private agents: Agent[];
  private agentManager: AgentManager;
  private context: { agentId: string; sessionId: string; userId?: string; metadata: Record<string, any> };
  private conversationHistory: Array<{
    agentId: string;
    content: string;
    timestamp: Date;
  }> = [];

  constructor(
    agents: Agent[],
    agentManager: AgentManager,
    context: { agentId: string; sessionId: string; userId?: string; metadata: Record<string, any> }
  ) {
    this.agents = agents;
    this.agentManager = agentManager;
    this.context = context;
  }

  async executeTask(task: string): Promise<MultiAgentResponse> {
    const responses: Array<{
      agentId: string;
      agentName: string;
      response: string;
      toolCalls: any[];
    }> = [];

    // Distribuer la tâche à tous les agents
    for (const agent of this.agents) {
      try {
        const response = await agent.processMessage(task, this.context);
        responses.push({
          agentId: agent.getAgentId(),
          agentName: agent.getConfig().name,
          response: response.content,
          toolCalls: response.toolCalls,
        });

        this.conversationHistory.push({
          agentId: agent.getAgentId(),
          content: response.content,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Erreur avec l'agent ${agent.getConfig().name}:`, error);
      }
    }

    return {
      task,
      responses,
      conversationHistory: this.conversationHistory,
      timestamp: new Date(),
    };
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}

export interface MultiAgentResponse {
  task: string;
  responses: Array<{
    agentId: string;
    agentName: string;
    response: string;
    toolCalls: any[];
  }>;
  conversationHistory: Array<{
    agentId: string;
    content: string;
    timestamp: Date;
  }>;
  timestamp: Date;
}
