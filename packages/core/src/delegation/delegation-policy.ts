import { Agent, AgentMessage } from '../types';
import { ConversationContext } from './conversation-context';

export interface DelegationRule {
  id: string;
  name: string;
  description: string;
  conditions: DelegationCondition[];
  priority: number;
  targetAgentSelector: (agents: Map<string, Agent>, context: ConversationContext) => string | null;
}

export interface DelegationCondition {
  type: 'keyword' | 'complexity' | 'tool' | 'domain' | 'custom';
  value: any;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex' | 'function';
}

export interface PolicyEvaluation {
  shouldDelegate: boolean;
  targetAgentId?: string;
  reason: string;
  confidence: number;
  matchedRules: string[];
}

export class DelegationPolicy {
  private rules: DelegationRule[];
  private defaultRules: DelegationRule[];

  constructor() {
    this.rules = [];
    this.defaultRules = this.createDefaultRules();
    this.rules.push(...this.defaultRules);
  }

  /**
   * Évaluer si une délégation est nécessaire
   */
  evaluate(
    message: AgentMessage,
    analysis: any,
    availableAgents: Map<string, Agent>,
    context: ConversationContext
  ): PolicyEvaluation {
    const matchedRules: DelegationRule[] = [];
    let bestMatch: DelegationRule | null = null;
    let highestPriority = -1;

    // Évaluer toutes les règles
    for (const rule of this.rules) {
      if (this.evaluateRule(rule, message, analysis, context)) {
        matchedRules.push(rule);
        
        if (rule.priority > highestPriority) {
          highestPriority = rule.priority;
          bestMatch = rule;
        }
      }
    }

    // Si aucune règle ne correspond, pas de délégation
    if (!bestMatch) {
      return {
        shouldDelegate: false,
        reason: 'No matching delegation rules',
        confidence: 0.5,
        matchedRules: []
      };
    }

    // Sélectionner l'agent cible
    const targetAgentId = bestMatch.targetAgentSelector(availableAgents, context);

    if (!targetAgentId) {
      return {
        shouldDelegate: false,
        reason: 'No suitable target agent found',
        confidence: 0.3,
        matchedRules: matchedRules.map(r => r.id)
      };
    }

    return {
      shouldDelegate: true,
      targetAgentId: targetAgentId,
      reason: bestMatch.description,
      confidence: this.calculateConfidence(bestMatch, matchedRules),
      matchedRules: matchedRules.map(r => r.id)
    };
  }

  /**
   * Évaluer une règle spécifique
   */
  private evaluateRule(
    rule: DelegationRule,
    message: AgentMessage,
    analysis: any,
    context: ConversationContext
  ): boolean {
    return rule.conditions.every(condition => 
      this.evaluateCondition(condition, message, analysis, context)
    );
  }

  /**
   * Évaluer une condition spécifique
   */
  private evaluateCondition(
    condition: DelegationCondition,
    message: AgentMessage,
    analysis: any,
    context: ConversationContext
  ): boolean {
    switch (condition.type) {
      case 'keyword':
        return this.evaluateKeywordCondition(condition, message.content);
      
      case 'complexity':
        return this.evaluateComplexityCondition(condition, analysis);
      
      case 'tool':
        return this.evaluateToolCondition(condition, message, analysis);
      
      case 'domain':
        return this.evaluateDomainCondition(condition, analysis);
      
      case 'custom':
        return this.evaluateCustomCondition(condition, message, analysis, context);
      
      default:
        return false;
    }
  }

  /**
   * Évaluer une condition basée sur les mots-clés
   */
  private evaluateKeywordCondition(
    condition: DelegationCondition,
    content: string
  ): boolean {
    const keywords = Array.isArray(condition.value) ? condition.value : [condition.value];
    const contentLower = content.toLowerCase();
    
    switch (condition.operator) {
      case 'contains':
        return keywords.some(keyword => 
          contentLower.includes(keyword.toLowerCase())
        );
      
      case 'equals':
        return keywords.some(keyword => 
          contentLower === keyword.toLowerCase()
        );
      
      case 'regex':
        try {
          const regex = new RegExp(condition.value, 'i');
          return regex.test(content);
        } catch {
          return false;
        }
      
      default:
        return false;
    }
  }

  /**
   * Évaluer une condition basée sur la complexité
   */
  private evaluateComplexityCondition(
    condition: DelegationCondition,
    analysis: any
  ): boolean {
    const complexity = analysis.complexity || 'moderate';
    const complexityLevels = { simple: 1, moderate: 2, complex: 3 };
    const messageComplexity = complexityLevels[complexity] || 2;
    const threshold = condition.value;

    switch (condition.operator) {
      case 'greater_than':
        return messageComplexity > threshold;
      
      case 'less_than':
        return messageComplexity < threshold;
      
      case 'equals':
        return messageComplexity === threshold;
      
      default:
        return false;
    }
  }

  /**
   * Évaluer une condition basée sur les outils
   */
  private evaluateToolCondition(
    condition: DelegationCondition,
    message: AgentMessage,
    analysis: any
  ): boolean {
    const requiredTools = analysis.requiredTools || [];
    const conditionTools = Array.isArray(condition.value) ? condition.value : [condition.value];

    switch (condition.operator) {
      case 'contains':
        return conditionTools.some(tool => requiredTools.includes(tool));
      
      case 'equals':
        return conditionTools.every(tool => requiredTools.includes(tool)) &&
               requiredTools.every(tool => conditionTools.includes(tool));
      
      default:
        return false;
    }
  }

