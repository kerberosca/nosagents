import * as fs from 'fs';
import * as path from 'path';
import { ProcessorRegistry } from './processors/processor-registry';
import { VectorStore, VectorStoreOptions, VectorStoreStats } from './indexing/vector-store';
import { LanceDBVectorStore } from './indexing/vector-store';
import { EmbeddingProvider } from './embeddings/embedding-provider';
import { OllamaEmbeddingProvider } from './embeddings/ollama-embeddings';
import { Chunker } from './indexing/chunker';
import { 
  Document, 
  DocumentMetadata, 
  SearchQuery, 
  SearchResult, 
  KnowledgePack,
  ChunkingOptions,
  IndexingOptions 
} from './types';

export interface RAGManagerOptions {
  dbPath?: string;
  tableName?: string;
  embeddingProvider?: EmbeddingProvider;
  chunkingOptions?: ChunkingOptions;
  processorOptions?: any;
}

export interface IndexingProgress {
  totalFiles: number;
  processedFiles: number;
  totalDocuments: number;
  processedDocuments: number;
  currentFile?: string;
  error?: string;
}

export interface IndexingCallback {
  (progress: IndexingProgress): void;
}

export class RAGManager {
  private processorRegistry: ProcessorRegistry;
  private vectorStore: VectorStore;
  private embeddingProvider: EmbeddingProvider;
  private chunker: Chunker;
  private options: RAGManagerOptions;

  constructor(options: RAGManagerOptions = {}) {
    this.options = {
      dbPath: './data/vectors',
      tableName: 'documents',
      ...options,
    };

    // Initialiser les composants
    this.processorRegistry = new ProcessorRegistry(options.processorOptions);
    this.embeddingProvider = options.embeddingProvider || new OllamaEmbeddingProvider();
    this.chunker = new Chunker(options.chunkingOptions || {
      chunkSize: 1000,
      chunkOverlap: 200,
      separator: '\n'
    });
    
    // Initialiser le stockage vectoriel
    const vectorStoreOptions: VectorStoreOptions = {
      dbPath: this.options.dbPath!,
      tableName: this.options.tableName!,
      embeddingDimension: this.embeddingProvider.dimension,
      embeddingProvider: this.embeddingProvider,
    };
    
    this.vectorStore = new LanceDBVectorStore(vectorStoreOptions);
  }

  async initialize(): Promise<void> {
    try {
      // Créer le répertoire de la base de données si nécessaire
      const dbDir = path.dirname(this.options.dbPath!);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialiser le stockage vectoriel
      await this.vectorStore.initialize();

      // Vérifier la disponibilité du fournisseur d'embeddings
      const isAvailable = await this.embeddingProvider.isAvailable();
      if (!isAvailable) {
        console.warn('Le fournisseur d\'embeddings n\'est pas disponible. Certaines fonctionnalités peuvent ne pas fonctionner.');
      }
    } catch (error) {
      throw new Error(`Erreur lors de l'initialisation du RAG Manager: ${error}`);
    }
  }

