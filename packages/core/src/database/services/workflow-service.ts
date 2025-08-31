import { prisma } from '../client';
import { Workflow, WorkflowExecution, WorkflowParticipant } from '@prisma/client';

export interface CreateWorkflowData {
  name: string;
  description?: string;
  definition: Record<string, any>; // JSON Schema du workflow
  isActive?: boolean;
  maxConcurrentExecutions?: number;
  timeout?: number; // en secondes
}

export interface UpdateWorkflowData extends Partial<CreateWorkflowData> {
  id: string;
}

export interface CreateWorkflowExecutionData {
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateWorkflowExecutionData extends Partial<CreateWorkflowExecutionData> {
  id: string;
}

export interface CreateWorkflowParticipantData {
  workflowId: string;
  agentId: string;
  role: 'coordinator' | 'executor' | 'observer';
  order?: number;
}

export interface WorkflowWithParticipants extends Workflow {
  participants: WorkflowParticipant[];
  _count: {
    executions: number;
    participants: number;
  };
}

export interface WorkflowExecutionWithWorkflow extends WorkflowExecution {
  workflow: Workflow;
  participants: WorkflowParticipant[];
}

export interface WorkflowSearchParams {
  query?: string;
  status?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export class WorkflowService {
  /**
   * Créer un nouveau workflow
   */
  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    return await prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        definition: data.definition,
        isActive: data.isActive ?? true,
        maxConcurrentExecutions: data.maxConcurrentExecutions || 1,
        timeout: data.timeout || 3600, // 1 heure par défaut
      },
    });
  }

  /**
   * Récupérer un workflow par ID
   */
  async getWorkflowById(id: string): Promise<WorkflowWithParticipants | null> {
    return await prisma.workflow.findUnique({
      where: { id },
      include: {
        participants: {
          include: { agent: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            executions: true,
            participants: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer un workflow par nom
   */
  async getWorkflowByName(name: string): Promise<Workflow | null> {
    return await prisma.workflow.findFirst({
      where: { name },
    });
  }

  /**
   * Lister tous les workflows actifs
   */
  async getActiveWorkflows(): Promise<WorkflowWithParticipants[]> {
    return await prisma.workflow.findMany({
      where: { isActive: true },
      include: {
        participants: {
          include: { agent: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            executions: true,
            participants: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Rechercher des workflows
   */
  async searchWorkflows(params: WorkflowSearchParams): Promise<WorkflowWithParticipants[]> {
    const where: any = {};
    
    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }
    
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    return await prisma.workflow.findMany({
      where,
      include: {
        participants: {
          include: { agent: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            executions: true,
            participants: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
    });
  }

  /**
   * Mettre à jour un workflow
   */
  async updateWorkflow(id: string, data: UpdateWorkflowData): Promise<Workflow> {
    const { id: _, ...updateData } = data;
    
    return await prisma.workflow.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Supprimer un workflow
   */
  async deleteWorkflow(id: string): Promise<Workflow> {
    return await prisma.workflow.delete({
      where: { id },
    });
  }

  /**
   * Créer une nouvelle exécution de workflow
   */
  async createWorkflowExecution(data: CreateWorkflowExecutionData): Promise<WorkflowExecution> {
    return await prisma.workflowExecution.create({
      data: {
        workflowId: data.workflowId,
        status: data.status,
        input: data.input || {},
        // metadata: data.metadata || {},
        // startedAt: data.status === 'running' ? new Date() : null,
      },
    });
  }

  /**
   * Récupérer une exécution par ID
   */
  async getWorkflowExecutionById(id: string): Promise<WorkflowExecution | null> {
    return await prisma.workflowExecution.findUnique({
      where: { id },
      include: {
        workflow: true,
        // participants: {
        //   include: { agent: true },
        //   orderBy: { order: 'asc' },
        // },
      },
    });
  }

  /**
   * Récupérer les exécutions d'un workflow
   */
  async getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    return await prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mettre à jour une exécution
   */
  async updateWorkflowExecution(id: string, data: UpdateWorkflowExecutionData): Promise<WorkflowExecution> {
    const { id: _, ...updateData } = data;
    
    // Gérer les timestamps automatiquement
    const timestampUpdates: any = {};
    // if (data.status === 'running' && !updateData.startedAt) {
    //   timestampUpdates.startedAt = new Date();
    // }
    // if (['completed', 'failed', 'cancelled'].includes(data.status || '') && !updateData.completedAt) {
    //   timestampUpdates.completedAt = new Date();
    // }
    
    return await prisma.workflowExecution.update({
      where: { id },
      data: { ...updateData, ...timestampUpdates },
    });
  }

  /**
   * Ajouter un participant à un workflow
   */
  async addWorkflowParticipant(data: CreateWorkflowParticipantData): Promise<WorkflowParticipant> {
    // Déterminer l'ordre automatiquement si non spécifié
    if (data.order === undefined) {
      const existingParticipants = await prisma.workflowParticipant.findMany({
        where: { workflowId: data.workflowId },
        orderBy: { order: 'desc' },
        take: 1,
      });
      data.order = existingParticipants.length > 0 ? existingParticipants[0].order + 1 : 1;
    }

    return await prisma.workflowParticipant.create({
      data: {
        workflowId: data.workflowId,
        agentId: data.agentId,
        role: data.role,
        order: data.order,
      },
      include: { agent: true },
    });
  }

  /**
   * Supprimer un participant d'un workflow
   */
  async removeWorkflowParticipant(workflowId: string, agentId: string): Promise<WorkflowParticipant> {
    return await prisma.workflowParticipant.delete({
      where: {
        workflowId_agentId: {
          workflowId,
          agentId,
        },
      },
    });
  }

  /**
   * Récupérer les participants d'un workflow
   */
  async getWorkflowParticipants(workflowId: string): Promise<WorkflowParticipant[]> {
    return await prisma.workflowParticipant.findMany({
      where: { workflowId },
      include: { agent: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Obtenir les statistiques des workflows
   */
  async getWorkflowStats(): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    runningExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  }> {
    const [
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      runningExecutions,
      completedExecutions,
      failedExecutions,
      avgExecutionTime,
    ] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflow.count({ where: { isActive: true } }),
      prisma.workflowExecution.count(),
      prisma.workflowExecution.count({ where: { status: 'running' } }),
      prisma.workflowExecution.count({ where: { status: 'completed' } }),
      prisma.workflowExecution.count({ where: { status: 'failed' } }),
      // prisma.workflowExecution.aggregate({
      //   where: {
      //     status: 'completed',
      //     // startedAt: { not: null },
      //     // completedAt: { not: null },
      //   },
      //   _avg: {
      //     // _raw: 'EXTRACT(EPOCH FROM (completedAt - startedAt))',
      //   } as any,
      // }),
      Promise.resolve({ _avg: { _raw: 0 } }),
    ]);

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      runningExecutions,
      completedExecutions,
      failedExecutions,
      averageExecutionTime: 0, // avgExecutionTime._avg._raw || 0,
    };
  }

  /**
   * Nettoyer les anciennes exécutions
   */
  async cleanupOldExecutions(daysToKeep: number = 30): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await prisma.workflowExecution.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: ['completed', 'failed', 'cancelled'],
        },
      },
    });
  }

  /**
   * Créer un workflow avec des participants
   */
  async createWorkflowWithParticipants(
    workflowData: CreateWorkflowData,
    participants: Omit<CreateWorkflowParticipantData, 'workflowId'>[]
  ): Promise<WorkflowWithParticipants> {
    return await prisma.workflow.create({
      data: {
        ...workflowData,
        participants: {
          create: participants.map((participant, index) => ({
            ...participant,
            order: participant.order || index + 1,
          })),
        },
      },
      include: {
        participants: {
          include: { agent: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            executions: true,
            participants: true,
          },
        },
      },
    });
  }

  /**
   * Dupliquer un workflow
   */
  async duplicateWorkflow(
    sourceWorkflowId: string,
    newName: string
  ): Promise<WorkflowWithParticipants> {
    const sourceWorkflow = await this.getWorkflowById(sourceWorkflowId);
    if (!sourceWorkflow) {
      throw new Error(`Workflow ${sourceWorkflowId} non trouvé`);
    }

    const newWorkflow = await this.createWorkflow({
      name: newName,
      description: sourceWorkflow.description || undefined,
      definition: sourceWorkflow.definition as Record<string, any>,
      isActive: false, // Nouveau workflow inactif par défaut
      // maxConcurrentExecutions: sourceWorkflow.maxConcurrentExecutions,
      // timeout: sourceWorkflow.timeout,
    });

    // Dupliquer les participants
    const participants = sourceWorkflow.participants.map(p => ({
      agentId: p.agentId,
      role: p.role as 'coordinator' | 'executor' | 'observer',
      order: p.order,
    }));

    await Promise.all(
      participants.map(p => this.addWorkflowParticipant({ ...p, workflowId: newWorkflow.id }))
    );

    return await this.getWorkflowById(newWorkflow.id) as WorkflowWithParticipants;
  }
}
