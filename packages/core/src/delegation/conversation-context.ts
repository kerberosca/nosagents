import { AgentMessage, AgentResponse } from '../types';
import { DelegationRecord } from './delegation-manager';

export interface SharedContext {
  conversationId: string;
  participants: string[];
  topic: string;
  goals: string[];
  constraints: string[];
  sharedKnowledge: Map<string, any>;
  conversationHistory: Array<{
    message: AgentMessage;
    response: AgentResponse;
    timestamp: Date;
    agentId?: string;
  }>;
}

export interface DelegationHistoryEntry {
  from: string;
  to: string;
  message: AgentMessage;
  response?: AgentResponse;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class ConversationContext {
  private conversationId: string;
  private sharedContext: SharedContext;
  private delegationHistory: DelegationHistoryEntry[];
  private metadata: Map<string, any>;

  constructor(conversationId: string) {
    this.conversationId = conversationId;
    this.sharedContext = {
      conversationId: conversationId,
      participants: [],
      topic: '',
      goals: [],
      constraints: [],
      sharedKnowledge: new Map(),
      conversationHistory: []
    };
    this.delegationHistory = [];
    this.metadata = new Map();
  }

  /**
   * Ajouter un participant à la conversation
   */
  addParticipant(agentId: string): void {
    if (!this.sharedContext.participants.includes(agentId)) {
      this.sharedContext.participants.push(agentId);
    }
  }

  /**
   * Supprimer un participant de la conversation
   */
  removeParticipant(agentId: string): void {
    this.sharedContext.participants = this.sharedContext.participants.filter(
      id => id !== agentId
    );
  }

  /**
   * Définir le sujet de la conversation
   */
  setTopic(topic: string): void {
    this.sharedContext.topic = topic;
  }

  /**
   * Ajouter un objectif à la conversation
   */
  addGoal(goal: string): void {
    if (!this.sharedContext.goals.includes(goal)) {
      this.sharedContext.goals.push(goal);
    }
  }

  /**
   * Supprimer un objectif de la conversation
   */
  removeGoal(goal: string): void {
    this.sharedContext.goals = this.sharedContext.goals.filter(g => g !== goal);
  }

  /**
   * Ajouter une contrainte à la conversation
   */
  addConstraint(constraint: string): void {
    if (!this.sharedContext.constraints.includes(constraint)) {
      this.sharedContext.constraints.push(constraint);
    }
  }

  /**
   * Supprimer une contrainte de la conversation
   */
  removeConstraint(constraint: string): void {
    this.sharedContext.constraints = this.sharedContext.constraints.filter(
      c => c !== constraint
    );
  }

  /**
   * Ajouter une connaissance partagée
   */
  addSharedKnowledge(key: string, value: any): void {
    this.sharedContext.sharedKnowledge.set(key, value);
  }

  /**
   * Obtenir une connaissance partagée
   */
  getSharedKnowledge(key: string): any {
    return this.sharedContext.sharedKnowledge.get(key);
  }

  /**
   * Supprimer une connaissance partagée
   */
  removeSharedKnowledge(key: string): boolean {
    return this.sharedContext.sharedKnowledge.delete(key);
  }

  /**
   * Ajouter un message et sa réponse à l'historique
   */
  addMessage(message: AgentMessage, response: AgentResponse, agentId?: string): void {
    this.sharedContext.conversationHistory.push({
      message,
      response,
      timestamp: new Date(),
      agentId
    });
  }

  /**
   * Ajouter une délégation à l'historique
   */
  addDelegation(delegation: DelegationHistoryEntry): void {
    this.delegationHistory.push(delegation);
  }

  /**
   * Obtenir l'historique des délégations
   */
  getDelegationHistory(): DelegationHistoryEntry[] {
    return [...this.delegationHistory];
  }

  /**
   * Obtenir l'historique de la conversation
   */
  getConversationHistory(): Array<{
    message: AgentMessage;
    response: AgentResponse;
    timestamp: Date;
    agentId?: string;
  }> {
    return [...this.sharedContext.conversationHistory];
  }

  /**
   * Obtenir le contexte partagé
   */
  getSharedContext(): SharedContext {
    return {
      ...this.sharedContext,
      sharedKnowledge: new Map(this.sharedContext.sharedKnowledge),
      conversationHistory: [...this.sharedContext.conversationHistory]
    };
  }

  /**
   * Obtenir le contexte complet (partagé + délégations)
   */
  getFullContext(): {
    shared: SharedContext;
    delegations: DelegationHistoryEntry[];
    metadata: Map<string, any>;
  } {
    return {
      shared: this.getSharedContext(),
      delegations: this.getDelegationHistory(),
      metadata: new Map(this.metadata)
    };
  }

  /**
   * Définir des métadonnées
   */
  setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
  }

