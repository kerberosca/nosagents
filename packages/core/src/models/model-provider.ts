// Fournisseur de modèles pour les agents
import { AgentMessage } from '../types';

export interface ModelRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model: string;
  temperature?: number;
  maxTokens?: number;
  config?: Record<string, any>;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

export interface ModelResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata?: Record<string, any>;
}

export interface ModelProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(request: ModelRequest): Promise<ModelResponse>;
  generateResponse(prompt: string | AgentMessage, model: string, options?: { temperature?: number; maxTokens?: number }): Promise<ModelResponse>;
  listModels(): Promise<string[]>;
}

// Fournisseur par défaut (placeholder)
export class DefaultModelProvider implements ModelProvider {
  name = 'default';

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    throw new Error('Default model provider not implemented');
  }

  async generateResponse(prompt: string | AgentMessage, model: string, options?: { temperature?: number; maxTokens?: number }): Promise<ModelResponse> {
    throw new Error('Default model provider not implemented');
  }

  async listModels(): Promise<string[]> {
    return [];
  }
}
