import { ModelProvider, ModelRequest, ModelResponse } from './model-provider';
import { OllamaProvider } from './ollama-provider';
import { AgentMessage } from '../types';

export interface UnifiedModelProviderConfig {
  ollama?: {
    baseUrl: string;
    defaultModel: string;
    timeout: number;
  };
  localai?: {
    baseUrl: string;
    defaultModel: string;
    timeout: number;
  };
  openai?: {
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
    timeout: number;
  };
  fallbackOrder: ('ollama' | 'localai' | 'openai')[];
  enableFallback: boolean;
}

export class UnifiedModelProvider implements ModelProvider {
  public name = 'unified';
  private config: UnifiedModelProviderConfig;
  private providers: Map<string, ModelProvider> = new Map();
  private activeProvider: ModelProvider | null = null;
  private providerOrder: string[] = [];

  constructor(config: Partial<UnifiedModelProviderConfig> = {}) {
    this.config = {
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        defaultModel: process.env.MODEL_DEFAULT || 'qwen2.5:7b',
        timeout: 30000,
      },
      localai: {
        baseUrl: process.env.LOCALAI_BASE_URL || '',
        defaultModel: process.env.MODEL_DEFAULT || 'qwen2.5:7b',
        timeout: 30000,
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        defaultModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        timeout: 30000,
      },
      fallbackOrder: ['ollama', 'localai', 'openai'],
      enableFallback: true,
      ...config,
    };

    this.initializeProviders();
  }

  private async initializeProviders(): Promise<void> {
    // Initialiser Ollama
    if (this.config.ollama?.baseUrl) {
      const ollamaProvider = new OllamaProvider({
        baseUrl: this.config.ollama.baseUrl,
        defaultModel: this.config.ollama.defaultModel,
        timeout: this.config.ollama.timeout,
      });
      this.providers.set('ollama', ollamaProvider);
    }

    // TODO: Initialiser LocalAI provider
    // if (this.config.localai?.baseUrl) {
    //   const localaiProvider = new LocalAIProvider(this.config.localai);
    //   this.providers.set('localai', localaiProvider);
    // }

    // TODO: Initialiser OpenAI provider
    // if (this.config.openai?.apiKey) {
    //   const openaiProvider = new OpenAIProvider(this.config.openai);
    //   this.providers.set('openai', openaiProvider);
    // }

    // Déterminer l'ordre des fournisseurs disponibles
    this.providerOrder = this.config.fallbackOrder.filter(provider => 
      this.providers.has(provider)
    );

    // Sélectionner le premier fournisseur disponible
    await this.selectActiveProvider();
  }

  private async selectActiveProvider(): Promise<void> {
    for (const providerName of this.providerOrder) {
      const provider = this.providers.get(providerName);
      if (provider && await provider.isAvailable()) {
        this.activeProvider = provider;
        console.log(`Active model provider: ${providerName}`);
        return;
      }
    }

    // Aucun fournisseur disponible
    this.activeProvider = null;
    console.warn('No model providers available');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.activeProvider) {
      await this.selectActiveProvider();
    }
    return this.activeProvider !== null;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    if (!this.activeProvider) {
      await this.selectActiveProvider();
    }

    if (!this.activeProvider) {
      throw new Error('No model providers available');
    }

    try {
      return await this.activeProvider.generate(request);
    } catch (error) {
      // Essayer le fallback si activé
      if (this.config.enableFallback) {
        console.warn(`Primary provider failed, trying fallback: ${error}`);
        return await this.tryFallback(request);
      }
      throw error;
    }
  }

  async generateResponse(
    prompt: string | AgentMessage, 
    model: string, 
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<ModelResponse> {
    if (!this.activeProvider) {
      await this.selectActiveProvider();
    }

    if (!this.activeProvider) {
      throw new Error('No model providers available');
    }

    try {
      return await this.activeProvider.generateResponse(prompt, model, options);
    } catch (error) {
      if (this.config.enableFallback) {
        console.warn(`Primary provider failed, trying fallback: ${error}`);
        return await this.tryFallbackResponse(prompt, model, options);
      }
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.activeProvider) {
      await this.selectActiveProvider();
    }

    if (!this.activeProvider) {
      return [];
    }

    try {
      return await this.activeProvider.listModels();
    } catch (error) {
      console.warn('Failed to list models from primary provider:', error);
      
      // Essayer de lister depuis tous les fournisseurs disponibles
      const allModels: string[] = [];
      for (const provider of this.providers.values()) {
        try {
          const models = await provider.listModels();
          allModels.push(...models);
        } catch (e) {
          console.warn('Failed to list models from provider:', e);
        }
      }
      
      return [...new Set(allModels)]; // Supprimer les doublons
    }
  }

  async getProviderStatus(): Promise<Record<string, { available: boolean; models: string[] }>> {
    const status: Record<string, { available: boolean; models: string[] }> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        const available = await provider.isAvailable();
        const models = available ? await provider.listModels() : [];
        status[name] = { available, models };
      } catch (error) {
        status[name] = { available: false, models: [] };
      }
    }
    
    return status;
  }

  async switchProvider(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    if (await provider.isAvailable()) {
      this.activeProvider = provider;
      console.log(`Switched to provider: ${providerName}`);
      return true;
    }

    throw new Error(`Provider ${providerName} is not available`);
  }

  private async tryFallback(request: ModelRequest): Promise<ModelResponse> {
    for (const providerName of this.providerOrder) {
      if (providerName === this.activeProvider?.name) continue;
      
      const provider = this.providers.get(providerName);
      if (provider && await provider.isAvailable()) {
        try {
          this.activeProvider = provider;
          console.log(`Fallback to provider: ${providerName}`);
          return await provider.generate(request);
        } catch (error) {
          console.warn(`Fallback provider ${providerName} failed:`, error);
          continue;
        }
      }
    }
    
    throw new Error('All fallback providers failed');
  }

  private async tryFallbackResponse(
    prompt: string | AgentMessage, 
    model: string, 
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<ModelResponse> {
    for (const providerName of this.providerOrder) {
      if (providerName === this.activeProvider?.name) continue;
      
      const provider = this.providers.get(providerName);
      if (provider && await provider.isAvailable()) {
        try {
          this.activeProvider = provider;
          console.log(`Fallback to provider: ${providerName}`);
          return await provider.generateResponse(prompt, model, options);
        } catch (error) {
          console.warn(`Fallback provider ${providerName} failed:`, error);
          continue;
        }
      }
    }
    
    throw new Error('All fallback providers failed');
  }
}

