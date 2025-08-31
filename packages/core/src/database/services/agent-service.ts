import { prisma } from '../client';
import { Agent, Prisma } from '@prisma/client';

export interface CreateAgentData {
  name: string;
  role: string;
  description?: string;
  model?: string;
  goals?: string[];
  tools?: string[];
  knowledgePackIds?: string[];
  authorizations?: Record<string, any>;
  style?: Record<string, any>;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  isActive?: boolean;
}

export class AgentService {
  /**
   * Créer un nouvel agent
   */
  async createAgent(data: CreateAgentData): Promise<Agent> {
    return prisma.agent.create({
      data: {
        name: data.name,
        role: data.role,
        description: data.description,
        model: data.model || 'qwen2.5:7b',
        goals: data.goals || [],
        tools: data.tools || [],
        knowledgePackIds: data.knowledgePackIds || [],
        authorizations: data.authorizations || {},
        style: data.style || {},
      },
    });
  }

  /**
   * Récupérer un agent par son ID
   */
  async getAgentById(id: string): Promise<Agent | null> {
    return prisma.agent.findUnique({
      where: { id },
    });
  }

  /**
   * Récupérer un agent par son nom
   */
  async getAgentByName(name: string): Promise<Agent | null> {
    return prisma.agent.findUnique({
      where: { name },
    });
  }

  /**
   * Récupérer tous les agents actifs
   */
  async getActiveAgents(): Promise<Agent[]> {
    return prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer tous les agents
   */
  async getAllAgents(): Promise<Agent[]> {
    return prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mettre à jour un agent
   */
  async updateAgent(id: string, data: UpdateAgentData): Promise<Agent> {
    return prisma.agent.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un agent (soft delete)
   */
  async deleteAgent(id: string): Promise<Agent> {
    return prisma.agent.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Supprimer définitivement un agent
   */
  async hardDeleteAgent(id: string): Promise<Agent> {
    return prisma.agent.delete({
      where: { id },
    });
  }

  /**
   * Rechercher des agents
   */
  async searchAgents(query: string): Promise<Agent[]> {
    return prisma.agent.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer les agents par modèle
   */
  async getAgentsByModel(model: string): Promise<Agent[]> {
    return prisma.agent.findMany({
      where: {
        model,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer les agents par outil
   */
  async getAgentsByTool(toolName: string): Promise<Agent[]> {
    return prisma.agent.findMany({
      where: {
        tools: {
          has: toolName,
        },
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer les agents par pack de connaissances
   */
  async getAgentsByKnowledgePack(knowledgePackId: string): Promise<Agent[]> {
    return prisma.agent.findMany({
      where: {
        knowledgePackIds: {
          has: knowledgePackId,
        },
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Compter le nombre total d'agents
   */
  async countAgents(): Promise<number> {
    return prisma.agent.count({
      where: { isActive: true },
    });
  }

  /**
   * Compter les agents par modèle
   */
  async countAgentsByModel(): Promise<Array<{ model: string; count: number }>> {
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      select: { model: true },
    });

    const modelCounts = agents.reduce((acc, agent) => {
      acc[agent.model] = (acc[agent.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(modelCounts).map(([model, count]) => ({
      model,
      count,
    }));
  }

  /**
   * Créer plusieurs agents en lot
   */
  async createManyAgents(agents: CreateAgentData[]): Promise<Prisma.BatchPayload> {
    return prisma.agent.createMany({
      data: agents.map(agent => ({
        name: agent.name,
        role: agent.role,
        description: agent.description,
        model: agent.model || 'qwen2.5:7b',
        goals: agent.goals || [],
        tools: agent.tools || [],
        knowledgePackIds: agent.knowledgePackIds || [],
        authorizations: agent.authorizations || {},
        style: agent.style || {},
      })),
    });
  }

  /**
   * Mettre à jour les outils d'un agent
   */
  async updateAgentTools(id: string, tools: string[]): Promise<Agent> {
    return prisma.agent.update({
      where: { id },
      data: { tools },
    });
  }

  /**
   * Mettre à jour les packs de connaissances d'un agent
   */
  async updateAgentKnowledgePacks(id: string, knowledgePackIds: string[]): Promise<Agent> {
    return prisma.agent.update({
      where: { id },
      data: { knowledgePackIds },
    });
  }

  /**
   * Mettre à jour les autorisations d'un agent
   */
  async updateAgentAuthorizations(id: string, authorizations: Record<string, any>): Promise<Agent> {
    return prisma.agent.update({
      where: { id },
      data: { authorizations },
    });
  }
}
