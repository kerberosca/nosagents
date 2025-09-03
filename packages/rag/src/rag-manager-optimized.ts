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

export interface OptimizedRAGConfig {
  ollamaUrl: string;
  textModel: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  maxSearchResults: number;
  // Nouvelles options d'optimisation
  maxConcurrentEmbeddings: number;
  batchSize: number;
  memoryLimit: number; // MB
  enableStreaming: boolean;
  cacheEmbeddings: boolean;
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

export class OptimizedRAGManager {
  private textProvider: OllamaProvider;
  private embeddingProvider: OllamaEmbeddingProvider;
  private config: OptimizedRAGConfig;
  private documents: Map<string, Document> = new Map();
  private knowledgePacks: Map<string, KnowledgePack> = new Map();
  
  // Cache et optimisation mémoire
  private embeddingCache: Map<string, number[]> = new Map();
  private memoryUsage: number = 0;
  private lastGarbageCollection: number = Date.now();

  constructor(config: Partial<OptimizedRAGConfig> = {}) {
    this.config = {
      ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      textModel: process.env.MODEL_DEFAULT || 'qwen2.5:7b',
      embeddingModel: process.env.EMBED_MODEL || 'all-minilm:latest', // Modèle plus léger par défaut
      chunkSize: 500, // Réduit pour moins de mémoire
      chunkOverlap: 100,
      maxSearchResults: 5,
      maxConcurrentEmbeddings: 2, // Limiter la concurrence
      batchSize: 3, // Traitement par petits lots
      memoryLimit: 512, // 512 MB limite
      enableStreaming: true,
      cacheEmbeddings: true,
      ...config,
    };

    // Initialiser les fournisseurs avec des timeouts plus courts
    this.textProvider = new OllamaProvider({
      baseUrl: this.config.ollamaUrl,
      defaultModel: this.config.textModel,
      timeout: 180000, // Augmenté à 3 minutes pour les gros modèles
    });

    this.embeddingProvider = new OllamaEmbeddingProvider({
      baseUrl: this.config.ollamaUrl,
      model: this.config.embeddingModel,
      timeout: 15000, // Réduit à 15s
    });
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initialisation du RAG Manager optimisé...');
    
    try {
      // Vérifier la disponibilité des fournisseurs avec timeout
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

      console.log('✅ RAG Manager optimisé initialisé avec succès');
      console.log(`   Modèle de texte: ${this.config.textModel}`);
      console.log(`   Modèle d'embedding: ${this.config.embeddingModel} (optimisé)`);
      console.log(`   Limite mémoire: ${this.config.memoryLimit} MB`);
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
      throw error;
    }
  }

