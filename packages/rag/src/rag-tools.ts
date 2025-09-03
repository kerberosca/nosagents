import { OptimizedRAGManager } from './rag-manager-optimized';
import { DocumentMetadata } from './types';

export interface RAGToolConfig {
  ollamaUrl?: string;
  textModel?: string;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  maxSearchResults?: number;
  maxConcurrentEmbeddings?: number;
  batchSize?: number;
  memoryLimit?: number;
  enableStreaming?: boolean;
  cacheEmbeddings?: boolean;
}

export interface RAGSearchParams {
  query: string;
  knowledgePack?: string;
  maxResults?: number;
  language?: string;
}

export interface RAGAnswerParams {
  query: string;
  knowledgePack?: string;
  style?: 'simple' | 'detailed' | 'academic';
  language?: string;
  maxContextDocuments?: number;
}

export interface RAGDocumentParams {
  content: string;
  metadata: Partial<DocumentMetadata>;
  knowledgePack: string;
}

export interface RAGToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    memoryUsage: number;
    documentsProcessed?: number;
  };
}

export class RAGTools {
  private ragManager: OptimizedRAGManager;
  private isInitialized: boolean = false;

  constructor(config: RAGToolConfig = {}) {
    this.ragManager = new OptimizedRAGManager(config);
  }

  /**
   * Initialise le système RAG
   */
  async initialize(): Promise<RAGToolResult> {
    const startTime = Date.now();
    
    try {
      await this.ragManager.initialize();
      this.isInitialized = true;
      
      return {
        success: true,
        data: { message: 'RAG system initialized successfully' },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: this.ragManager.getStats().memoryUsage,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize RAG system: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: 0,
        }
      };
    }
  }

  /**
   * Outil pour rechercher des informations dans la base de connaissances
   */
  async searchKnowledge(params: RAGSearchParams): Promise<RAGToolResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RAG system not initialized. Call initialize() first.',
      };
    }

    const startTime = Date.now();
    
    try {
      const searchResults = await this.ragManager.search({
        query: params.query,
        knowledgePack: params.knowledgePack,
        maxResults: params.maxResults || 5,
      });

      const stats = this.ragManager.getStats();
      
      return {
        success: true,
        data: {
          results: searchResults,
          totalFound: searchResults.length,
          query: params.query,
          knowledgePack: params.knowledgePack,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: stats.memoryUsage,
          documentsProcessed: stats.totalDocuments,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: this.ragManager.getStats().memoryUsage,
        }
      };
    }
  }

  /**
   * Outil pour générer une réponse RAG complète
   */
  async generateRAGAnswer(params: RAGAnswerParams): Promise<RAGToolResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RAG system not initialized. Call initialize() first.',
      };
    }

    const startTime = Date.now();
    
    try {
      const fullResponse = await this.ragManager.searchAndAnswer(
        params.query,
        { 
          knowledgePack: params.knowledgePack,
          maxResults: params.maxContextDocuments || 3,
        }
      );

      const stats = this.ragManager.getStats();
      
      return {
        success: true,
        data: {
          answer: fullResponse.answer,
          searchResults: fullResponse.searchResults,
          query: params.query,
          style: params.style,
          language: params.language,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: stats.memoryUsage,
          documentsProcessed: stats.totalDocuments,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Answer generation failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: this.ragManager.getStats().memoryUsage,
        }
      };
    }
  }

  /**
   * Outil pour ajouter un document à la base de connaissances
   */
  async addDocument(params: RAGDocumentParams): Promise<RAGToolResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RAG system not initialized. Call initialize() first.',
      };
    }

    const startTime = Date.now();
    
    try {
      const docId = await this.ragManager.addDocument(
        params.content,
        params.metadata,
        params.knowledgePack
      );

      const stats = this.ragManager.getStats();
      
      return {
        success: true,
        data: {
          documentId: docId,
          message: 'Document added successfully',
          knowledgePack: params.knowledgePack,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: stats.memoryUsage,
          documentsProcessed: stats.totalDocuments,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Document addition failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: this.ragManager.getStats().memoryUsage,
        }
      };
    }
  }

  /**
   * Outil pour créer un nouveau pack de connaissances
   */
  async createKnowledgePack(name: string, description: string): Promise<RAGToolResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RAG system not initialized. Call initialize() first.',
      };
    }

    const startTime = Date.now();
    
    try {
      await this.ragManager.createKnowledgePack(name, description);
      
      const stats = this.ragManager.getStats();
      
      return {
        success: true,
        data: {
          message: `Knowledge pack "${name}" created successfully`,
          name,
          description,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: stats.memoryUsage,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Knowledge pack creation failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: this.ragManager.getStats().memoryUsage,
        }
      };
    }
  }

  /**
   * Outil pour obtenir des statistiques du système RAG
   */
  async getSystemStats(): Promise<RAGToolResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RAG system not initialized. Call initialize() first.',
      };
    }

    try {
      const stats = this.ragManager.getStats();
      
      return {
        success: true,
        data: {
          totalDocuments: stats.totalDocuments,
          totalChunks: stats.totalChunks,
          knowledgePacks: stats.knowledgePacks,
          totalEmbeddings: stats.totalEmbeddings,
          memoryUsage: stats.memoryUsage,
          cacheSize: stats.cacheSize,
          lastGarbageCollection: stats.lastGarbageCollection,
        },
        metadata: {
          executionTime: 0,
          memoryUsage: stats.memoryUsage,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get system stats: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Outil pour nettoyer la mémoire et le cache
   */
  async cleanupMemory(): Promise<RAGToolResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'RAG system not initialized. Call initialize() first.',
      };
    }

    const startTime = Date.now();
    
    try {
      await this.ragManager.clearCache();
      
      const stats = this.ragManager.getStats();
      
      return {
        success: true,
        data: {
          message: 'Memory cleanup completed successfully',
          memoryUsage: stats.memoryUsage,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: stats.memoryUsage,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Memory cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsage: this.ragManager.getStats().memoryUsage,
        }
      };
    }
  }

  /**
   * Vérifie si le système est initialisé
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Obtient le gestionnaire RAG sous-jacent (pour usage avancé)
   */
  getRAGManager(): OptimizedRAGManager {
    return this.ragManager;
  }
}
