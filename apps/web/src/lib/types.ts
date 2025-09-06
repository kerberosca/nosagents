// Types unifiés pour l'interface web
// Étend les types du package core avec des types spécifiques à l'UI

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  permissions: {
    network: boolean;
    filesystem: boolean;
    tools: string[];
  };
  knowledgePacks: string[];
  chatTimeout?: number; // Timeout spécifique à l'agent (en ms)
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  role: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  permissions: {
    network: boolean;
    filesystem: boolean;
    tools: string[];
  };
  knowledgePacks: string[];
  chatTimeout?: number; // Timeout spécifique à l'agent (en ms)
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {
  id: string;
}

export interface AgentExecutionRequest {
  agentId: string;
  message: string;
  context?: any;
}

export interface AgentResponse {
  id: string;
  content: string;
  toolCalls?: any[];
  thoughts?: string[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AgentMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  role: 'user' | 'assistant' | 'system'; // Ajout pour compatibilité UI
  timestamp: Date;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface JobRequest {
  type: string;
  data: any;
  priority?: number;
}

export interface JobResult {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RAGSearchRequest {
  query: string;
  topK?: number;
  filters?: any;
}

export interface RAGIndexRequest {
  file?: File;
  directory?: string;
  options?: any;
}

export interface SystemConfig {
  ollama: {
    baseUrl: string;
    defaultModel: string;
    embedModel: string;
    timeout: number;
    maxTokens: number;
    temperature: number;
  };
  database: {
    postgresUrl: string;
    redisUrl: string;
    connectionPool: number;
    timeout: number;
  };
  security: {
    allowNetwork: boolean;
    allowedDomains: string[];
    sandboxDir: string;
    maxFileSize: number;
    enableAudit: boolean;
  };
  performance: {
    chunkSize: number;
    chunkOverlap: number;
    batchSize: number;
    maxConcurrentJobs: number;
    jobTimeout: number;
    chatTimeout: number;
    enableRateLimit: boolean;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
  logging: {
    level: string;
    enableFileLogging: boolean;
    logDir: string;
    maxLogSize: number;
    maxLogFiles: number;
    enableDebug: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  health?: any;
  stats?: any;
  models?: any;
}
