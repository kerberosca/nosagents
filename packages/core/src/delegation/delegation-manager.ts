import { Agent, AgentMessage, AgentResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ModelProvider } from '../models/model-provider';
import { ToolRegistry } from '../tools/tool-registry';
import { MemoryManager } from '../memory/memory-manager';

export interface DelegationContext {
  originalMessage: AgentMessage;
  coordinatorContext: any;
  delegationHistory: DelegationRecord[];
}

export interface DelegationRecord {
  from: string;
  to: string;
  message: AgentMessage;
  response?: AgentResponse;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface DelegationResult {
  success: boolean;
  response?: AgentResponse;
  error?: string;
  metadata: {
    delegationTime: number;
    agentUsed: string;
    toolsUsed: string[];
  };
}

export class DelegationManager {
  private modelProvider: ModelProvider;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;
  private delegationHistory: Map<string, DelegationRecord[]>;

  constructor(
    modelProvider: ModelProvider,
    toolRegistry: ToolRegistry,
    memoryManager: MemoryManager
  ) {
    this.modelProvider = modelProvider;
    this.toolRegistry = toolRegistry;
    this.memoryManager = memoryManager;
    this.delegationHistory = new Map();
  }

  /**
   * Déléguer une tâche à un agent
   */
  async delegate(
    targetAgent: Agent,
    message: AgentMessage,
    context: DelegationContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Préparer le message pour l'agent cible
      const preparedMessage = this.prepareMessageForAgent(
        targetAgent,
        message,
        context
      );

      // Exécuter l'agent avec le message préparé
      const response = await this.executeAgent(targetAgent, preparedMessage);

      // Enregistrer la délégation
      const delegationRecord: DelegationRecord = {
        from: 'coordinator',
        to: targetAgent.id,
        message: message,
        response: response,
        timestamp: new Date(),
        success: true
      };

      this.recordDelegation(message.conversationId || 'unknown', delegationRecord);

      return response;
    } catch (error) {
      // Enregistrer l'échec de délégation
      const delegationRecord: DelegationRecord = {
        from: 'coordinator',
        to: targetAgent.id,
        message: message,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.recordDelegation(message.conversationId || 'unknown', delegationRecord);

      throw error;
    }
  }

  /**
   * Préparer un message pour un agent spécifique
   */
  private prepareMessageForAgent(
    agent: Agent,
    originalMessage: AgentMessage,
    context: DelegationContext
  ): AgentMessage {
    // Créer un message contextuel pour l'agent
    const contextualMessage = {
      ...originalMessage,
      content: this.buildContextualPrompt(agent, originalMessage, context),
      metadata: {
        ...originalMessage.metadata,
        delegated: true,
        originalMessage: originalMessage.content,
        coordinatorContext: context.coordinatorContext
      }
    };

    return contextualMessage;
  }

  /**
   * Construire un prompt contextuel pour l'agent
   */
  private buildContextualPrompt(
    agent: Agent,
    originalMessage: AgentMessage,
    context: DelegationContext
  ): string {
    const basePrompt = `Tu es ${agent.name}, ${agent.description}.

Rôle: ${agent.role}

Tu as été délégué pour traiter cette tâche. Voici le contexte:

**Tâche originale:** ${originalMessage.content}

**Contexte du coordinateur:** ${JSON.stringify(context.coordinatorContext, null, 2)}

**Historique des délégations:** ${context.delegationHistory.length} délégations précédentes

Outils disponibles: ${agent.tools.join(', ')}

Réponds de manière professionnelle et en te concentrant sur ton expertise. Si tu as besoin d'informations supplémentaires, demande-les clairement.`;

    return basePrompt;
  }