  /**
   * Obtenir des métadonnées
   */
  getMetadata(key: string): any {
    return this.metadata.get(key);
  }

  /**
   * Supprimer des métadonnées
   */
  removeMetadata(key: string): boolean {
    return this.metadata.delete(key);
  }

  /**
   * Obtenir un résumé du contexte
   */
  getContextSummary(): {
    conversationId: string;
    participants: string[];
    topic: string;
    goals: string[];
    constraints: string[];
    messageCount: number;
    delegationCount: number;
    sharedKnowledgeKeys: string[];
  } {
    return {
      conversationId: this.conversationId,
      participants: [...this.sharedContext.participants],
      topic: this.sharedContext.topic,
      goals: [...this.sharedContext.goals],
      constraints: [...this.sharedContext.constraints],
      messageCount: this.sharedContext.conversationHistory.length,
      delegationCount: this.delegationHistory.length,
      sharedKnowledgeKeys: Array.from(this.sharedContext.sharedKnowledge.keys())
    };
  }

  /**
   * Vérifier si un agent a participé à la conversation
   */
  hasParticipant(agentId: string): boolean {
    return this.sharedContext.participants.includes(agentId);
  }

  /**
   * Obtenir les agents qui ont répondu dans la conversation
   */
  getRespondingAgents(): string[] {
    const agents = new Set<string>();
    this.sharedContext.conversationHistory.forEach(entry => {
      if (entry.agentId) {
        agents.add(entry.agentId);
      }
    });
    return Array.from(agents);
  }

  /**
   * Obtenir les agents qui ont été délégués
   */
  getDelegatedAgents(): string[] {
    const agents = new Set<string>();
    this.delegationHistory.forEach(delegation => {
      agents.add(delegation.to);
    });
    return Array.from(agents);
  }

  /**
   * Obtenir les statistiques de la conversation
   */
  getConversationStats(): {
    totalMessages: number;
    totalDelegations: number;
    successfulDelegations: number;
    failedDelegations: number;
    averageResponseTime: number;
    participants: string[];
    respondingAgents: string[];
    delegatedAgents: string[];
  } {
    const successfulDelegations = this.delegationHistory.filter(d => d.success).length;
    const failedDelegations = this.delegationHistory.filter(d => !d.success).length;

    // Calculer le temps de réponse moyen
    let totalResponseTime = 0;
    let responseCount = 0;

    this.sharedContext.conversationHistory.forEach(entry => {
      if (entry.response && entry.response.metadata?.responseTime) {
        totalResponseTime += entry.response.metadata.responseTime;
        responseCount++;
      }
    });

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    return {
      totalMessages: this.sharedContext.conversationHistory.length,
      totalDelegations: this.delegationHistory.length,
      successfulDelegations,
      failedDelegations,
      averageResponseTime,
      participants: [...this.sharedContext.participants],
      respondingAgents: this.getRespondingAgents(),
      delegatedAgents: this.getDelegatedAgents()
    };
  }

  /**
   * Effacer l'historique de la conversation
   */
  clearHistory(): void {
    this.sharedContext.conversationHistory = [];
    this.delegationHistory = [];
  }

  /**
   * Effacer les connaissances partagées
   */
  clearSharedKnowledge(): void {
    this.sharedContext.sharedKnowledge.clear();
  }

  /**
   * Effacer les métadonnées
   */
  clearMetadata(): void {
    this.metadata.clear();
  }

  /**
   * Réinitialiser complètement le contexte
   */
  reset(): void {
    this.sharedContext = {
      conversationId: this.conversationId,
      participants: [],
      topic: '',
      goals: [],
      constraints: [],
      sharedKnowledge: new Map(),
      conversationHistory: []
    };
    this.delegationHistory = [];
    this.metadata.clear();
  }

  /**
   * Exporter le contexte pour sauvegarde
   */
  export(): any {
    return {
      conversationId: this.conversationId,
      sharedContext: {
        ...this.sharedContext,
        sharedKnowledge: Object.fromEntries(this.sharedContext.sharedKnowledge)
      },
      delegationHistory: this.delegationHistory,
      metadata: Object.fromEntries(this.metadata)
    };
  }

  /**
   * Importer le contexte depuis une sauvegarde
   */
  import(data: any): void {
    if (data.conversationId) {
      this.conversationId = data.conversationId;
    }
    
    if (data.sharedContext) {
      this.sharedContext = {
        ...data.sharedContext,
        sharedKnowledge: new Map(Object.entries(data.sharedContext.sharedKnowledge || {}))
      };
    }
    
    if (data.delegationHistory) {
      this.delegationHistory = data.delegationHistory;
    }
    
    if (data.metadata) {
      this.metadata = new Map(Object.entries(data.metadata));
    }
  }
}
