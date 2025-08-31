import { prisma } from '../client';
import { Conversation, Message, Agent } from '@prisma/client';

export interface CreateConversationData {
  title?: string;
  agentId: string;
  userId?: string;
}

export interface CreateMessageData {
  conversationId: string;
  agentId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface ConversationWithMessages extends Conversation {
  agent: Agent;
  messages: Message[];
  _count: {
    messages: number;
  };
}

export class ConversationService {
  /**
   * Créer une nouvelle conversation
   */
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        title: data.title,
        agentId: data.agentId,
        userId: data.userId,
      },
    });
  }

  /**
   * Récupérer une conversation par son ID
   */
  async getConversationById(id: string): Promise<ConversationWithMessages | null> {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  /**
   * Récupérer toutes les conversations d'un agent
   */
  async getConversationsByAgent(agentId: string): Promise<ConversationWithMessages[]> {
    return prisma.conversation.findMany({
      where: { agentId, isActive: true },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Récupérer toutes les conversations d'un utilisateur
   */
  async getConversationsByUser(userId: string): Promise<ConversationWithMessages[]> {
    return prisma.conversation.findMany({
      where: { userId, isActive: true },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Récupérer toutes les conversations actives
   */
  async getActiveConversations(): Promise<ConversationWithMessages[]> {
    return prisma.conversation.findMany({
      where: { isActive: true },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Mettre à jour une conversation
   */
  async updateConversation(id: string, data: Partial<CreateConversationData>): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data,
    });
  }

  /**
   * Fermer une conversation (soft delete)
   */
  async closeConversation(id: string): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Supprimer définitivement une conversation
   */
  async deleteConversation(id: string): Promise<Conversation> {
    return prisma.conversation.delete({
      where: { id },
    });
  }

  /**
   * Ajouter un message à une conversation
   */
  async addMessage(data: CreateMessageData): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        agentId: data.agentId,
        role: data.role,
        content: data.content,
        metadata: data.metadata || {},
      },
    });

    // Mettre à jour la date de modification de la conversation
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Récupérer un message par son ID
   */
  async getMessageById(id: string): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id },
    });
  }

  /**
   * Mettre à jour un message
   */
  async updateMessage(id: string, data: Partial<CreateMessageData>): Promise<Message> {
    return prisma.message.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(id: string): Promise<Message> {
    return prisma.message.delete({
      where: { id },
    });
  }

  /**
   * Récupérer les derniers messages d'une conversation
   */
  async getRecentMessages(conversationId: string, limit: number = 10): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Rechercher des conversations
   */
  async searchConversations(query: string): Promise<ConversationWithMessages[]> {
    return prisma.conversation.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          {
            messages: {
              some: {
                content: { contains: query, mode: 'insensitive' },
              },
            },
          },
        ],
        isActive: true,
      },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Compter le nombre total de conversations
   */
  async countConversations(): Promise<number> {
    return prisma.conversation.count({
      where: { isActive: true },
    });
  }

  /**
   * Compter le nombre de messages par conversation
   */
  async countMessagesByConversation(conversationId: string): Promise<number> {
    return prisma.message.count({
      where: { conversationId },
    });
  }

  /**
   * Récupérer les statistiques des conversations
   */
  async getConversationStats() {
    const totalConversations = await this.countConversations();
    const totalMessages = await prisma.message.count();
    const activeAgents = await prisma.agent.count({
      where: { isActive: true },
    });

    return {
      totalConversations,
      totalMessages,
      activeAgents,
      averageMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
    };
  }

  /**
   * Nettoyer les anciennes conversations (utile pour la maintenance)
   */
  async cleanupOldConversations(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.conversation.updateMany({
      where: {
        updatedAt: { lt: cutoffDate },
        isActive: true,
      },
      data: { isActive: false },
    });

    return result.count;
  }
}
