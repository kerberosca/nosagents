export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embeddings?: number[];
}

export interface DocumentMetadata {
  source: string;
  title?: string;
  author?: string;
  page?: number;
  chunkIndex?: number;
  totalChunks?: number;
  language?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  document: Document;
  score: number;
  highlights?: string[];
}

export interface SearchQuery {
  query: string;
  k?: number;
  filters?: Record<string, any>;
  threshold?: number;
}

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  separator?: string;
}

export interface IndexingOptions {
  chunking: ChunkingOptions;
  embeddingModel: string;
  batchSize?: number;
}

export interface KnowledgePack {
  id: string;
  name: string;
  description: string;
  path: string;
  documents: Document[];
  metadata: Record<string, any>;
}

export interface EmbeddingResult {
  embeddings: number[][];
  tokens: number;
  model: string;
}
