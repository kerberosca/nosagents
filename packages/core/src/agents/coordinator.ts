import { Agent, AgentMessage, AgentResponse, ToolCall } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ModelProvider } from '../models/model-provider';
import { ToolRegistry } from '../tools/tool-registry';
import { MemoryManager } from '../memory/memory-manager';
import { DelegationManager } from '../delegation/delegation-manager';
import { DelegationPolicy } from '../delegation/delegation-policy';
import { ConversationContext } from '../delegation/conversation-context';

export interface CoordinatorConfig {
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  delegationPolicy: DelegationPolicy;
  maxDelegations: number;
  timeoutMs: number;
}

export interface DelegationDecision {
  shouldDelegate: boolean;
  targetAgentId?: string;
  reason: string;
  confidence: number;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  task: string;
  dependencies: string[];
  requiredTools: string[];
  expectedOutput: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  entryPoint: string;
  exitConditions: string[];
}

export class Coordinator {
  private config: CoordinatorConfig;
  private modelProvider: ModelProvider;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;
  private delegationManager: DelegationManager;
  private availableAgents: Map<string, Agent>;
  private activeWorkflows: Map<string, Workflow>;
  private conversationContexts: Map<string, ConversationContext>;

  constructor(
    config: CoordinatorConfig,
    modelProvider: ModelProvider,
    toolRegistry: ToolRegistry,
    memoryManager: MemoryManager,
    delegationManager: DelegationManager
  ) {
    this.config = config;
    this.modelProvider = modelProvider;
    this.toolRegistry = toolRegistry;
    this.memoryManager = memoryManager;
    this.delegationManager = delegationManager;
    this.availableAgents = new Map();
    this.activeWorkflows = new Map();
    this.conversationContexts = new Map();
  }

  /**
   * Ajouter un agent disponible pour la délégation
   */
  addAgent(agent: Agent): void {
    this.availableAgents.set(agent.id, agent);
  }

  /**
   * Supprimer un agent de la liste des agents disponibles
   */
  removeAgent(agentId: string): void {
    this.availableAgents.delete(agentId);
  }

  /**
   * Obtenir la liste des agents disponibles
   */
  getAvailableAgents(): Agent[] {
    return Array.from(this.availableAgents.values());
  }

  /**
   * Analyser un message et décider s'il faut déléguer
   */
  async analyzeDelegation(
    message: AgentMessage,
    conversationId: string
  ): Promise<DelegationDecision> {
    const context = this.getOrCreateContext(conversationId);
    
    // Analyser le contenu du message
    const analysis = await this.analyzeMessage(message);
    
    // Vérifier les politiques de délégation
    const policyCheck = this.config.delegationPolicy.evaluate(
      message,
      analysis,
      this.availableAgents,
      context
    );

    // Décider de la délégation
    if (policyCheck.shouldDelegate && policyCheck.targetAgentId) {
      const targetAgent = this.availableAgents.get(policyCheck.targetAgentId);
      if (targetAgent) {
        return {
          shouldDelegate: true,
          targetAgentId: policyCheck.targetAgentId,
          reason: policyCheck.reason,
          confidence: policyCheck.confidence
        };
      }
    }

    return {
      shouldDelegate: false,
      reason: 'No suitable agent found or delegation not needed',
      confidence: 0.8
    };
  }

  /**
   * Déléguer une tâche à un agent spécifique
   */
  async delegateTask(
    message: AgentMessage,
    targetAgentId: string,
    conversationId: string
  ): Promise<AgentResponse> {
    const targetAgent = this.availableAgents.get(targetAgentId);
    if (!targetAgent) {
      throw new Error(`Agent ${targetAgentId} not found`);
    }

    const context = this.getOrCreateContext(conversationId);
    
    // Préparer le contexte pour la délégation
    const delegationContext = {
      originalMessage: message,
      coordinatorContext: context.getSharedContext(),
      delegationHistory: context.getDelegationHistory()
    };

    // Effectuer la délégation
    const response = await this.delegationManager.delegate(
      targetAgent,
      message,
      delegationContext
    );

    // Mettre à jour le contexte
    context.addDelegation({
      from: 'coordinator',
      to: targetAgentId,
      message: message,
      response: response,
      timestamp: new Date(),
      success: true
    });

    return response;
  }

  /**
   * Gérer une conversation multi-agents
   */
  async handleMultiAgentConversation(
    message: AgentMessage,
    conversationId: string,
    workflowId?: string
  ): Promise<AgentResponse> {
    const context = this.getOrCreateContext(conversationId);
    
    // Si un workflow est spécifié, l'exécuter
    if (workflowId) {
      return this.executeWorkflow(workflowId, message, conversationId);
    }

    // Analyser la délégation
    const delegationDecision = await this.analyzeDelegation(message, conversationId);
    
    if (delegationDecision.shouldDelegate && delegationDecision.targetAgentId) {
      // Déléguer à l'agent approprié
      const response = await this.delegateTask(
        message,
        delegationDecision.targetAgentId,
        conversationId
      );

      // Ajouter une note du coordinateur
      return {
        ...response,
        content: `🤖 **Délégation effectuée**\n\n${response.content}\n\n*Délégé à ${delegationDecision.targetAgentId} (${delegationDecision.reason})*`
      };
    }

    // Traiter localement si aucune délégation n'est nécessaire
    return this.processLocally(message, conversationId);
  }

