import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DatabaseService {
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  constructor() {
    // Créer une nouvelle instance PrismaClient
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('✅ Connexion à la base de données PostgreSQL établie');
      
      // Test de la connexion
      await this.testConnection();
    } catch (error) {
      logger.error('❌ Erreur de connexion à la base de données:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('🔌 Déconnexion de la base de données PostgreSQL');
    } catch (error) {
      logger.error('❌ Erreur lors de la déconnexion:', error);
    }
  }

  private async testConnection(): Promise<void> {
    try {
      // Test simple : compter les agents
      const agentCount = await this.prisma.agent.count();
      logger.info(`📊 Test de connexion réussi - ${agentCount} agents trouvés dans la base`);
      
      // Test des autres tables
      const toolCount = await this.prisma.tool.count();
      const userCount = await this.prisma.user.count();
      const conversationCount = await this.prisma.conversation.count();
      
      logger.info(`📊 État de la base de données:
        - Agents: ${agentCount}
        - Outils: ${toolCount}
        - Utilisateurs: ${userCount}
        - Conversations: ${conversationCount}`);
    } catch (error) {
      logger.error('❌ Test de connexion échoué:', error);
      throw error;
    }
  }

  // Getters pour les modèles Prisma
  get agents() {
    return this.prisma.agent;
  }

  get tools() {
    return this.prisma.tool;
  }

  get users() {
    return this.prisma.user;
  }

  get conversations() {
    return this.prisma.conversation;
  }

  get messages() {
    return this.prisma.message;
  }

  get toolCalls() {
    return this.prisma.toolCall;
  }

  get knowledgePacks() {
    return this.prisma.knowledgePack;
  }

  get documents() {
    return this.prisma.document;
  }

  get workflows() {
    return this.prisma.workflow;
  }

  get systemLogs() {
    return this.prisma.systemLog;
  }

  // Méthodes utilitaires
  async getHealthStatus(): Promise<{ status: string; details: any }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', details: { error: 'Base de données non connectée' } };
      }

      const startTime = Date.now();
      
      // Test de performance avec une requête simple
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        details: {
          responseTime,
          isConnected: this.isConnected,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async getDatabaseStats(): Promise<any> {
    try {
      const [
        agentCount,
        toolCount,
        userCount,
        conversationCount,
        messageCount,
        toolCallCount
      ] = await Promise.all([
        this.prisma.agent.count(),
        this.prisma.tool.count(),
        this.prisma.user.count(),
        this.prisma.conversation.count(),
        this.prisma.message.count(),
        this.prisma.toolCall.count()
      ]);

      return {
        agents: agentCount,
        tools: toolCount,
        users: userCount,
        conversations: conversationCount,
        messages: messageCount,
        toolCalls: toolCallCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  get isDatabaseConnected(): boolean {
    return this.isConnected;
  }
}

// Instance singleton
export const databaseService = new DatabaseService();
