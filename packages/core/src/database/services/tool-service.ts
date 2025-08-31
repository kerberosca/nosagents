import { prisma } from '../client';
import { Tool, ToolCall } from '@prisma/client';

export interface CreateToolData {
  name: string;
  description: string;
  schema: Record<string, any>; // JSON Schema
}

export interface CreateToolCallData {
  conversationId: string;
  agentId?: string;
  toolId: string;
  name: string;
  arguments: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  duration?: number;
}

export interface ToolWithCalls extends Tool {
  toolCalls: ToolCall[];
  _count: {
    toolCalls: number;
  };
}

export class ToolService {
  /**
   * Créer un nouvel outil
   */
  async createTool(data: CreateToolData): Promise<Tool> {
    return prisma.tool.create({
      data: {
        name: data.name,
        description: data.description,
        schema: data.schema,
      },
    });
  }

  /**
   * Récupérer un outil par son ID
   */
  async getToolById(id: string): Promise<Tool | null> {
    return prisma.tool.findUnique({
      where: { id },
    });
  }

  /**
   * Récupérer un outil par son nom
   */
  async getToolByName(name: string): Promise<Tool | null> {
    return prisma.tool.findUnique({
      where: { name },
    });
  }

  /**
   * Récupérer tous les outils actifs
   */
  async getActiveTools(): Promise<Tool[]> {
    return prisma.tool.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Récupérer tous les outils
   */
  async getAllTools(): Promise<Tool[]> {
    return prisma.tool.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Mettre à jour un outil
   */
  async updateTool(id: string, data: Partial<CreateToolData>): Promise<Tool> {
    return prisma.tool.update({
      where: { id },
      data,
    });
  }

  /**
   * Désactiver un outil (soft delete)
   */
  async deactivateTool(id: string): Promise<Tool> {
    return prisma.tool.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Supprimer définitivement un outil
   */
  async deleteTool(id: string): Promise<Tool> {
    return prisma.tool.delete({
      where: { id },
    });
  }

  /**
   * Rechercher des outils
   */
  async searchTools(query: string): Promise<Tool[]> {
    return prisma.tool.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Compter le nombre total d'outils
   */
  async countTools(): Promise<number> {
    return prisma.tool.count({
      where: { isActive: true },
    });
  }

  /**
   * Créer un appel d'outil
   */
  async createToolCall(data: CreateToolCallData): Promise<ToolCall> {
    return prisma.toolCall.create({
      data: {
        conversationId: data.conversationId,
        agentId: data.agentId,
        toolId: data.toolId,
        name: data.name,
        arguments: data.arguments,
        result: data.result,
        error: data.error,
        duration: data.duration,
      },
    });
  }

  /**
   * Récupérer un appel d'outil par son ID
   */
  async getToolCallById(id: string): Promise<ToolCall | null> {
    return prisma.toolCall.findUnique({
      where: { id },
      include: {
        tool: true,
        agent: true,
        conversation: true,
      },
    });
  }

  /**
   * Récupérer les appels d'outils d'une conversation
   */
  async getToolCallsByConversation(conversationId: string): Promise<ToolCall[]> {
    return prisma.toolCall.findMany({
      where: { conversationId },
      include: {
        tool: true,
        agent: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Récupérer les appels d'outils d'un agent
   */
  async getToolCallsByAgent(agentId: string): Promise<ToolCall[]> {
    return prisma.toolCall.findMany({
      where: { agentId },
      include: {
        tool: true,
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer les appels d'outils d'un outil spécifique
   */
  async getToolCallsByTool(toolId: string): Promise<ToolCall[]> {
    return prisma.toolCall.findMany({
      where: { toolId },
      include: {
        agent: true,
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mettre à jour un appel d'outil
   */
  async updateToolCall(id: string, data: Partial<CreateToolCallData>): Promise<ToolCall> {
    return prisma.toolCall.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un appel d'outil
   */
  async deleteToolCall(id: string): Promise<ToolCall> {
    return prisma.toolCall.delete({
      where: { id },
    });
  }

  /**
   * Récupérer les statistiques d'utilisation des outils
   */
  async getToolUsageStats(): Promise<Array<{ toolName: string; usageCount: number; avgDuration: number }>> {
    const toolCalls = await prisma.toolCall.groupBy({
      by: ['name'],
      _count: {
        id: true,
      },
      _avg: {
        duration: true,
      },
    });

    return toolCalls.map(call => ({
      toolName: call.name,
      usageCount: call._count.id,
      avgDuration: call._avg.duration || 0,
    }));
  }

  /**
   * Récupérer les outils les plus utilisés
   */
  async getMostUsedTools(limit: number = 10): Promise<Array<{ toolName: string; usageCount: number }>> {
    const toolCalls = await prisma.toolCall.groupBy({
      by: ['name'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return toolCalls.map(call => ({
      toolName: call.name,
      usageCount: call._count.id,
    }));
  }

  /**
   * Récupérer les statistiques d'erreurs par outil
   */
  async getToolErrorStats(): Promise<Array<{ toolName: string; totalCalls: number; errorCount: number; errorRate: number }>> {
    const toolCalls = await prisma.toolCall.groupBy({
      by: ['name'],
      _count: {
        id: true,
      },
    });

    return toolCalls.map(call => ({
      toolName: call.name,
      totalCalls: call._count.id,
      errorCount: 0, // call._count.error,
      errorRate: 0, // call._count.id > 0 ? (call._count.error / call._count.id) * 100 : 0,
    }));
  }

  /**
   * Récupérer les appels d'outils récents
   */
  async getRecentToolCalls(limit: number = 50): Promise<ToolCall[]> {
    return prisma.toolCall.findMany({
      include: {
        tool: true,
        agent: true,
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Compter le nombre total d'appels d'outils
   */
  async countToolCalls(): Promise<number> {
    return prisma.toolCall.count();
  }

  /**
   * Compter les appels d'outils par période
   */
  async countToolCallsByPeriod(days: number = 7): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const toolCalls = await prisma.toolCall.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Grouper par jour
    const dailyCounts = toolCalls.reduce((acc, call) => {
      const date = call.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));
  }

  /**
   * Nettoyer les anciens appels d'outils (utile pour la maintenance)
   */
  async cleanupOldToolCalls(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.toolCall.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
