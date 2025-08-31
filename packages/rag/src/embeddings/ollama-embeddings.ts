import { EmbeddingProvider } from './embedding-provider';
import { EmbeddingResult } from '../types';

export interface OllamaEmbeddingOptions {
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export class OllamaEmbeddingProvider extends EmbeddingProvider {
  public name = 'Ollama';
  public model: string;
  public dimension: number = 384; // Dimension par défaut pour nomic-embed-text

  private baseUrl: string;
  private timeout: number;

  constructor(options: OllamaEmbeddingOptions = {}) {
    super();
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.model = options.model || 'nomic-embed-text';
    this.timeout = options.timeout || 30000;
  }

  async embedText(text: string): Promise<number[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.embedding || null;
    } catch (error) {
      console.error('Erreur lors de la génération d\'embedding Ollama:', error);
      return null;
    }
  }

  async embedTexts(texts: string[]): Promise<EmbeddingResult> {
    const embeddings: number[][] = [];
    let totalTokens = 0;

    for (const text of texts) {
      const embedding = await this.embedText(text);
      if (embedding) {
        embeddings.push(embedding);
        // Estimation approximative des tokens (1 token ≈ 4 caractères)
        totalTokens += Math.ceil(text.length / 4);
      }
    }

    return {
      embeddings,
      tokens: totalTokens,
      model: this.model,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json() as any;
      const models = data.models || [];
      
      // Vérifier si le modèle d'embedding est disponible
      return models.some((model: any) => model.name === this.model);
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité Ollama:', error);
      return false;
    }
  }

  async getModelInfo(): Promise<{ name: string; dimension: number; maxTokens: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.model,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Les informations exactes dépendent du modèle
      return {
        name: this.model,
        dimension: this.dimension,
        maxTokens: data.parameters?.num_ctx || 8192,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des informations du modèle:', error);
      
      // Retourner des valeurs par défaut
      return {
        name: this.model,
        dimension: this.dimension,
        maxTokens: 8192,
      };
    }
  }

  async pullModel(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.model,
        }),
        signal: AbortSignal.timeout(300000), // 5 minutes pour le téléchargement
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      // Attendre que le téléchargement soit terminé
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossible de lire la réponse');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status === 'success') {
              return true;
            }
          } catch (e) {
            // Ignorer les lignes non-JSON
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du téléchargement du modèle:', error);
      return false;
    }
  }
}
