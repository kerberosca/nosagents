import { z } from 'zod';

// Configuration de l'environnement
export const EnvSchema = z.object({
  // Serveurs locaux
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  LOCALAI_BASE_URL: z.string().optional(),
  MODEL_DEFAULT: z.string().default('qwen2.5:7b'),
  EMBED_MODEL: z.string().default('nomic-embed-text'),
  
  // Bases de données
  POSTGRES_URL: z.string().default('postgresql://user:pass@localhost:5432/elavira'),
  RAG_DIR: z.string().default('./data/vectors'),
  KNOWLEDGE_DIR: z.string().default('./data/knowledge'),
  
  // Sécurité
  ALLOW_NETWORK: z.string().transform(val => val === 'true').default('false'),
  ALLOWED_DOMAINS: z.string().default('example.com,quebec.ca'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

// Configuration d'un agent
export const AgentSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  model: z.string().default('qwen2.5:7b'),
  goals: z.array(z.string()).min(1),
  knowledge_packs: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  authorizations: z.object({
    network: z.boolean().default(false),
    filesystem: z.boolean().default(true),
  }).default({}),
  memory: z.object({
    type: z.enum(['postgres', 'memory']).default('postgres'),
    scope: z.enum(['per-agent', 'global']).default('per-agent'),
  }).default({}),
  style: z.object({
    tone: z.string().default('professionnel'),
    language: z.string().default('fr-CA'),
  }).default({}),
});

export type Agent = z.infer<typeof AgentSchema>;

// Contexte d'un agent
export const AgentContextSchema = z.object({
  agent: AgentSchema,
  conversation: z.object({
    id: z.string(),
    messages: z.array(z.any()), // MessageSchema sera défini plus tard
    toolTraces: z.array(z.any()), // ToolTraceSchema sera défini plus tard
  }),
  memory: z.object({
    recent: z.array(z.string()),
    relevant: z.array(z.string()),
  }),
  tools: z.array(z.any()), // ToolSchema sera défini plus tard
  knowledgePacks: z.array(z.any()), // KnowledgePackSchema sera défini plus tard
});

export type AgentContext = z.infer<typeof AgentContextSchema>;

// Réponse d'un agent
export const AgentResponseSchema = z.object({
  content: z.string(),
  toolCalls: z.array(z.object({
    name: z.string(),
    arguments: z.record(z.any()),
  })).optional(),
  metadata: z.record(z.any()).default({}),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Configuration d'un outil
export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
  security: z.object({
    requiresNetwork: z.boolean().default(false),
    requiresFilesystem: z.boolean().default(false),
    dangerous: z.boolean().default(false),
  }).default({}),
});

export type Tool = z.infer<typeof ToolSchema>;

// Configuration d'un pack de connaissances
export const KnowledgePackSchema = z.object({
  name: z.string(),
  description: z.string(),
  path: z.string(),
  agents: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

export type KnowledgePack = z.infer<typeof KnowledgePackSchema>;

// Message de conversation
export const MessageSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  content: z.string(),
  type: z.enum(['user', 'assistant', 'system', 'tool']),
  timestamp: z.date(),
  metadata: z.record(z.any()).default({}),
});

export type Message = z.infer<typeof MessageSchema>;

// Trace d'exécution d'outil
export const ToolTraceSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  parameters: z.record(z.any()),
  result: z.any(),
  duration: z.number(),
  timestamp: z.date(),
  error: z.string().optional(),
});

export type ToolTrace = z.infer<typeof ToolTraceSchema>;

// Configuration de l'application
export const AppConfigSchema = z.object({
  name: z.string().default('Elavira Agents'),
  version: z.string().default('1.0.0'),
  port: z.number().default(3000),
  environment: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

// Constantes
export const CONSTANTS = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_TOOL_CALLS_PER_MESSAGE: 10,
  DEFAULT_CHUNK_SIZE: 1000,
  DEFAULT_CHUNK_OVERLAP: 200,
  MAX_SEARCH_RESULTS: 10,
  SUPPORTED_FILE_TYPES: ['pdf', 'docx', 'txt', 'md', 'jpg', 'png'],
} as const;

// Types utilitaires
export type ModelProvider = 'ollama' | 'localai' | 'openai';
export type MemoryType = 'postgres' | 'memory';
export type AgentScope = 'per-agent' | 'global';