  /**
   * Exécuter un workflow multi-agents
   */
  async executeWorkflow(
    workflowId: string,
    initialMessage: AgentMessage,
    conversationId: string
  ): Promise<AgentResponse> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const context = this.getOrCreateContext(conversationId);
    const results: Map<string, any> = new Map();
    
    // Exécuter les étapes du workflow
    for (const step of workflow.steps) {
      // Vérifier les dépendances
      const dependenciesMet = step.dependencies.every(dep => results.has(dep));
      if (!dependenciesMet) {
        throw new Error(`Dependencies not met for step ${step.id}`);
      }

      // Préparer le message pour cette étape
      const stepMessage: AgentMessage = {
        ...initialMessage,
        content: step.task,
        metadata: {
          ...initialMessage.metadata,
          workflowStep: step.id,
          dependencies: results
        }
      };

      // Déléguer à l'agent de l'étape
      const stepResponse = await this.delegateTask(
        stepMessage,
        step.agentId,
        conversationId
      );

      results.set(step.id, stepResponse);
    }

    // Synthétiser les résultats
    return this.synthesizeWorkflowResults(workflow, results, initialMessage);
  }

  /**
   * Traiter un message localement (sans délégation)
   */
  private async processLocally(
    message: AgentMessage,
    conversationId: string
  ): Promise<AgentResponse> {
    const context = this.getOrCreateContext(conversationId);
    
    // Utiliser le modèle du coordinateur
    const modelResponse = await this.modelProvider.generateResponse(
      message.content,
      this.config.model
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

    // Mettre à jour le contexte
    context.addMessage(message, response);

    return response;
  }

  /**
   * Analyser le contenu d'un message pour la délégation
   */
  private async analyzeMessage(message: AgentMessage): Promise<any> {
    const analysisPrompt = `
Analyze the following message to determine:
1. The type of task (technical, creative, analytical, etc.)
2. Required expertise (programming, writing, analysis, etc.)
3. Complexity level (simple, moderate, complex)
4. Required tools or capabilities
5. Whether it requires specialized knowledge

Message: ${message.content}

Provide your analysis as JSON.
`;

    const analysis = await this.modelProvider.generateResponse(
      analysisPrompt,
      this.config.model
    );

    try {
      return JSON.parse(analysis.content);
    } catch {
      return { type: 'general', complexity: 'moderate' };
    }
  }

  /**
   * Synthétiser les résultats d'un workflow
   */
  private async synthesizeWorkflowResults(
    workflow: Workflow,
    results: Map<string, AgentResponse>,
    originalMessage: AgentMessage
  ): Promise<AgentResponse> {
    const synthesisPrompt = `
Synthesize the results from a multi-agent workflow:

Original request: ${originalMessage.content}

Workflow steps completed:
${workflow.steps.map(step => `- ${step.id}: ${step.task}`).join('\n')}

Results:
${Array.from(results.entries()).map(([stepId, response]) => 
  `- ${stepId}: ${response.content}`
).join('\n')}

Provide a comprehensive response that combines all the results.
`;

    const synthesis = await this.modelProvider.generateResponse(
      synthesisPrompt,
      this.config.model
    );

    return {
      id: uuidv4(),
      content: `🤖 **Workflow ${workflow.name} terminé**\n\n${synthesis.content}`,
      metadata: {
        workflowId: workflow.id,
        stepsCompleted: Array.from(results.keys()),
        originalMessage: originalMessage
      },
      timestamp: new Date()
    };
  }

  /**
   * Obtenir ou créer un contexte de conversation
   */
  private getOrCreateContext(conversationId: string): ConversationContext {
    if (!this.conversationContexts.has(conversationId)) {
      this.conversationContexts.set(
        conversationId,
        new ConversationContext(conversationId)
      );
    }
    return this.conversationContexts.get(conversationId)!;
  }

  /**
   * Ajouter un workflow
   */
  addWorkflow(workflow: Workflow): void {
    this.activeWorkflows.set(workflow.id, workflow);
  }

  /**
   * Supprimer un workflow
   */
  removeWorkflow(workflowId: string): void {
    this.activeWorkflows.delete(workflowId);
  }

  /**
   * Obtenir les workflows actifs
   */
  getActiveWorkflows(): Workflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Obtenir les statistiques de délégation
   */
  getDelegationStats(): any {
    const stats = {
      totalDelegations: 0,
      successfulDelegations: 0,
      failedDelegations: 0,
      averageConfidence: 0,
      mostDelegatedAgent: null as string | null,
      delegationHistory: [] as any[]
    };

    for (const context of this.conversationContexts.values()) {
      const history = context.getDelegationHistory();
      stats.totalDelegations += history.length;
      
      // Analyser l'historique
      history.forEach(delegation => {
        if (delegation.response) {
          stats.successfulDelegations++;
        } else {
          stats.failedDelegations++;
        }
      });
    }

    return stats;
  }
}