  /**
   * Exécuter un agent avec un message
   */
  private async executeAgent(
    agent: Agent,
    message: AgentMessage
  ): Promise<AgentResponse> {
    // Vérifier les permissions de l'agent
    this.validateAgentPermissions(agent, message);

    // Générer la réponse avec le modèle de l'agent
    const modelResponse = await this.modelProvider.generateResponse(
      message.content,
      agent.model
    );

    // Convertir ModelResponse en AgentResponse
    const response: AgentResponse = {
      id: uuidv4(),
      content: modelResponse.content,
      toolCalls: modelResponse.toolCalls?.map(tc => ({
        id: uuidv4(),
        name: tc.name,
        arguments: tc.arguments
      })),
      metadata: modelResponse.metadata,
      timestamp: new Date()
    };

    // Appliquer les outils si nécessaire
    const responseWithTools = await this.applyAgentTools(agent, message, response);

    return responseWithTools;
  }

  /**
   * Valider les permissions de l'agent
   */
  private validateAgentPermissions(agent: Agent, message: AgentMessage): void {
    // Vérifier les permissions réseau
    if (!agent.permissions.network && this.requiresNetworkAccess(message)) {
      throw new Error(`Agent ${agent.name} does not have network permissions`);
    }

    // Vérifier les permissions système de fichiers
    if (!agent.permissions.filesystem && this.requiresFilesystemAccess(message)) {
      throw new Error(`Agent ${agent.name} does not have filesystem permissions`);
    }

    // Vérifier les outils autorisés
    const requiredTools = this.extractRequiredTools(message);
    const unauthorizedTools = requiredTools.filter(
      tool => !agent.permissions.tools.includes(tool)
    );

    if (unauthorizedTools.length > 0) {
      throw new Error(
        `Agent ${agent.name} is not authorized to use tools: ${unauthorizedTools.join(', ')}`
      );
    }
  }