  /**
   * Évaluer une condition basée sur le domaine
   */
  private evaluateDomainCondition(
    condition: DelegationCondition,
    analysis: any
  ): boolean {
    const taskType = analysis.type || 'general';
    const conditionDomains = Array.isArray(condition.value) ? condition.value : [condition.value];

    switch (condition.operator) {
      case 'contains':
        return conditionDomains.some(domain => 
          taskType.toLowerCase().includes(domain.toLowerCase())
        );
      
      case 'equals':
        return conditionDomains.includes(taskType);
      
      default:
        return false;
    }
  }

  /**
   * Évaluer une condition personnalisée
   */
  private evaluateCustomCondition(
    condition: DelegationCondition,
    message: AgentMessage,
    analysis: any,
    context: ConversationContext
  ): boolean {
    if (condition.operator === 'function' && typeof condition.value === 'function') {
      try {
        return condition.value(message, analysis, context);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Calculer la confiance de la délégation
   */
  private calculateConfidence(
    bestMatch: DelegationRule,
    matchedRules: DelegationRule[]
  ): number {
    // Base confidence sur la priorité de la règle
    let confidence = Math.min(bestMatch.priority / 10, 1.0);
    
    // Augmenter la confiance si plusieurs règles correspondent
    if (matchedRules.length > 1) {
      confidence += 0.1;
    }
    
    // Réduire la confiance s'il y a des règles en conflit
    const conflictingRules = matchedRules.filter(rule => 
      rule.priority >= bestMatch.priority * 0.8 && rule.id !== bestMatch.id
    );
    
    if (conflictingRules.length > 0) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Ajouter une règle personnalisée
   */
  addRule(rule: DelegationRule): void {
    this.rules.push(rule);
  }

  /**
   * Supprimer une règle
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Obtenir toutes les règles
   */
  getRules(): DelegationRule[] {
    return [...this.rules];
  }

  /**
   * Créer les règles par défaut
   */
  private createDefaultRules(): DelegationRule[] {
    return [
      // Règle pour les tâches techniques/programmation
      {
        id: 'technical-tasks',
        name: 'Technical Tasks',
        description: 'Delegate technical and programming tasks to specialized agents',
        priority: 8,
        conditions: [
          {
            type: 'keyword',
            value: ['code', 'programming', 'debug', 'algorithm', 'function', 'class', 'api', 'database', 'sql'],
            operator: 'contains'
          },
          {
            type: 'complexity',
            value: 2,
            operator: 'greater_than'
          }
        ],
        targetAgentSelector: (agents, context) => {
          // Chercher un agent avec expertise technique
          for (const [id, agent] of agents.entries()) {
            if (agent.role.toLowerCase().includes('developer') ||
                agent.role.toLowerCase().includes('programmer') ||
                agent.role.toLowerCase().includes('engineer')) {
              return id;
            }
          }
          return null;
        }
      },

      // Règle pour les tâches de recherche
      {
        id: 'research-tasks',
        name: 'Research Tasks',
        description: 'Delegate research and analysis tasks to research agents',
        priority: 7,
        conditions: [
          {
            type: 'keyword',
            value: ['research', 'analyze', 'study', 'investigate', 'find', 'search', 'compare'],
            operator: 'contains'
          }
        ],
        targetAgentSelector: (agents, context) => {
          // Chercher un agent de recherche
          for (const [id, agent] of agents.entries()) {
            if (agent.role.toLowerCase().includes('researcher') ||
                agent.role.toLowerCase().includes('analyst') ||
                agent.tools.includes('rag.search')) {
              return id;
            }
          }
          return null;
        }
      },

      // Règle pour les tâches créatives
      {
        id: 'creative-tasks',
        name: 'Creative Tasks',
        description: 'Delegate creative tasks to creative agents',
        priority: 6,
        conditions: [
          {
            type: 'keyword',
            value: ['write', 'create', 'design', 'compose', 'generate', 'story', 'content'],
            operator: 'contains'
          }
        ],
        targetAgentSelector: (agents, context) => {
          // Chercher un agent créatif
          for (const [id, agent] of agents.entries()) {
            if (agent.role.toLowerCase().includes('writer') ||
                agent.role.toLowerCase().includes('creative') ||
                agent.role.toLowerCase().includes('content')) {
              return id;
            }
          }
          return null;
        }
      },

      // Règle pour les tâches mathématiques
      {
        id: 'math-tasks',
        name: 'Mathematical Tasks',
        description: 'Delegate mathematical calculations to math agents',
        priority: 9,
        conditions: [
          {
            type: 'keyword',
            value: ['calculate', 'compute', 'solve', 'equation', 'formula', 'math', 'statistics'],
            operator: 'contains'
          },
          {
            type: 'tool',
            value: ['math.evaluate'],
            operator: 'contains'
          }
        ],
        targetAgentSelector: (agents, context) => {
          // Chercher un agent avec outils mathématiques
          for (const [id, agent] of agents.entries()) {
            if (agent.tools.includes('math.evaluate') ||
                agent.role.toLowerCase().includes('mathematician') ||
                agent.role.toLowerCase().includes('analyst')) {
              return id;
            }
          }
          return null;
        }
      },

      // Règle pour les tâches de support
      {
        id: 'support-tasks',
        name: 'Support Tasks',
        description: 'Delegate customer support tasks to support agents',
        priority: 5,
        conditions: [
          {
            type: 'keyword',
            value: ['help', 'support', 'problem', 'issue', 'customer', 'service'],
            operator: 'contains'
          }
        ],
        targetAgentSelector: (agents, context) => {
          // Chercher un agent de support
          for (const [id, agent] of agents.entries()) {
            if (agent.role.toLowerCase().includes('support') ||
                agent.role.toLowerCase().includes('help') ||
                agent.role.toLowerCase().includes('assistant')) {
              return id;
            }
          }
          return null;
        }
      }
    ];
  }
}
