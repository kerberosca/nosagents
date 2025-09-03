// Fournisseur de modèles Ollama

import { ModelProvider, ModelRequest, ModelResponse } from './model-provider';
import { AgentMessage } from '../types';

export interface OllamaConfig {
  baseUrl: string;
  defaultModel: string;
  timeout: number;
  retries: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
    seed?: number;
    tfs_z?: number;
    typical_p?: number;
    repeat_penalty?: number;
    repeat_last_n?: number;
    num_ctx?: number;
    num_gpu?: number;
    num_thread?: number;
    [key: string]: any;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
  [key: string]: any;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
    [key: string]: any;
  };
}

export class OllamaProvider implements ModelProvider {
  public name = 'ollama';
  private config: OllamaConfig;
  private httpClient: typeof fetch;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: process.env.MODEL_DEFAULT || 'qwen2.5:7b',
      timeout: 120000, // Augmenter à 2 minutes pour les gros modèles
      retries: 3,
      ...config,
    };

    // Utiliser fetch global ou node-fetch en fallback
    this.httpClient = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/tags', { method: 'GET' });
      return response.ok;
    } catch (error) {
      console.warn('Ollama not available:', error);
      return false;
    }
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    try {
      // Convertir le format des messages en prompt Ollama
      const prompt = this.convertMessagesToPrompt(request.messages);
      const systemPrompt = this.extractSystemPrompt(request.messages);

      const ollamaRequest: OllamaGenerateRequest = {
        model: request.model || this.config.defaultModel,
        prompt,
        system: systemPrompt,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2048,
        },
      };

      // Debug: afficher la requête
      console.log('Ollama request:', JSON.stringify(ollamaRequest, null, 2));

      const response = await this.makeRequest('/api/generate', {
        method: 'POST',
        body: JSON.stringify(ollamaRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Essayer de parser la réponse comme JSON, sinon traiter comme texte brut
      let ollamaResponse: OllamaGenerateResponse;
      const responseText = await response.text();
      console.log('Raw Ollama response:', responseText);
      
      try {
        // Essayer de parser comme JSON
        ollamaResponse = JSON.parse(responseText) as OllamaGenerateResponse;
      } catch (parseError) {
        // Si le parsing JSON échoue, traiter comme réponse texte simple
        console.log('Parsing JSON failed, treating as text response:', responseText);
        
        ollamaResponse = {
          model: request.model || this.config.defaultModel,
          created_at: new Date().toISOString(),
          response: responseText,
          done: true,
        };
      }

      return {
        content: ollamaResponse.response,
        promptTokens: this.estimateTokenCount(prompt),
        completionTokens: this.estimateTokenCount(ollamaResponse.response),
        totalTokens: this.estimateTokenCount(prompt) + this.estimateTokenCount(ollamaResponse.response),
        metadata: {
          model: ollamaResponse.model,
          duration: ollamaResponse.total_duration,
          done: ollamaResponse.done,
        },
      };
    } catch (error) {
      console.error('Error generating response with Ollama:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  async generateResponse(
    prompt: string | AgentMessage, 
    model: string, 
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<ModelResponse> {
    const messages = typeof prompt === 'string' 
      ? [{ role: 'user' as const, content: prompt }]
      : [{ role: 'user' as const, content: prompt.content }];

    return this.generate({
      messages,
      model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/api/tags', { method: 'GET' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.models?.map((model: OllamaModelInfo) => model.name) || [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }

  async getModelInfo(modelName: string): Promise<OllamaModelInfo | null> {
    try {
      const response = await this.makeRequest(`/api/show`, {
        method: 'POST',
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json() as OllamaModelInfo;
    } catch (error) {
      console.error(`Error getting model info for ${modelName}:`, error);
      return null;
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/pull', {
        method: 'POST',
        body: JSON.stringify({ name: modelName }),
      });

      return response.ok;
    } catch (error) {
      console.error(`Error pulling model ${modelName}:`, error);
      return false;
    }
  }

  private convertMessagesToPrompt(messages: Array<{ role: string; content: string }>): string {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.role === 'assistant') {
          return `Assistant: ${msg.content}`;
        }
        return msg.content;
      })
      .join('\n') + '\nAssistant:';
  }

  private extractSystemPrompt(messages: Array<{ role: string; content: string }>): string | undefined {
    const systemMessage = messages.find(msg => msg.role === 'system');
    return systemMessage?.content;
  }

  private estimateTokenCount(text: string): number {
    // Estimation simple : ~4 caractères par token en moyenne
    // Pour une estimation plus précise, il faudrait utiliser un tokenizer spécifique au modèle
    return Math.ceil(text.length / 4);
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Ajouter timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
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
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      
      throw error;
    }
  }
}
