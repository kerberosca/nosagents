import { OllamaProvider } from '../../core/dist/models';
import { OllamaEmbeddingProvider } from './embeddings/ollama-embeddings';
import { 
  Document, 
  DocumentMetadata, 
  SearchQuery, 
  SearchResult, 
  KnowledgePack,
  ChunkingOptions,
  IndexingOptions,
  EmbeddingResult
} from './types';

export interface UnifiedRAGConfig {
  ollamaUrl: string;
  textModel: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  maxSearchResults: number;
}

export interface RAGSearchRequest {
  query: string;
  knowledgePack?: string;
  maxResults?: number;
  filters?: Record<string, any>;
}

export interface RAGAnswerRequest {
  query: string;
  contextDocuments: Document[];
  style?: 'professionnel' | 'simple' | 'détaillé';
  language?: string;
}

export class UnifiedRAGManager {
  private textProvider: OllamaProvider;
  private embeddingProvider: OllamaEmbeddingProvider;
  private config: UnifiedRAGConfig;
  private documents: Map<string, Document> = new Map();
  private knowledgePacks: Map<string, KnowledgePack> = new Map();

  constructor(config: Partial<UnifiedRAGConfig> = {}) {
    this.config = {
      ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      textModel: process.env.MODEL_DEFAULT || 'qwen2.5:7b',
      embeddingModel: process.env.EMBED_MODEL || 'nomic-embed-text',
      chunkSize: 1000,
      chunkOverlap: 200,
      maxSearchResults: 10,
      ...config,
    };

    // Initialiser les fournisseurs
    this.textProvider = new OllamaProvider({
      baseUrl: this.config.ollamaUrl,
      defaultModel: this.config.textModel,
      timeout: 120000,
    });

    this.embeddingProvider = new OllamaEmbeddingProvider({
      baseUrl: this.config.ollamaUrl,
      model: this.config.embeddingModel,
      timeout: 30000,
    });
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initialisation du RAG Manager unifié...');
    
    // Vérifier la disponibilité des fournisseurs
    const [textAvailable, embeddingAvailable] = await Promise.all([
      this.textProvider.isAvailable(),
      this.embeddingProvider.isAvailable(),
    ]);

    if (!textAvailable) {
      throw new Error(`Modèle de texte ${this.config.textModel} non disponible`);
    }

    if (!embeddingAvailable) {
      throw new Error(`Modèle d'embedding ${this.config.embeddingModel} non disponible`);
    }

    console.log('✅ RAG Manager initialisé avec succès');
    console.log(`   Modèle de texte: ${this.config.textModel}`);
    console.log(`   Modèle d'embedding: ${this.config.embeddingModel}`);
  }

