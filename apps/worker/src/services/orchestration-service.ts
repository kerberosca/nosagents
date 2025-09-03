import { AgentManager } from '@elavira/core';
import { Coordinator } from '@elavira/core';
import { logger } from '../utils/logger';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: Array<{
    agentId: string;
    action: string;
    input?: any;
    dependsOn?: string[];
    timeout?: number;
  }>;
  maxConcurrentExecutions: number;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionRequest {
  workflowId: string;
  input: any;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface DelegationRequest {
  fromAgentId: string;
  toAgentId: string;
  task: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class OrchestrationService {
  private agentManager: AgentManager;
  private coordinator: Coordinator;
  private logger: any;
  private activeWorkflows: Map<string, any> = new Map();

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
    this.coordinator = agentManager.getCoordinator();
    this.logger = logger;
  }

  async executeWorkflow(request: WorkflowExecutionRequest): Promise<any> {
    this.logger.info(`🚀 Exécution du workflow ${request.workflowId}`);

    try {
      // Récupérer la définition du workflow
      const workflowDefinition = await this.getWorkflowDefinition(request.workflowId);
      if (!workflowDefinition) {
        throw new Error(`Workflow ${request.workflowId} non trouvé`);
      }

      // Vérifier les limites de concurrence
      if (this.activeWorkflows.has(request.workflowId)) {
        const activeCount = Array.from(this.activeWorkflows.values())
          .filter(w => w.workflowId === request.workflowId).length;
        
        if (activeCount >= workflowDefinition.maxConcurrentExecutions) {
          throw new Error(`Limite de concurrence atteinte pour le workflow ${request.workflowId}`);
        }
      }

      // Exécuter le workflow via le coordinateur
      const execution = await this.coordinator.orchestrateWorkflow(
        request.workflowId,
        workflowDefinition.steps,
        request.input,
        {
          sessionId: request.sessionId,
          userId: request.userId,
          metadata: request.metadata || {},
        }
      );

      // Suivre l'exécution
      this.activeWorkflows.set(execution.id, {
        ...execution,
        workflowId: request.workflowId,
        startedAt: new Date(),
      });

      this.logger.info(`✅ Workflow ${request.workflowId} démarré avec l'ID ${execution.id}`);
      
      return {
        executionId: execution.id,
        status: execution.status,
        workflowId: request.workflowId,
        startedAt: execution.startedAt,
      };

    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'exécution du workflow ${request.workflowId}: ${error}`);
      throw error;
    }
  }

  async delegateTask(request: DelegationRequest): Promise<any> {
    this.logger.info(`🚀 Délégation: ${request.fromAgentId} → ${request.toAgentId}`);

    try {
      const result = await this.coordinator.delegateTask(
        request.fromAgentId,
        request.toAgentId,
        request.task,
        {
          agentId: request.fromAgentId,
          sessionId: request.sessionId,
          userId: request.userId,
          metadata: request.metadata || {},
        }
      );

      this.logger.info(`✅ Délégation réussie: ${request.fromAgentId} → ${request.toAgentId}`);
      
      return {
        success: true,
        fromAgentId: request.fromAgentId,
        toAgentId: request.toAgentId,
        task: request.task,
        response: result.content,
        toolCalls: result.toolCalls,
        metadata: result.metadata,
      };

    } catch (error) {
      this.logger.error(`❌ Échec de la délégation: ${request.fromAgentId} → ${request.toAgentId}: ${error}`);
      
      return {
        success: false,
        fromAgentId: request.fromAgentId,
        toAgentId: request.toAgentId,
        task: request.task,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getWorkflowStatus(executionId: string): Promise<any> {
    const execution = this.coordinator.getWorkflowExecution(executionId);
    if (!execution) {
      throw new Error(`Exécution ${executionId} non trouvée`);
    }

    return {
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      currentStep: execution.currentStep,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      results: Object.fromEntries(execution.results || new Map()),
      errors: Object.fromEntries(execution.errors || new Map()),
      metadata: execution.metadata || {},
    };
  }

  async cancelWorkflow(executionId: string): Promise<boolean> {
    const cancelled = this.coordinator.cancelWorkflow(executionId);
    if (cancelled) {
      this.logger.info(`⏹️ Workflow ${executionId} annulé`);
    }
    return cancelled;
  }

  async getActiveWorkflows(): Promise<any[]> {
    const active = this.coordinator.getActiveWorkflows();
    return active.map(execution => ({
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      currentStep: execution.currentStep,
      startedAt: execution.startedAt,
      progress: this.calculateProgress(execution),
    }));
  }

  private calculateProgress(execution: any): number {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed') return 0;
    
    const totalSteps = execution.steps?.size || 0;
    const completedSteps = execution.results?.size || 0;
    
    if (totalSteps === 0) return 0;
    return Math.round((completedSteps / totalSteps) * 100);
  }

  private async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition | null> {
    // TODO: Implémenter la récupération depuis la base de données
    // Pour l'instant, retourner des workflows prédéfinis
    
    const predefinedWorkflows: Record<string, WorkflowDefinition> = {
      'menu-planning': {
        id: 'menu-planning',
        name: 'Planification de menu',
        description: 'Assistant → Chef pour la création de menus',
        steps: [
          {
            agentId: 'assistant',
            action: 'analyze_request',
            input: 'Analyser la demande de menu et extraire les préférences',
          },
          {
            agentId: 'chef',
            action: 'create_menu',
            input: 'Créer un menu personnalisé basé sur les préférences',
          },
        ],
        maxConcurrentExecutions: 1,
        timeout: 300, // 5 minutes
      },
      'exercise-creation': {
        id: 'exercise-creation',
        name: 'Création d\'exercice',
        description: 'Assistant → Prof pour la création d\'exercices',
        steps: [
          {
            agentId: 'assistant',
            action: 'analyze_request',
            input: 'Analyser la demande d\'exercice et les spécifications',
          },
          {
            agentId: 'prof',
            action: 'create_exercise',
            input: 'Créer un exercice pédagogique adapté',
          },
        ],
        maxConcurrentExecutions: 1,
        timeout: 300,
      },
    };

    return predefinedWorkflows[workflowId] || null;
  }
}