  async addDocument(
    content: string, 
    metadata: Partial<DocumentMetadata> = {},
    knowledgePack?: string
  ): Promise<string> {
    try {
      // Vérifier la limite mémoire avant traitement
      if (this.memoryUsage > this.config.memoryLimit * 1024 * 1024) {
        await this.garbageCollection();
      }

      // Chunker le document avec des tailles optimisées
      const chunks = this.optimizedChunkText(content);
      
      // Traitement par lots pour éviter la surcharge mémoire
      const documentIds: string[] = [];
      
      for (let i = 0; i < chunks.length; i += this.config.batchSize) {
        const batch = chunks.slice(i, i + this.config.batchSize);
        
        // Générer les embeddings par lot
        const embeddingsResult = await this.generateEmbeddingsBatch(batch);
        
        // Créer les documents du lot
        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j];
          const embedding = embeddingsResult.embeddings[j];
          
          if (embedding) {
            const document: Document = {
              id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i + j}`,
              content: chunk,
              metadata: {
                source: metadata.source || 'Source inconnue',
                title: metadata.title || 'Document sans titre',
                language: metadata.language || 'fr',
                chunkIndex: i + j,
                totalChunks: chunks.length,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...metadata,
              },
              embeddings: embedding,
            };

            // Stocker le document
            this.documents.set(document.id, document);
            documentIds.push(document.id);

            // Mettre en cache l'embedding
            if (this.config.cacheEmbeddings) {
              this.embeddingCache.set(document.id, embedding);
            }

            // Mettre à jour l'usage mémoire
            this.memoryUsage += embedding.length * 8; // 8 bytes par nombre
          }
        }

        // Pause entre les lots pour permettre au GC de fonctionner
        if (i + this.config.batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Ajouter au pack de connaissances
      if (knowledgePack) {
        await this.addToKnowledgePack(knowledgePack, documentIds);
      }

      console.log(`📄 Document ajouté: ${documentIds.length} chunks traités`);
      return documentIds.join(',');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du document:', error);
      throw error;
    }
  }

  private async generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult> {
    try {
      // Vérifier le cache d'abord
      const cachedResults: number[][] = [];
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const cacheKey = this.generateCacheKey(text);
        
        if (this.embeddingCache.has(cacheKey)) {
          cachedResults[i] = this.embeddingCache.get(cacheKey)!;
        } else {
          uncachedTexts.push(text);
          uncachedIndices.push(i);
        }
      }

      // Générer les embeddings manquants
      if (uncachedTexts.length > 0) {
        const newEmbeddings = await this.embeddingProvider.embedTexts(uncachedTexts);
        
        // Placer les nouveaux embeddings aux bonnes positions
        for (let i = 0; i < uncachedIndices.length; i++) {
          const index = uncachedIndices[i];
          const embedding = newEmbeddings.embeddings[i];
          
          if (embedding) {
            cachedResults[index] = embedding;
            
            // Mettre en cache
            if (this.config.cacheEmbeddings) {
              const cacheKey = this.generateCacheKey(uncachedTexts[i]);
              this.embeddingCache.set(cacheKey, embedding);
            }
          }
        }
      }

      return {
        embeddings: cachedResults,
        tokens: texts.join(' ').split(' ').length,
        model: this.config.embeddingModel,
      };
    } catch (error) {
      console.error('Erreur lors de la génération des embeddings:', error);
      throw error;
    }
  }

  private generateCacheKey(text: string): string {
    // Hash simple pour la clé de cache
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32-bit integer
    }
    return hash.toString();
  }

  private optimizedChunkText(text: string): string[] {
    const chunks: string[] = [];
    
    // Protection contre les textes vides ou trop courts
    if (!text || text.length === 0) {
      return chunks;
    }
    
    // Si le texte est plus court que la taille de chunk, le retourner tel quel
    if (text.length <= this.config.chunkSize) {
      chunks.push(text.trim());
      return chunks;
    }
    
    let start = 0;
    let iterationCount = 0;
    const maxIterations = Math.ceil(text.length / Math.max(1, this.config.chunkSize - this.config.chunkOverlap));

    while (start < text.length && iterationCount < maxIterations) {
      const end = Math.min(start + this.config.chunkSize, text.length);
      const chunk = text.substring(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      // Calculer la position de départ du prochain chunk
      start = end - this.config.chunkOverlap;
      
      // Protection contre les boucles infinies et positions négatives
      if (start <= 0 || start >= text.length) {
        break;
      }
      
      iterationCount++;
    }

    // Si aucun chunk n'a été créé, créer au moins un chunk avec le texte complet
    if (chunks.length === 0) {
      chunks.push(text.trim());
    }

    return chunks;
  }

  async search(request: RAGSearchRequest): Promise<SearchResult[]> {
    try {
      const { query, knowledgePack, maxResults = this.config.maxSearchResults, filters } = request;
      
      console.log(`🔍 Recherche RAG optimisée: "${query}"`);

      // Générer l'embedding de la requête
      const queryEmbedding = await this.embeddingProvider.embedText(query);
      if (!queryEmbedding) {
        throw new Error('Impossible de générer l\'embedding de la requête');
      }

      // Filtrer les documents
      let searchableDocuments = Array.from(this.documents.values());
      if (knowledgePack) {
        const pack = this.knowledgePacks.get(knowledgePack);
        if (pack) {
          searchableDocuments = searchableDocuments.filter(doc => 
            pack.documents.some(packDoc => packDoc.id === doc.id)
          );
        }
      }

      // Appliquer les filtres
      if (filters) {
        searchableDocuments = searchableDocuments.filter(doc => {
          return Object.entries(filters).every(([key, value]) => {
            return doc.metadata[key as keyof DocumentMetadata] === value;
          });
        });
      }

      // Recherche vectorielle optimisée
      const results: SearchResult[] = [];
      
      for (const doc of searchableDocuments) {
        if (doc.embeddings) {
          const score = this.cosineSimilarity(queryEmbedding, doc.embeddings);
          
          if (score > 0.15) { // Seuil légèrement plus élevé
            results.push({
              document: doc,
              score: score,
              highlights: [query],
            });
          }
        }
      }

      // Trier et limiter les résultats
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
      
      console.log(`🤖 Génération de réponse RAG optimisée pour: "${query}"`);

      // Préparer le contexte
      const contextText = contextDocuments
        .map(doc => `Source: ${doc.metadata.source}\nContenu: ${doc.content}`)
        .join('\n\n');

      // Prompt optimisé
      const systemPrompt = `Tu es un assistant IA spécialisé dans l'analyse de documents. 
Réponds à la question de l'utilisateur en te basant UNIQUEMENT sur les documents fournis.
Si l'information n'est pas dans les documents, dis-le clairement.
Style: ${style}, Langue: ${language}

Documents: ${contextText}`;

      const userPrompt = `Question: ${query}`;

      // Génération avec streaming si activé
      const response = await this.textProvider.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: this.config.textModel,
        temperature: 0.7,
        maxTokens: 800, // Réduit pour économiser la mémoire
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
      memoryUsage: number;
    };
  }> {
    const startTime = Date.now();
    
    try {
      // Recherche
      const searchStart = Date.now();
      const searchResults = await this.search({ query, ...options });
      const searchTime = Date.now() - searchStart;

      if (searchResults.length === 0) {
        return {
          searchResults: [],
          answer: `Je n'ai pas trouvé d'informations pertinentes pour: "${query}"`,
          metadata: {
            query,
            searchTime,
            generationTime: 0,
            totalTokens: 0,
            memoryUsage: this.memoryUsage,
          },
        };
      }

      // Génération de réponse
      const generationStart = Date.now();
      const answer = await this.generateAnswer({
        query,
        contextDocuments: searchResults.map(result => result.document),
        style: 'simple',
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
          totalTokens: answer.length,
          memoryUsage: this.memoryUsage,
        },
      };
    } finally {
      // Nettoyage automatique
      if (Date.now() - this.lastGarbageCollection > 30000) { // Toutes les 30s
        await this.garbageCollection();
      }
    }
  }

  private async addToKnowledgePack(name: string, documentIds: string[]): Promise<void> {
    if (!this.knowledgePacks.has(name)) {
      this.knowledgePacks.set(name, {
        id: name,
        name,
        description: '',
        path: `./data/knowledge/${name}`,
        documents: [],
        metadata: {},
      });
    }

    const pack = this.knowledgePacks.get(name)!;
    for (const docId of documentIds) {
      const doc = this.documents.get(docId);
      if (doc) {
        pack.documents.push(doc);
      }
    }
  }

  private async garbageCollection(): Promise<void> {
    console.log('🧹 Nettoyage mémoire...');
    
    // Vider le cache des embeddings
    this.embeddingCache.clear();
    
    // Forcer le garbage collection
    if (global.gc) {
      global.gc();
    }
    
    // Réinitialiser le compteur mémoire
    this.memoryUsage = 0;
    this.lastGarbageCollection = Date.now();
    
    console.log('✅ Nettoyage mémoire terminé');
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

  // Statistiques avancées
  getStats(): {
    totalDocuments: number;
    totalChunks: number;
    knowledgePacks: number;
    totalEmbeddings: number;
    memoryUsage: number;
    cacheSize: number;
    lastGarbageCollection: number;
  } {
    let totalChunks = 0;
    let totalEmbeddings = 0;

    for (const doc of this.documents.values()) {
      totalChunks += 1;
      if (doc.embeddings) {
        totalEmbeddings += 1;
      }
    }

    return {
      totalDocuments: this.documents.size,
      totalChunks,
      knowledgePacks: this.knowledgePacks.size,
      totalEmbeddings,
      memoryUsage: this.memoryUsage,
      cacheSize: this.embeddingCache.size,
      lastGarbageCollection: this.lastGarbageCollection,
    };
  }

  // Méthodes d'optimisation
  async clearCache(): Promise<void> {
    this.embeddingCache.clear();
    this.memoryUsage = 0;
    console.log('🗑️ Cache vidé');
  }

  async setMemoryLimit(limitMB: number): Promise<void> {
    this.config.memoryLimit = limitMB;
    console.log(`💾 Limite mémoire mise à jour: ${limitMB} MB`);
  }
}
