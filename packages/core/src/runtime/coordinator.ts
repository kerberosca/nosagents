import { Agent } from './agent';
import { Agent as AgentConfig } from '../types';
import { ModelProvider } from '../models/model-provider';
import { ToolRegistry } from '../tools/tool-registry';
import { MemoryManager } from '../memory/memory-manager';
import { Logger } from '../utils/logger';

export interface WorkflowStep {
  agentId: string;
  action: string;
  input?: any;
  dependsOn?: string[];
  timeout?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  steps: Map<string, WorkflowStep>;
  results: Map<string, any>;
  errors: Map<string, string>;
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export class Coordinator {
  private agents: Map<string, Agent> = new Map();
  private modelProvider: ModelProvider;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;
  private logger: Logger;
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();

  constructor(
    modelProvider: ModelProvider,
    toolRegistry: ToolRegistry,
    memoryManager: MemoryManager
  ) {
    this.modelProvider = modelProvider;
    this.toolRegistry = toolRegistry;
    this.memoryManager = memoryManager;
    this.logger = new Logger('Coordinator');
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.getAgentId(), agent);
    this.logger.info(`Agent ${agent.getConfig().name} enregistré dans le coordinateur`);
  }

  unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.logger.warn(`Tentative de désenregistrement d'un agent inexistant dans le coordinateur: ${agentId}`);
      return false;
    }

    this.agents.delete(agentId);
    this.logger.info(`Agent ${agent.getConfig().name} désenregistré du coordinateur (ID: ${agentId})`);
    return true;
  }

  async delegateTask(
    fromAgentId: string,
    toAgentId: string,
    task: string,
    context: { agentId: string; sessionId: string; userId?: string; metadata: Record<string, any> }
  ): Promise<{ content: string; toolCalls: any[]; thoughts: string[]; metadata: Record<string, any> }> {
    this.logger.info(`🚀 Délégation: ${fromAgentId} → ${toAgentId}: ${task}`);

    const targetAgent = this.agents.get(toAgentId);
    if (!targetAgent) {
      throw new Error(`Agent cible ${toAgentId} non trouvé`);
    }

    // Créer un contexte de délégation
    const delegationContext = {
      ...context,
      metadata: {
        ...context.metadata,
        delegatedFrom: fromAgentId,
        delegationTask: task,
        timestamp: new Date().toISOString(),
        delegationChain: [...(context.metadata?.delegationChain || []), fromAgentId],
      },
    };

    try {
      // Exécuter la tâche avec l'agent cible
      const response = await targetAgent.processMessage(task, delegationContext);

      // Enregistrer la délégation réussie
      await this.memoryManager.addMemory({
        agentId: fromAgentId,
        type: 'conversation',
        content: `Délégation vers ${toAgentId} réussie: ${task}`,
        metadata: {
          toAgentId,
          task,
          response: response.content,
          success: true,
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.info(`✅ Délégation réussie: ${fromAgentId} → ${toAgentId}`);
      return response;

    } catch (error) {
      // Enregistrer l'échec de la délégation
      await this.memoryManager.addMemory({
        agentId: fromAgentId,
        type: 'conversation',
        content: `Échec de la délégation vers ${toAgentId}: ${task}`,
        metadata: {
          toAgentId,
          task,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.error(`❌ Échec de la délégation: ${fromAgentId} → ${toAgentId}: ${error}`);
      throw error;
    }
  }

  async orchestrateWorkflow(
    workflowId: string,
    steps: WorkflowStep[],
    input: any,
    context: { sessionId: string; userId?: string; metadata: Record<string, any> }
  ): Promise<WorkflowExecution> {
    this.logger.info(`🚀 Démarrage du workflow ${workflowId} avec ${steps.length} étapes`);

    const execution: WorkflowExecution = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: 'running',
      currentStep: steps[0]?.agentId,
      steps: new Map(steps.map(step => [step.agentId, step])),
      results: new Map(),
      errors: new Map(),
      startedAt: new Date(),
      metadata: { input, context: context || {} },
    };

    this.activeWorkflows.set(execution.id, execution);

    try {
      // Exécuter les étapes séquentiellement
      for (const step of steps) {
        execution.currentStep = step.agentId;
        
        this.logger.info(`📋 Exécution de l'étape: ${step.agentId} - ${step.action}`);

        const agent = this.agents.get(step.agentId);
        if (!agent) {
          throw new Error(`Agent ${step.agentId} non trouvé pour l'étape ${step.action}`);
        }

        // Préparer l'input pour cette étape
        const stepInput = this.prepareStepInput(step, execution.results, input);
        
        // Exécuter l'étape
        const stepContext = {
          agentId: step.agentId,
          sessionId: context.sessionId,
          userId: context.userId,
                  metadata: {
          ...(context.metadata || {}),
          workflowId,
          executionId: execution.id,
          step: step.action,
          stepInput,
        },
        };

        const stepResult = await agent.processMessage(stepInput, stepContext);
        
        // Stocker le résultat
        execution.results.set(step.agentId, stepResult);
        
        this.logger.info(`✅ Étape ${step.agentId} terminée avec succès`);
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      
      this.logger.info(`🎉 Workflow ${workflowId} terminé avec succès`);

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      const currentStep = execution.currentStep || 'unknown';
      execution.errors.set(currentStep, error instanceof Error ? error.message : String(error));
      
      this.logger.error(`💥 Échec du workflow ${workflowId}: ${error}`);
    }

    // Nettoyer
    this.activeWorkflows.delete(execution.id);
    
    return execution;
  }

  private prepareStepInput(step: WorkflowStep, previousResults: Map<string, any>, initialInput: any): string {
    if (step.input) {
      // Si l'étape a un input spécifique, l'utiliser
      return typeof step.input === 'string' ? step.input : JSON.stringify(step.input);
    }

    // Sinon, utiliser le résultat de l'étape précédente ou l'input initial
    if (step.agentId) {
      const previousStepResult = previousResults.get(step.agentId);
      if (previousStepResult) {
        return typeof previousStepResult === 'string' ? previousStepResult : JSON.stringify(previousStepResult);
      }
    }

    return typeof initialInput === 'string' ? initialInput : JSON.stringify(initialInput);
  }

  getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values());
  }

  getWorkflowExecution(executionId: string): WorkflowExecution | undefined {
    return this.activeWorkflows.get(executionId);
  }

  cancelWorkflow(executionId: string): boolean {
    const execution = this.activeWorkflows.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      this.activeWorkflows.delete(executionId);
      this.logger.info(`⏹️ Workflow ${executionId} annulé`);
      return true;
    }
    return false;
  }
}
