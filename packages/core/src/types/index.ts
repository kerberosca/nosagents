export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  goals: string[];
  tools: string[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  permissions: {
    network: boolean;
    filesystem: boolean;
    tools: string[];
  };
  knowledgePacks: string[];
  style: {
    tone: string;
    language: string;
  };
  authorizations: {
    network: boolean;
    filesystem: boolean;
  };
}

export interface AgentMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  id: string;
  content: string;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}

export interface AgentContext {
  agentId: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface DelegationHistoryEntry {
  from: string;
  to: string;
  message: AgentMessage;
  response: AgentResponse;
  timestamp: Date;
  success: boolean;
}

export interface ModelRequest {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ModelResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata?: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  security: {
    requiresNetwork: boolean;
    requiresFilesystem: boolean;
    dangerous: boolean;
  };
  execute?: (parameters: any, context: AgentContext) => Promise<any>;
}
