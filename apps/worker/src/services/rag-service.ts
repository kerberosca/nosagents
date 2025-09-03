import { RAGManager } from '@elavira/rag';
import { RAGIndexingJob, DocumentProcessingJob } from '../types';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

export class RAGService {
  private ragManager!: RAGManager;

  constructor() {
    this.initializeRAGManager();
  }

  private async initializeRAGManager(): Promise<void> {
    try {
      this.ragManager = new RAGManager({
        dbPath: process.env.RAG_DB_PATH || './data/vectors',
        tableName: process.env.RAG_TABLE_NAME || 'documents',
        chunkingOptions: {
          chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '1000'),
          chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '200'),
          separator: '\n',
        },
      });

      await this.ragManager.initialize();
      logger.info('RAG service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RAG service:', error);
      // Ne pas lancer l'erreur, laisser le service continuer sans RAG
      this.ragManager = null as any;
    }
  }

  async indexFile(jobData: RAGIndexingJob): Promise<any> {
    try {
      if (!this.ragManager) {
        return {
          success: false,
          error: 'RAG service not available',
          documents: [],
          duration: 0,
          timestamp: new Date(),
        };
      }

      if (!jobData.filePath) {
        throw new Error('File path is required for indexing');
      }

      logger.info('Indexing file:', {
        filePath: jobData.filePath,
        knowledgePackId: jobData.knowledgePackId,
      });

      // Vérifier que le fichier existe
      if (!fs.existsSync(jobData.filePath)) {
        throw new Error(`File not found: ${jobData.filePath}`);
      }

      const startTime = Date.now();
      const documents = await this.ragManager.indexFile(jobData.filePath, jobData.metadata);
      const duration = Date.now() - startTime;

      logger.info('File indexing completed:', {
        filePath: jobData.filePath,
        documentsCount: documents.length,
        duration,
      });

      return {
        success: true,
        documents,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('File indexing failed:', {
        filePath: jobData.filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async indexDirectory(jobData: RAGIndexingJob): Promise<any> {
    try {
      if (!jobData.directoryPath) {
        throw new Error('Directory path is required for indexing');
      }

      logger.info('Indexing directory:', {
        directoryPath: jobData.directoryPath,
        knowledgePackId: jobData.knowledgePackId,
      });

      // Vérifier que le répertoire existe
      if (!fs.existsSync(jobData.directoryPath)) {
        throw new Error(`Directory not found: ${jobData.directoryPath}`);
      }

      const startTime = Date.now();
      const knowledgePack = await this.ragManager.indexDirectory(
        jobData.directoryPath,
        jobData.metadata,
        (progress: any) => {
          logger.info('Indexing progress:', {
            currentFile: progress.currentFile,
            processedFiles: progress.processedFiles,
            totalFiles: progress.totalFiles,
            processedDocuments: progress.processedDocuments,
            totalDocuments: progress.totalDocuments,
          });
        }
      );
      const duration = Date.now() - startTime;

      logger.info('Directory indexing completed:', {
        directoryPath: jobData.directoryPath,
        documentsCount: knowledgePack.documents.length,
        duration,
      });

      return {
        success: true,
        knowledgePack,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
             logger.error('Directory indexing failed:', {
         directoryPath: jobData.directoryPath,
         error: error instanceof Error ? error.message : String(error),
       });
      throw error;
    }
  }

  async search(query: string, filters?: any, k: number = 10): Promise<any> {
    try {
      logger.info('Performing RAG search:', { query: query.substring(0, 100) + '...', filters, k });

      const startTime = Date.now();
      const results = await this.ragManager.searchWithFilters(query, filters, k);
      const duration = Date.now() - startTime;

      logger.info('RAG search completed:', {
        query: query.substring(0, 100) + '...',
        resultsCount: results.length,
        duration,
      });

      return {
        success: true,
        results,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
             logger.error('RAG search failed:', {
         query: query.substring(0, 100) + '...',
         error: error instanceof Error ? error.message : String(error),
       });
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const stats = await this.ragManager.getStats();
      const processors = this.ragManager.listProcessors();
      const isEmbeddingAvailable = await this.ragManager.isEmbeddingProviderAvailable();

      return {
        vectorStore: stats,
        processors,
        embeddingProvider: {
          available: isEmbeddingAvailable,
        },
      };
    } catch (error) {
      logger.error('Failed to get RAG stats:', (error as Error));
      throw error;
    }
  }

  async deleteDocuments(documentIds: string[]): Promise<any> {
    try {
      logger.info('Deleting documents:', { documentIds });

      const startTime = Date.now();
      await this.ragManager.deleteDocuments(documentIds);
      const duration = Date.now() - startTime;

      logger.info('Documents deletion completed:', {
        documentIds,
        duration,
      });

      return {
        success: true,
        deletedCount: documentIds.length,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
             logger.error('Documents deletion failed:', {
         documentIds,
         error: error instanceof Error ? error.message : String(error),
       });
      throw error;
    }
  }

  async clearIndex(): Promise<any> {
    try {
      logger.info('Clearing RAG index');

      const startTime = Date.now();
      await this.ragManager.clear();
      const duration = Date.now() - startTime;

      logger.info('RAG index cleared:', { duration });

      return {
        success: true,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
             logger.error('Failed to clear RAG index:', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  getSupportedExtensions(): string[] {
    return this.ragManager.getSupportedExtensions();
  }
}
