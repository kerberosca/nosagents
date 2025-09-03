import { connect, Connection, Table } from '@lancedb/lancedb';
import { Document, SearchQuery, SearchResult } from '../types';
import { EmbeddingProvider } from '../embeddings/embedding-provider';

export interface VectorStoreOptions {
  dbPath: string;
  tableName: string;
  embeddingDimension: number;
  embeddingProvider: EmbeddingProvider;
}

export interface VectorStoreStats {
  totalDocuments: number;
  totalChunks: number;
  totalSize: number;
  lastUpdated: Date;
}

export abstract class VectorStore {
  abstract initialize(): Promise<void>;
  abstract addDocuments(documents: Document[]): Promise<void>;
  abstract search(query: SearchQuery): Promise<SearchResult[]>;
  abstract deleteDocuments(ids: string[]): Promise<void>;
  abstract getStats(): Promise<VectorStoreStats>;
  abstract clear(): Promise<void>;
}

export class LanceDBVectorStore extends VectorStore {
  private connection: Connection | null = null;
  private table: Table | null = null;
  private options: VectorStoreOptions;

  constructor(options: VectorStoreOptions) {
    super();
    this.options = options;
  }

  async initialize(): Promise<void> {
    try {
      this.connection = await connect(this.options.dbPath);
      
      // Vérifier si la table existe
      const tableNames = await this.connection.tableNames();
      
      if (tableNames.includes(this.options.tableName)) {
        this.table = await this.connection.openTable(this.options.tableName);
      } else {
        // Créer un enregistrement d'initialisation minimal
        const initRecord = {
          id: 'init',
          content: 'Initialization record',
          source: 'system',
          title: 'Init',
          author: 'system',
          page: 0,
          chunkIndex: 0,
          totalChunks: 1,
          language: 'fr',
          tags: ['init'],
          createdAt: Date.now(), // Utiliser un timestamp numérique
          updatedAt: Date.now(),
          embeddings: new Array(this.options.embeddingDimension).fill(0),
        };
        
        this.table = await this.connection.createTable(this.options.tableName, [initRecord]);
      }
    } catch (error) {
      throw new Error(`Erreur lors de l'initialisation de LanceDB: ${error}`);
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.table) {
      throw new Error('VectorStore non initialisé');
    }

    try {
      // Générer les embeddings pour tous les documents
      const documentsWithEmbeddings = await this.generateEmbeddings(documents);

      // Préparer les données pour LanceDB
      const rows = documentsWithEmbeddings.map(doc => ({
        id: doc.id,
        content: doc.content,
        source: doc.metadata.source,
        title: doc.metadata.title || '',
        author: doc.metadata.author || '',
        page: doc.metadata.page || 0,
        chunkIndex: doc.metadata.chunkIndex || 0,
        totalChunks: doc.metadata.totalChunks || 1,
        language: doc.metadata.language || 'fr',
        tags: doc.metadata.tags || [],
        createdAt: doc.metadata.createdAt,
        updatedAt: doc.metadata.updatedAt,
        embeddings: doc.embeddings || [],
      }));

      // Insérer les données
      await this.table.add(rows);
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout de documents: ${error}`);
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.table) {
      throw new Error('VectorStore non initialisé');
    }

    try {
      // Générer l'embedding de la requête
      const queryEmbedding = await this.options.embeddingProvider.embedText(query.query);
      
      if (!queryEmbedding) {
        throw new Error('Impossible de générer l\'embedding de la requête');
      }

      // Utiliser la recherche vectorielle au lieu de la recherche textuelle
      const results = await this.table.search(queryEmbedding)
        .limit(query.k || 10);

      // Convertir les résultats
      const resultsArray = await results.toArray();
      return resultsArray.map((result: any) => ({
        document: {
          id: result.id,
          content: result.content,
          metadata: {
            source: result.source,
            title: result.title,
            author: result.author,
            page: result.page,
            chunkIndex: result.chunkIndex,
            totalChunks: result.totalChunks,
            language: result.language,
            tags: result.tags,
            createdAt: new Date(result.createdAt),
            updatedAt: new Date(result.updatedAt),
          },
          embeddings: result.embeddings,
        },
        score: result._distance || 0,
      }));
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${error}`);
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    if (!this.table) {
      throw new Error('VectorStore non initialisé');
    }

    try {
      await this.table.delete(`id IN (${ids.map(id => `'${id}'`).join(', ')})`);
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de documents: ${error}`);
    }
  }

  async getStats(): Promise<VectorStoreStats> {
    if (!this.table) {
      throw new Error('VectorStore non initialisé');
    }

    try {
      // Pour l'instant, retourner des statistiques simulées
      // TODO: Implémenter la vraie récupération des statistiques LanceDB
      return {
        totalDocuments: 0,
        totalChunks: 0,
        totalSize: 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error}`);
    }
  }

  async clear(): Promise<void> {
    if (!this.table) {
      throw new Error('VectorStore non initialisé');
    }

    try {
      await this.table.delete('1=1'); // Supprimer tous les enregistrements
    } catch (error) {
      throw new Error(`Erreur lors du nettoyage de la base: ${error}`);
    }
  }

  private async generateEmbeddings(documents: Document[]): Promise<Document[]> {
    const documentsWithEmbeddings: Document[] = [];

    for (const doc of documents) {
      try {
        const embedding = await this.options.embeddingProvider.embedText(doc.content);
        if (embedding) {
          documentsWithEmbeddings.push({
            ...doc,
            embeddings: embedding,
          });
        } else {
          console.warn(`Impossible de générer l'embedding pour le document ${doc.id}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la génération d'embedding pour ${doc.id}:`, error);
      }
    }

    return documentsWithEmbeddings;
  }
}
