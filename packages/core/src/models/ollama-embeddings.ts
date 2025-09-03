// Interface locale pour éviter les dépendances circulaires
export interface EmbeddingResult {
  embeddings: number[][];
  metadata: {
    provider: string;
    model: string;
    dimension: number;
    totalTexts?: number;
    validEmbeddings?: number;
    error?: string;
  };
}

export interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export abstract class EmbeddingProvider {
  abstract name: string;
  abstract model: string;
  abstract dimension: number;

  abstract embedText(text: string): Promise<number[] | null>;
  abstract embedTexts(texts: string[]): Promise<EmbeddingResult>;
  
  abstract isAvailable(): Promise<boolean>;
  abstract getModelInfo(): Promise<{ name: string; dimension: number; maxTokens: number }>;
}

export class OllamaEmbeddingProvider extends EmbeddingProvider {
  public name = 'ollama-embeddings';
  public model: string;
  public dimension: number = 384; // Dimension par défaut, sera mise à jour dynamiquement
  
  private baseUrl: string;
  private httpClient: typeof fetch;

  constructor(config: { baseUrl?: string; model?: string } = {}) {
    super();
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = config.model || process.env.EMBED_MODEL || 'nomic-embed-text';
    this.httpClient = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/tags', { method: 'GET' });
      if (!response.ok) return false;
      
      const data = await response.json() as any;
      const modelExists = data.models?.some((m: any) => m.name === this.model);
      
      if (modelExists) {
        // Mettre à jour la dimension si possible
        await this.updateDimension();
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Ollama embeddings not available:', error);
      return false;
    }
  }

  async embedText(text: string): Promise<number[] | null> {
    try {
      const request: OllamaEmbeddingRequest = {
        model: this.model,
        prompt: text,
      };

      const response = await this.makeRequest('/api/embeddings', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OllamaEmbeddingResponse;
      
      // Mettre à jour la dimension si elle a changé
      if (data.embedding.length !== this.dimension) {
        this.dimension = data.embedding.length;
      }

      return data.embedding;
    } catch (error) {
      console.error('Error generating embedding with Ollama:', error);
      return null;
    }
  }

  async embedTexts(texts: string[]): Promise<EmbeddingResult> {
    try {
      // Ollama peut traiter plusieurs embeddings en parallèle
      const promises = texts.map(text => this.embedText(text));
      const embeddings = await Promise.all(promises);
      
      // Filtrer les embeddings null
      const validEmbeddings = embeddings.filter(emb => emb !== null) as number[][];
      
      return {
        embeddings: validEmbeddings,
        metadata: {
          provider: this.name,
          model: this.model,
          dimension: this.dimension,
          totalTexts: texts.length,
          validEmbeddings: validEmbeddings.length,
        },
      };
    } catch (error) {
      console.error('Error generating multiple embeddings:', error);
      return {
        embeddings: [],
        metadata: {
          provider: this.name,
          model: this.model,
          dimension: this.dimension,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async getModelInfo(): Promise<{ name: string; dimension: number; maxTokens: number }> {
    try {
      const available = await this.isAvailable();
      return {
        name: this.model,
        dimension: this.dimension,
        maxTokens: 8192, // Valeur par défaut pour Ollama
      };
    } catch (error) {
      return {
        name: this.model,
        dimension: this.dimension,
        maxTokens: 8192,
      };
    }
  }

  async pullModel(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/pull', {
        method: 'POST',
        body: JSON.stringify({ name: this.model }),
      });

      if (response.ok) {
        // Mettre à jour la dimension après avoir téléchargé le modèle
        await this.updateDimension();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error pulling embedding model ${this.model}:`, error);
      return false;
    }
  }

  private async updateDimension(): Promise<void> {
    try {
      // Générer un embedding de test pour déterminer la dimension
      const testEmbedding = await this.embedText('test');
      if (testEmbedding) {
        this.dimension = testEmbedding.length;
      }
    } catch (error) {
      console.warn('Could not determine embedding dimension:', error);
      // Garder la dimension par défaut
    }
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Ajouter timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await this.httpClient(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout after 30s');
      }
      
      throw error;
    }
  }
}