  async indexDirectory(
    directoryPath: string, 
    metadata?: Partial<DocumentMetadata>,
    progressCallback?: IndexingCallback
  ): Promise<KnowledgePack> {
    try {
      const packId = path.basename(directoryPath);
      const packName = metadata?.title || packId;
      
      const progress: IndexingProgress = {
        totalFiles: 0,
        processedFiles: 0,
        totalDocuments: 0,
        processedDocuments: 0,
      };

      // Compter les fichiers à traiter
      const files = this.getSupportedFiles(directoryPath);
      progress.totalFiles = files.length;

      if (progressCallback) {
        progressCallback(progress);
      }

      const allDocuments: Document[] = [];

      // Traiter chaque fichier
      for (const filePath of files) {
        try {
          progress.currentFile = path.basename(filePath);
          progress.processedFiles++;

          if (progressCallback) {
            progressCallback(progress);
          }

          const documents = await this.processorRegistry.processFile(filePath, {
            ...metadata,
            source: filePath,
          });

          allDocuments.push(...documents);
          progress.totalDocuments += documents.length;

          if (progressCallback) {
            progressCallback(progress);
          }
        } catch (error) {
          console.error(`Erreur lors du traitement de ${filePath}:`, error);
          progress.error = `Erreur lors du traitement de ${path.basename(filePath)}: ${error}`;
          
          if (progressCallback) {
            progressCallback(progress);
          }
        }
      }

      // Indexer tous les documents
      if (allDocuments.length > 0) {
        await this.vectorStore.addDocuments(allDocuments);
        progress.processedDocuments = allDocuments.length;
        
        if (progressCallback) {
          progressCallback(progress);
        }
      }

      // Créer le pack de connaissances
      const knowledgePack: KnowledgePack = {
        id: packId,
        name: packName,
        description: (metadata as any)?.description || `Pack de connaissances pour ${packName}`,
        path: directoryPath,
        documents: allDocuments,
        metadata: {
          ...metadata,
          indexedAt: new Date(),
          totalDocuments: allDocuments.length,
          totalFiles: files.length,
        },
      };

      return knowledgePack;
    } catch (error) {
      throw new Error(`Erreur lors de l'indexation du répertoire ${directoryPath}: ${error}`);
    }
  }

  async indexFile(
    filePath: string, 
    metadata?: Partial<DocumentMetadata>
  ): Promise<Document[]> {
    try {
      const documents = await this.processorRegistry.processFile(filePath, {
        ...metadata,
        source: filePath,
      });

      if (documents.length > 0) {
        await this.vectorStore.addDocuments(documents);
      }

      return documents;
    } catch (error) {
      throw new Error(`Erreur lors de l'indexation du fichier ${filePath}: ${error}`);
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      return await this.vectorStore.search(query);
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${error}`);
    }
  }

  async searchWithFilters(
    query: string,
    filters: Record<string, any> = {},
    k: number = 10
  ): Promise<SearchResult[]> {
    return this.search({
      query,
      k,
      filters,
    });
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.vectorStore.deleteDocuments(ids);
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de documents: ${error}`);
    }
  }

  async getStats(): Promise<VectorStoreStats> {
    try {
      return await this.vectorStore.getStats();
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.vectorStore.clear();
    } catch (error) {
      throw new Error(`Erreur lors du nettoyage de la base: ${error}`);
    }
  }

  getSupportedExtensions(): string[] {
    return this.processorRegistry.getSupportedExtensions();
  }

  listProcessors(): { name: string; extensions: string[] }[] {
    return this.processorRegistry.listProcessors();
  }

  async isEmbeddingProviderAvailable(): Promise<boolean> {
    return this.embeddingProvider.isAvailable();
  }

  async getEmbeddingProviderInfo(): Promise<{ name: string; dimension: number; maxTokens: number }> {
    return this.embeddingProvider.getModelInfo();
  }

  private getSupportedFiles(directoryPath: string): string[] {
    const files: string[] = [];
    
    const processDirectory = (dir: string) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (stat.isFile()) {
          if (this.processorRegistry.getProcessor(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    };

    processDirectory(directoryPath);
    return files;
  }

  // Méthodes utilitaires pour la gestion des packs de connaissances
  async createKnowledgePack(
    id: string,
    name: string,
    description: string,
    path: string
  ): Promise<KnowledgePack> {
    return {
      id,
      name,
      description,
      path,
      documents: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  async updateKnowledgePack(
    packId: string,
    updates: Partial<KnowledgePack>
  ): Promise<KnowledgePack> {
    // Cette méthode nécessiterait une persistance des packs
    // Pour l'instant, on retourne un pack fictif
    return {
      id: packId,
      name: updates.name || 'Pack mis à jour',
      description: updates.description || '',
      path: updates.path || '',
      documents: updates.documents || [],
      metadata: {
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };
  }
}
