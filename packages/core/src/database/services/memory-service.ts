import { prisma } from '../client';
import { Memory, Agent } from '@prisma/client';

export interface CreateMemoryData {
  agentId: string;
  type: 'conversation' | 'fact' | 'experience' | 'knowledge';
  content: string;
  metadata?: Record<string, any>;
  importance?: number; // 1-10
  expiresAt?: Date;
}

export interface UpdateMemoryData extends Partial<CreateMemoryData> {
  id: string;
}

export interface MemoryWithAgent extends Memory {
  agent: Agent;
}

export interface MemorySearchParams {
  agentId?: string;
  type?: string;
  query?: string;
  limit?: number;
  offset?: number;
  importance?: number;
}

export class MemoryService {
  /**
   * Créer une nouvelle mémoire
   */
  async createMemory(data: CreateMemoryData): Promise<Memory> {
    return await prisma.memory.create({
      data: {
        agentId: data.agentId,
        type: data.type,
        content: data.content,
        metadata: data.metadata || {},
        importance: data.importance || 5,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Récupérer une mémoire par ID
   */
  async getMemoryById(id: string): Promise<Memory | null> {
    return await prisma.memory.findUnique({
      where: { id },
      include: { agent: true },
    });
  }

  /**
   * Récupérer toutes les mémoires d'un agent
   */
  async getMemoriesByAgent(agentId: string, params?: MemorySearchParams): Promise<Memory[]> {
    const where: any = { agentId };
    
    if (params?.type) {
      where.type = params.type;
    }
    
    if (params?.importance) {
      where.importance = { gte: params.importance };
    }

    return await prisma.memory.findMany({
      where,
      include: { agent: true },
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' },
      ],
      take: params?.limit || 100,
      skip: params?.offset || 0,
    });
  }

  /**
   * Rechercher dans les mémoires
   */
  async searchMemories(params: MemorySearchParams): Promise<Memory[]> {
    const where: any = {};
    
    if (params.agentId) {
      where.agentId = params.agentId;
    }
    
    if (params.type) {
      where.type = params.type;
    }
    
    if (params.query) {
      where.OR = [
        { content: { contains: params.query, mode: 'insensitive' } },
        { metadata: { path: ['$'], string_contains: params.query } },
      ];
    }
    
    if (params.importance) {
      where.importance = { gte: params.importance };
    }

    return await prisma.memory.findMany({
      where,
      include: { agent: true },
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' },
      ],
      take: params.limit || 50,
      skip: params.offset || 0,
    });
  }

  /**
   * Mettre à jour une mémoire
   */
  async updateMemory(id: string, data: UpdateMemoryData): Promise<Memory> {
    const { id: _, ...updateData } = data;
    
    return await prisma.memory.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Supprimer une mémoire
   */
  async deleteMemory(id: string): Promise<Memory> {
    return await prisma.memory.delete({
      where: { id },
    });
  }

  /**
   * Supprimer toutes les mémoires d'un agent
   */
  async deleteMemoriesByAgent(agentId: string): Promise<{ count: number }> {
    return await prisma.memory.deleteMany({
      where: { agentId },
    });
  }

  /**
   * Nettoyer les mémoires expirées
   */
  async cleanupExpiredMemories(): Promise<{ count: number }> {
    return await prisma.memory.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Obtenir les statistiques de mémoire
   */
  async getMemoryStats(agentId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    averageImportance: number;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  }> {
    const where = agentId ? { agentId } : {};
    
    const [total, byType, avgImportance, oldest, newest] = await Promise.all([
      prisma.memory.count({ where }),
      prisma.memory.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      prisma.memory.aggregate({
        where,
        _avg: { importance: true },
      }),
      prisma.memory.findFirst({
        where,
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.memory.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const byTypeMap = byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byType: byTypeMap,
      averageImportance: avgImportance._avg.importance || 0,
      oldestMemory: oldest?.createdAt || null,
      newestMemory: newest?.createdAt || null,
    };
  }

  /**
   * Créer une mémoire de conversation
   */
  async createConversationMemory(
    agentId: string,
    conversationId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<Memory> {
    return await this.createMemory({
      agentId,
      type: 'conversation',
      content,
      metadata: {
        ...metadata,
        conversationId,
        timestamp: new Date().toISOString(),
      },
      importance: 7,
    });
  }

  /**
   * Créer une mémoire de fait
   */
  async createFactMemory(
    agentId: string,
    fact: string,
    source?: string,
    importance: number = 8
  ): Promise<Memory> {
    return await this.createMemory({
      agentId,
      type: 'fact',
      content: fact,
      metadata: {
        source,
        timestamp: new Date().toISOString(),
      },
      importance,
    });
  }

  /**
   * Créer une mémoire d'expérience
   */
  async createExperienceMemory(
    agentId: string,
    experience: string,
    outcome: 'success' | 'failure' | 'neutral',
    metadata?: Record<string, any>
  ): Promise<Memory> {
    return await this.createMemory({
      agentId,
      type: 'experience',
      content: experience,
      metadata: {
        ...metadata,
        outcome,
        timestamp: new Date().toISOString(),
      },
      importance: outcome === 'success' ? 9 : 6,
    });
  }
}
