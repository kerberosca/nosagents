import { v4 as uuidv4 } from 'uuid';
import { Agent as AgentConfig } from '../types';
import { ModelProvider, ModelRequest } from '../models/model-provider';
import { ToolRegistry } from '../tools/tool-registry';
import { MemoryManager } from '../memory/memory-manager';
import { Logger } from '../utils/logger';

export interface AgentContext {
  agentId: string;
  sessionId: string;
  userId?: string;
  metadata: Record<string, any>;
}

export interface AgentResponse {
  content: string;
  toolCalls: any[];
  thoughts: string[];
  metadata: Record<string, any>;
}

export class Agent {
  private id: string;
  private config: AgentConfig;
  private modelProvider: ModelProvider;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;
  private logger: Logger;
  private isRunning: boolean = false;

  constructor(
    config: AgentConfig,
    modelProvider: ModelProvider,
    toolRegistry: ToolRegistry,
    memoryManager: MemoryManager,
    agentId?: string
  ) {
    this.id = agentId || uuidv4();
    this.config = config;
    this.modelProvider = modelProvider;
    this.toolRegistry = toolRegistry;
    this.memoryManager = memoryManager;
    this.logger = new Logger(`Agent:${config.name}`);
  }

  getAgentId(): string {
    return this.id;
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  async processMessage(
    content: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    if (this.isRunning) {
      throw new Error('Agent déjà en cours d\'exécution');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.info(`Traitement du message: ${content.substring(0, 100)}...`);

      // Sauvegarder le message utilisateur
      const userMessage = {
        id: uuidv4(),
        agentId: this.id,
        content,
        type: 'user' as const,
        timestamp: new Date(),
        metadata: context.metadata,
      };

      await this.memoryManager.saveMessage(userMessage);

      // Construire le contexte pour le modèle
      const systemPrompt = this.buildSystemPrompt();
      const conversationHistory = await this.memoryManager.getConversationHistory(
        context.sessionId,
        10
      );

      // Générer la réponse avec le modèle
      const modelRequest: ModelRequest = {
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map((msg: any) => ({
            role: (msg.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.content,
          })),
          { role: 'user' as const, content },
        ],
        model: this.config.model,
        config: {
          model: this.config.model,
          temperature: 0.3,
          maxTokens: 50,
        },
      };

      const modelResponse = await this.modelProvider.generate(modelRequest);

      // Traiter les appels d'outils si nécessaire
      const toolCalls: any[] = [];
      let finalContent = modelResponse.content;
      let thoughts: string[] = [];

      // Note: Ollama ne supporte pas nativement les function calls
      // Cette partie sera implémentée plus tard avec des prompts spécialisés
      // Pour l'instant, on retourne directement la réponse du modèle

      // Sauvegarder la réponse de l'agent
      const agentMessage = {
        id: uuidv4(),
        agentId: this.id,
        content: finalContent,
        type: 'assistant' as const,
        timestamp: new Date(),
        metadata: {
          toolCalls: toolCalls.length,
          thoughts,
          processingTime: Date.now() - startTime,
        },
      };

      await this.memoryManager.saveMessage(agentMessage);

      return {
        content: finalContent,
        toolCalls,
        thoughts,
        metadata: {
          processingTime: Date.now() - startTime,
          model: this.config.model,
          agentName: this.config.name,
        },
      };
    } finally {
      this.isRunning = false;
    }
  }

  private buildSystemPrompt(): string {
    // Si un systemPrompt personnalisé existe, l'utiliser
    if (this.config.systemPrompt && this.config.systemPrompt.trim()) {
      return this.config.systemPrompt;
    }
    
    // Sinon, utiliser le prompt générique
    return `Tu es ${this.config.name}, ${this.config.role}.

Objectifs:
${this.config.goals.map((goal: string) => `- ${goal}`).join('\n')}

Ton style de communication: ${this.config.style.tone}
Langue: ${this.config.style.language}

Outils disponibles: ${this.config.tools.join(', ')}

Instructions:
1. Réponds toujours en français canadien
2. Sois utile et précis
3. Utilise les outils quand c'est nécessaire
4. Explique tes raisonnements
5. Respecte les autorisations de sécurité`;
  }

  private getAvailableTools() {
    return this.config.tools.map((toolName: string) => {
      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        this.logger.warn(`Outil ${toolName} non trouvé dans le registre`);
        return null;
      }
      return {
        name: tool.getName(),
        description: tool.getDescription(),
        parameters: tool.getSecurityConfig(),
      };
    }).filter(Boolean);
  }

  private async executeTool(
    toolCall: any,
    context: any
  ): Promise<any> {
    const startTime = Date.now();
    const toolName = toolCall.name;

    try {
      // Vérifier les autorisations
      if (!this.canUseTool(toolName)) {
        throw new Error(`Outil ${toolName} non autorisé pour cet agent`);
      }

      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        throw new Error(`Outil ${toolName} non trouvé`);
      }

      // Exécuter l'outil
      const result = await tool.execute(toolCall.arguments, context);

      return {
        id: uuidv4(),
        toolName,
        parameters: toolCall.arguments,
        result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        id: uuidv4(),
        toolName,
        parameters: toolCall.arguments,
        result: null,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private canUseTool(toolName: string): boolean {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) return false;

    const security = tool.getSecurityConfig();

    // Vérifier les autorisations réseau
    if (security.requiresNetwork && !this.config.authorizations.network) {
      return false;
    }

    // Vérifier les autorisations fichiers
    if (security.requiresFilesystem && !this.config.authorizations.filesystem) {
      return false;
    }

    return true;
  }

  async delegateToAgent(
    targetAgentId: string,
    task: string,
    context: any
  ): Promise<any> {
    this.logger.info(`Délégation vers l'agent ${targetAgentId}: ${task}`);
    
    // Cette méthode sera implémentée dans l'AgentManager
    throw new Error('Délégation non implémentée dans cette version');
  }
}