  async addDocument(
    content: string, 
    metadata: Partial<DocumentMetadata> = {},
    knowledgePack?: string
  ): Promise<string> {
    try {
      // Chunker le document
      const chunks = this.chunkText(content, this.config.chunkSize, this.config.chunkOverlap);
      
      // Générer les embeddings pour chaque chunk
      const embeddingsResult = await this.embeddingProvider.embedTexts(chunks);
      
      if (embeddingsResult.embeddings.length === 0) {
        throw new Error('Impossible de générer des embeddings pour le document');
      }

      // Créer le document avec ses chunks (on utilise le premier embedding comme représentatif)
      const document: Document = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        metadata: {
          source: metadata.source || 'Source inconnue',
          title: metadata.title || 'Document sans titre',
          language: metadata.language || 'fr',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...metadata,
        },
        embeddings: embeddingsResult.embeddings[0], // Premier embedding comme représentatif
      };

      // Stocker le document
      this.documents.set(document.id, document);

      // Ajouter au pack de connaissances
      if (knowledgePack) {
        if (!this.knowledgePacks.has(knowledgePack)) {
          this.knowledgePacks.set(knowledgePack, {
            id: knowledgePack,
            name: knowledgePack,
            description: '',
            path: `./data/knowledge/${knowledgePack}`,
            documents: [],
            metadata: {},
          });
        }
        this.knowledgePacks.get(knowledgePack)!.documents.push(document);
      }

      console.log(`📄 Document ajouté: ${document.id} (${chunks.length} chunks)`);
      return document.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du document:', error);
      throw error;
    }
  }

  async search(request: RAGSearchRequest): Promise<SearchResult[]> {
    try {
      const { query, knowledgePack, maxResults = this.config.maxSearchResults, filters } = request;
      
      console.log(`🔍 Recherche RAG: "${query}" (pack: ${knowledgePack || 'tous'})`);

      // Générer l'embedding de la requête
      const queryEmbedding = await this.embeddingProvider.embedText(query);
      if (!queryEmbedding) {
        throw new Error('Impossible de générer l\'embedding de la requête');
      }

      // Filtrer les documents par pack de connaissances si spécifié
      let searchableDocuments = Array.from(this.documents.values());
      if (knowledgePack) {
        const pack = this.knowledgePacks.get(knowledgePack);
        if (pack) {
          searchableDocuments = searchableDocuments.filter(doc => 
            pack.documents.some(packDoc => packDoc.id === doc.id)
          );
        }
      }

      // Appliquer les filtres supplémentaires
      if (filters) {
        searchableDocuments = searchableDocuments.filter(doc => {
          return Object.entries(filters).every(([key, value]) => {
            return doc.metadata[key as keyof DocumentMetadata] === value;
          });
        });
      }

      // Calculer la similarité cosinus pour chaque document
      const results: Array<SearchResult & { score: number }> = [];
      
      for (const doc of searchableDocuments) {
        if (doc.embeddings) {
          const score = this.cosineSimilarity(queryEmbedding, doc.embeddings);
          
          if (score > 0.1) { // Seuil de pertinence
            results.push({
              document: doc,
              score: score,
              highlights: [query], // Highlight simple
            });
          }
        }
      }

      // Trier par score et limiter les résultats
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      console.log(`✅ Recherche terminée: ${sortedResults.length} résultats trouvés`);
      return sortedResults;
    } catch (error) {
      console.error('Erreur lors de la recherche RAG:', error);
      throw error;
    }
  }

  async generateAnswer(request: RAGAnswerRequest): Promise<string> {
    try {
      const { query, contextDocuments, style = 'professionnel', language = 'fr' } = request;
      
      console.log(`🤖 Génération de réponse RAG pour: "${query}"`);

      // Préparer le contexte
      const contextText = contextDocuments
        .map(doc => `Source: ${doc.metadata.source}\nContenu: ${doc.content}`)
        .join('\n\n');

      // Créer le prompt pour la génération
      const systemPrompt = `Tu es un assistant IA spécialisé dans l'analyse de documents. 
Réponds à la question de l'utilisateur en te basant UNIQUEMENT sur les documents fournis.
Si l'information n'est pas dans les documents, dis-le clairement.
Style de réponse: ${style}
Langue: ${language}

Documents de référence:
${contextText}`;

      const userPrompt = `Question: ${query}

Réponds en te basant uniquement sur les documents fournis ci-dessus.`;

      // Générer la réponse avec Ollama
      const response = await this.textProvider.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: this.config.textModel,
        temperature: 0.7,
        maxTokens: 1000,
      });

      console.log(`✅ Réponse RAG générée (${response.totalTokens} tokens)`);
      return response.content;
    } catch (error) {
      console.error('Erreur lors de la génération de réponse RAG:', error);
      throw error;
    }
  }

  async searchAndAnswer(query: string, options?: Partial<RAGSearchRequest>): Promise<{
    searchResults: SearchResult[];
    answer: string;
    metadata: {
      query: string;
      searchTime: number;
      generationTime: number;
      totalTokens: number;
    };
  }> {
    const startTime = Date.now();
    
    // Recherche
    const searchStart = Date.now();
    const searchResults = await this.search({ query, ...options });
    const searchTime = Date.now() - searchStart;

    if (searchResults.length === 0) {
      return {
        searchResults: [],
        answer: `Je n'ai pas trouvé d'informations pertinentes pour votre question: "${query}"`,
        metadata: {
          query,
          searchTime,
          generationTime: 0,
          totalTokens: 0,
        },
      };
    }

    // Génération de réponse
    const generationStart = Date.now();
    const answer = await this.generateAnswer({
      query,
      contextDocuments: searchResults.map(result => result.document),
      style: 'professionnel',
      language: 'fr',
    });
    const generationTime = Date.now() - generationStart;

    return {
      searchResults,
      answer,
      metadata: {
        query,
        searchTime,
        generationTime,
        totalTokens: answer.length, // Estimation simple
      },
    };
  }

  // Méthodes utilitaires
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.substring(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Les vecteurs doivent avoir la même dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  // Gestion des packs de connaissances
  async createKnowledgePack(name: string, description?: string): Promise<void> {
    this.knowledgePacks.set(name, {
      id: name,
      name,
      description: description || '',
      path: `./data/knowledge/${name}`,
      documents: [],
      metadata: {},
    });
    console.log(`📚 Pack de connaissances créé: ${name}`);
  }

  async getKnowledgePack(name: string): Promise<KnowledgePack | undefined> {
    return this.knowledgePacks.get(name);
  }

  async listKnowledgePacks(): Promise<string[]> {
    return Array.from(this.knowledgePacks.keys());
  }

  // Statistiques
  getStats(): {
    totalDocuments: number;
    totalChunks: number;
    knowledgePacks: number;
    totalEmbeddings: number;
  } {
    let totalChunks = 0;
    let totalEmbeddings = 0;

    for (const doc of this.documents.values()) {
      totalChunks += 1; // Chaque document = 1 chunk dans notre implémentation
      if (doc.embeddings) {
        totalEmbeddings += 1;
      }
    }

    return {
      totalDocuments: this.documents.size,
      totalChunks,
      knowledgePacks: this.knowledgePacks.size,
      totalEmbeddings,
    };
  }
}