  /**
   * Vérifier si le message nécessite un accès réseau
   */
  private requiresNetworkAccess(message: AgentMessage): boolean {
    const networkKeywords = [
      'web', 'http', 'https', 'api', 'fetch', 'download', 'url', 'link'
    ];
    
    return networkKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Vérifier si le message nécessite un accès au système de fichiers
   */
  private requiresFilesystemAccess(message: AgentMessage): boolean {
    const filesystemKeywords = [
      'file', 'read', 'write', 'save', 'load', 'document', 'folder'
    ];
    
    return filesystemKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Extraire les outils requis du message
   */
  private extractRequiredTools(message: AgentMessage): string[] {
    const tools: string[] = [];
    
    // Analyser le contenu pour détecter les besoins en outils
    if (message.content.toLowerCase().includes('search') || 
        message.content.toLowerCase().includes('recherche')) {
      tools.push('rag.search');
    }
    
    if (message.content.toLowerCase().includes('file') || 
        message.content.toLowerCase().includes('fichier')) {
      tools.push('fs.read', 'fs.write');
    }
    
    if (message.content.toLowerCase().includes('calculate') || 
        message.content.toLowerCase().includes('calcul')) {
      tools.push('math.evaluate');
    }

    return tools;
  }

  /**
   * Obtenir le contexte de l'agent
   */
  private getAgentContext(agent: Agent, message: AgentMessage): any {
    return {
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        tools: agent.tools,
        permissions: agent.permissions
      },
      conversation: {
        id: message.conversationId,
        history: this.memoryManager.getConversationHistory(message.conversationId || '')
      },
      knowledgePacks: agent.knowledgePacks
    };
  }

  /**
   * Appliquer les outils de l'agent
   */
  private async applyAgentTools(
    agent: Agent,
    message: AgentMessage,
    response: AgentResponse
  ): Promise<AgentResponse> {
    // Vérifier si la réponse nécessite l'utilisation d'outils
    const toolCalls = this.extractToolCalls(response.content);
    
    if (toolCalls.length === 0) {
      return response;
    }

    // Exécuter les outils
    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        try {
          const tool = this.toolRegistry.getTool(toolCall.name);
          if (!tool) {
            return {
              name: toolCall.name,
              success: false,
              error: 'Tool not found'
            };
          }

          const result = await tool.execute(toolCall.arguments, this.getAgentContext(agent, message));
          return {
            name: toolCall.name,
            success: true,
            result: result
          };
        } catch (error) {
          return {
            name: toolCall.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Intégrer les résultats des outils dans la réponse
    const enhancedResponse = this.integrateToolResults(response, toolResults);
    
    return enhancedResponse;
  }

  /**
   * Extraire les appels d'outils de la réponse
   */
  private extractToolCalls(content: string): Array<{ name: string; arguments: any }> {
    const toolCalls: Array<{ name: string; arguments: any }> = [];
    
    // Rechercher les patterns d'appels d'outils dans le contenu
    const toolPattern = /@(\w+)\(([^)]+)\)/g;
    let match;
    
    while ((match = toolPattern.exec(content)) !== null) {
      try {
        const toolName = match[1];
        const args = JSON.parse(match[2]);
        toolCalls.push({ name: toolName, arguments: args });
      } catch (error) {
        // Ignorer les appels d'outils malformés
        console.warn(`Invalid tool call format: ${match[0]}`);
      }
    }
    
    return toolCalls;
  }

  /**
   * Intégrer les résultats des outils dans la réponse
   */
  private integrateToolResults(
    response: AgentResponse,
    toolResults: Array<{ name: string; success: boolean; result?: any; error?: string }>
  ): AgentResponse {
    let enhancedContent = response.content;
    
    toolResults.forEach((toolResult, index) => {
      const placeholder = `@${toolResult.name}(...)`;
      const replacement = toolResult.success 
        ? `**Résultat de ${toolResult.name}:** ${JSON.stringify(toolResult.result)}`
        : `**Erreur ${toolResult.name}:** ${toolResult.error}`;
      
      enhancedContent = enhancedContent.replace(placeholder, replacement);
    });
    
    return {
      ...response,
      content: enhancedContent,
      metadata: {
        ...response.metadata,
        toolsUsed: toolResults.map(r => r.name),
        toolResults: toolResults
      }
    };
  }

  /**
   * Enregistrer une délégation
   */
  private recordDelegation(conversationId: string, record: DelegationRecord): void {
    if (!this.delegationHistory.has(conversationId)) {
      this.delegationHistory.set(conversationId, []);
    }
    
    this.delegationHistory.get(conversationId)!.push(record);
  }

  /**
   * Obtenir l'historique des délégations pour une conversation
   */
  getDelegationHistory(conversationId: string): DelegationRecord[] {
    return this.delegationHistory.get(conversationId) || [];
  }

  /**
   * Obtenir les statistiques de délégation
   */
  getDelegationStats(): any {
    const stats = {
      totalDelegations: 0,
      successfulDelegations: 0,
      failedDelegations: 0,
      averageResponseTime: 0,
      mostDelegatedAgent: null as string | null,
      agentStats: new Map<string, { success: number; failure: number }>()
    };

    let totalResponseTime = 0;
    const agentCounts = new Map<string, number>();

    for (const records of this.delegationHistory.values()) {
      records.forEach(record => {
        stats.totalDelegations++;
        
        if (record.success) {
          stats.successfulDelegations++;
        } else {
          stats.failedDelegations++;
        }

        // Compter les délégations par agent
        const currentCount = agentCounts.get(record.to) || 0;
        agentCounts.set(record.to, currentCount + 1);

        // Statistiques par agent
        if (!stats.agentStats.has(record.to)) {
          stats.agentStats.set(record.to, { success: 0, failure: 0 });
        }
        
        const agentStat = stats.agentStats.get(record.to)!;
        if (record.success) {
          agentStat.success++;
        } else {
          agentStat.failure++;
        }
      });
    }

    // Trouver l'agent le plus délégué
    let maxCount = 0;
    for (const [agentId, count] of agentCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        stats.mostDelegatedAgent = agentId;
      }
    }

    // Calculer le temps de réponse moyen
    if (stats.totalDelegations > 0) {
      stats.averageResponseTime = totalResponseTime / stats.totalDelegations;
    }

    return stats;
  }

  /**
   * Effacer l'historique des délégations
   */
  clearDelegationHistory(conversationId?: string): void {
    if (conversationId) {
      this.delegationHistory.delete(conversationId);
    } else {
      this.delegationHistory.clear();
    }
  }
}
