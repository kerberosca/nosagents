import { MemoryService, CreateMemoryData, MemorySearchParams } from '../database/services/memory-service';
import { Logger } from '../utils/logger';

export interface MemoryConfig {
  maxMemories?: number;
  importanceThreshold?: number;
  autoCleanup?: boolean;
  cleanupInterval?: number; // en millisecondes
}

export interface MemoryQuery {
  agentId: string;
  query?: string;
  types?: string[];
  limit?: number;
  importance?: number;
}

export interface MemoryResult {
  memories: any[];
  relevance: number;
  context: string;
}

export class MemoryManager {
  private memoryService: MemoryService;
  private logger: Logger;
  private config: MemoryConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: MemoryConfig = {}) {
    this.memoryService = new MemoryService();
    this.logger = new Logger('MemoryManager');
    this.config = {
      maxMemories: 1000,
      importanceThreshold: 5,
      autoCleanup: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 heures
      ...config,
    };

    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Ajouter une mémoire
   */
  async addMemory(data: CreateMemoryData): Promise<any> {
    try {
      const memory = await this.memoryService.createMemory(data);
      this.logger.info(`Memory added for agent ${data.agentId}`, {
        type: data.type,
        importance: data.importance,
      });
      return memory;
    } catch (error) {
      this.logger.error('Failed to add memory', error);
      throw error;
    }
  }

  /**
   * Sauvegarder un message (méthode temporaire pour compatibilité)
   */
  async saveMessage(message: any): Promise<any> {
    try {
      // Pour l'instant, on sauvegarde comme une mémoire de conversation
      const memoryData: CreateMemoryData = {
        agentId: message.agentId,
        type: 'conversation',
        content: message.content,
        metadata: {
          messageType: message.type,
          timestamp: message.timestamp,
          ...message.metadata,
        },
        importance: 5,
      };
      
      return await this.addMemory(memoryData);
    } catch (error) {
      this.logger.error('Failed to save message', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique de conversation (méthode temporaire pour compatibilité)
   */
  async getConversationHistory(sessionId: string, limit: number = 10): Promise<any[]> {
    try {
      // Pour l'instant, on retourne un tableau vide
      // Cette méthode sera implémentée plus tard avec un vrai système de conversation
      this.logger.debug(`Getting conversation history for session ${sessionId}, limit: ${limit}`);
      return [];
    } catch (error) {
      this.logger.error('Failed to get conversation history', error);
      return [];
    }
  }

  /**
   * Récupérer des mémoires pertinentes
   */
  async getRelevantMemories(query: MemoryQuery): Promise<MemoryResult> {
    try {
      const searchParams: MemorySearchParams = {
        agentId: query.agentId,
        query: query.query,
        limit: query.limit || 10,
        importance: query.importance || this.config.importanceThreshold,
      };

      const memories = await this.memoryService.searchMemories(searchParams);
      
      // Filtrer par type si spécifié
      const filteredMemories = query.types 
        ? memories.filter(m => query.types!.includes(m.type))
        : memories;

      // Calculer la pertinence basée sur l'importance et la récence
      const relevantMemories = filteredMemories
        .map(memory => ({
          ...memory,
          relevance: this.calculateRelevance(memory),
        }))
        .sort((a, b) => b.relevance - a.relevance);

      // Générer un contexte à partir des mémoires
      const context = this.generateContext(relevantMemories);

      return {
        memories: relevantMemories,
        relevance: relevantMemories.length > 0 ? relevantMemories[0].relevance : 0,
        context,
      };
    } catch (error) {
      this.logger.error('Failed to get relevant memories', error);
      return {
        memories: [],
        relevance: 0,
        context: '',
      };
    }
  }

  /**
   * Ajouter une mémoire de conversation
   */
  async addConversationMemory(
    agentId: string,
    conversationId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return await this.addMemory({
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
   * Ajouter une mémoire de fait
   */
  async addFactMemory(
    agentId: string,
    fact: string,
    source?: string,
    importance: number = 8
  ): Promise<any> {
    return await this.addMemory({
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
   * Ajouter une mémoire d'expérience
   */
  async addExperienceMemory(
    agentId: string,
    experience: string,
    outcome: 'success' | 'failure' | 'neutral',
    metadata?: Record<string, any>
  ): Promise<any> {
    return await this.addMemory({
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

  /**
   * Ajouter une mémoire de connaissance
   */
  async addKnowledgeMemory(
    agentId: string,
    knowledge: string,
    source: string,
    importance: number = 8
  ): Promise<any> {
    return await this.addMemory({
      agentId,
      type: 'knowledge',
      content: knowledge,
      metadata: {
        source,
        timestamp: new Date().toISOString(),
      },
      importance,
    });
  }

  /**
   * Rechercher dans les mémoires
   */
  async searchMemories(params: MemorySearchParams): Promise<any[]> {
    try {
      return await this.memoryService.searchMemories(params);
    } catch (error) {
      this.logger.error('Failed to search memories', error);
      return [];
    }
  }

  /**
   * Obtenir les statistiques de mémoire
   */
  async getMemoryStats(agentId?: string): Promise<any> {
    try {
      return await this.memoryService.getMemoryStats(agentId);
    } catch (error) {
      this.logger.error('Failed to get memory stats', error);
      return {
        total: 0,
        byType: {},
        averageImportance: 0,
        oldestMemory: null,
        newestMemory: null,
      };
    }
  }

  /**
   * Nettoyer les mémoires expirées
   */
  async cleanupExpiredMemories(): Promise<number> {
    try {
      const result = await this.memoryService.cleanupExpiredMemories();
      this.logger.info(`Cleaned up ${result.count} expired memories`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired memories', error);
      return 0;
    }
  }

  /**
   * Supprimer toutes les mémoires d'un agent
   */
  async clearAgentMemories(agentId: string): Promise<number> {
    try {
      const result = await this.memoryService.deleteMemoriesByAgent(agentId);
      this.logger.info(`Cleared ${result.count} memories for agent ${agentId}`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to clear agent memories', error);
      return 0;
    }
  }

  /**
   * Calculer la pertinence d'une mémoire
   */
  private calculateRelevance(memory: any): number {
    const importance = memory.importance || 5;
    const age = Date.now() - new Date(memory.createdAt).getTime();
    const ageInDays = age / (1000 * 60 * 60 * 24);
    
    // Facteur de décroissance temporelle (mémoires plus récentes = plus pertinentes)
    const timeDecay = Math.exp(-ageInDays / 30); // Décroissance sur 30 jours
    
    // Score de pertinence combinant importance et récence
    const relevance = importance * timeDecay;
    
    return Math.max(0, Math.min(10, relevance));
  }

  /**
   * Générer un contexte à partir des mémoires
   */
  private generateContext(memories: any[]): string {
    if (memories.length === 0) {
      return '';
    }

    const contextParts = memories.slice(0, 5).map(memory => {
      const type = memory.type;
      const content = memory.content.length > 200 
        ? memory.content.substring(0, 200) + '...'
        : memory.content;
      
      return `[${type.toUpperCase()}] ${content}`;
    });

    return contextParts.join('\n\n');
  }

  /**
   * Démarrer le nettoyage automatique
   */
  private startAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredMemories();
      } catch (error) {
        this.logger.error('Auto cleanup failed', error);
      }
    }, this.config.cleanupInterval!);

    this.logger.info('Auto cleanup started', {
      interval: this.config.cleanupInterval,
    });
  }

  /**
   * Arrêter le nettoyage automatique
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
      this.logger.info('Auto cleanup stopped');
    }
  }

  /**
   * Obtenir un résumé des mémoires pour un agent
   */
  async getMemorySummary(agentId: string): Promise<string> {
    try {
      const stats = await this.getMemoryStats(agentId);
      const recentMemories = await this.memoryService.getMemoriesByAgent(agentId, {
        limit: 5,
      });

      const summary = [
        `Mémoires totales: ${stats.total}`,
        `Types: ${Object.entries(stats.byType).map(([type, count]) => `${type}: ${count}`).join(', ')}`,
        `Importance moyenne: ${stats.averageImportance.toFixed(1)}`,
        '',
        'Mémoires récentes:',
        ...recentMemories.map(m => `- [${m.type}] ${m.content.substring(0, 100)}...`),
      ].join('\n');

      return summary;
    } catch (error) {
      this.logger.error('Failed to get memory summary', error);
      return 'Impossible de récupérer le résumé des mémoires';
    }
  }

  /**
   * Nettoyer les ressources
   */
  async dispose(): Promise<void> {
    this.stopAutoCleanup();
    this.logger.info('MemoryManager disposed');
  }
}
