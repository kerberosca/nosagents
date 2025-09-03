import { RAGTools, RAGToolResult } from './rag-tools';

export interface AgentRAGConfig {
  ollamaUrl?: string;
  textModel?: string;
  embeddingModel?: string;
  defaultKnowledgePack?: string;
  autoInitialize?: boolean;
}

export interface AgentRAGCommand {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<RAGToolResult>;
}

export class AgentRAGIntegration {
  private ragTools: RAGTools;
  private config: AgentRAGConfig;
  private commands: Map<string, AgentRAGCommand> = new Map();

  constructor(config: AgentRAGConfig = {}) {
    this.config = {
      ollamaUrl: 'http://localhost:11434',
      textModel: 'qwen2.5:7b',
      embeddingModel: 'all-minilm:latest',
      defaultKnowledgePack: 'general',
      autoInitialize: true,
      ...config,
    };

    this.ragTools = new RAGTools({
      ollamaUrl: this.config.ollamaUrl,
      textModel: this.config.textModel,
      embeddingModel: this.config.embeddingModel,
      chunkSize: 500,
      chunkOverlap: 100,
      maxSearchResults: 5,
      maxConcurrentEmbeddings: 2,
      batchSize: 3,
      memoryLimit: 512,
      enableStreaming: false,
      cacheEmbeddings: true,
    });

    this.setupCommands();
  }

  /**
   * Configure les commandes RAG disponibles pour l'agent
   */
  private setupCommands(): void {
    // Commande pour initialiser le système RAG
    this.commands.set('rag_init', {
      name: 'rag_init',
      description: 'Initialise le système RAG pour l\'agent',
      parameters: {},
      execute: async () => {
        return await this.ragTools.initialize();
      }
    });

    // Commande pour rechercher des informations
    this.commands.set('rag_search', {
      name: 'rag_search',
      description: 'Recherche des informations dans la base de connaissances',
      parameters: {
        query: { type: 'string', required: true, description: 'Question ou terme à rechercher' },
        knowledgePack: { type: 'string', required: false, description: 'Pack de connaissances à utiliser' },
        maxResults: { type: 'number', required: false, description: 'Nombre maximum de résultats' },
        language: { type: 'string', required: false, description: 'Langue de la recherche' }
      },
      execute: async (params) => {
        return await this.ragTools.searchKnowledge({
          query: params.query,
          knowledgePack: params.knowledgePack || this.config.defaultKnowledgePack,
          maxResults: params.maxResults,
          language: params.language,
        });
      }
    });

    // Commande pour générer une réponse RAG
    this.commands.set('rag_answer', {
      name: 'rag_answer',
      description: 'Génère une réponse complète basée sur la recherche RAG',
      parameters: {
        query: { type: 'string', required: true, description: 'Question à laquelle répondre' },
        knowledgePack: { type: 'string', required: false, description: 'Pack de connaissances à utiliser' },
        style: { type: 'string', required: false, description: 'Style de réponse (simple, detailed, academic)' },
        language: { type: 'string', required: false, description: 'Langue de la réponse' },
        maxContextDocuments: { type: 'number', required: false, description: 'Nombre maximum de documents de contexte' }
      },
      execute: async (params) => {
        return await this.ragTools.generateRAGAnswer({
          query: params.query,
          knowledgePack: params.knowledgePack || this.config.defaultKnowledgePack,
          style: params.style || 'simple',
          language: params.language,
          maxContextDocuments: params.maxContextDocuments,
        });
      }
    });

    // Commande pour ajouter un document
    this.commands.set('rag_add_document', {
      name: 'rag_add_document',
      description: 'Ajoute un document à la base de connaissances',
      parameters: {
        content: { type: 'string', required: true, description: 'Contenu du document' },
        title: { type: 'string', required: false, description: 'Titre du document' },
        source: { type: 'string', required: false, description: 'Source du document' },
        language: { type: 'string', required: false, description: 'Langue du document' },
        knowledgePack: { type: 'string', required: false, description: 'Pack de connaissances cible' }
      },
      execute: async (params) => {
        return await this.ragTools.addDocument({
          content: params.content,
          metadata: {
            title: params.title,
            source: params.source,
            language: params.language,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          knowledgePack: params.knowledgePack || this.config.defaultKnowledgePack,
        });
      }
    });

    // Commande pour créer un pack de connaissances
    this.commands.set('rag_create_pack', {
      name: 'rag_create_pack',
      description: 'Crée un nouveau pack de connaissances',
      parameters: {
        name: { type: 'string', required: true, description: 'Nom du pack' },
        description: { type: 'string', required: true, description: 'Description du pack' }
      },
      execute: async (params) => {
        return await this.ragTools.createKnowledgePack(params.name, params.description);
      }
    });

    // Commande pour obtenir les statistiques
    this.commands.set('rag_stats', {
      name: 'rag_stats',
      description: 'Obtient les statistiques du système RAG',
      parameters: {},
      execute: async () => {
        return await this.ragTools.getSystemStats();
      }
    });

    // Commande pour nettoyer la mémoire
    this.commands.set('rag_cleanup', {
      name: 'rag_cleanup',
      description: 'Nettoie la mémoire et le cache du système RAG',
      parameters: {},
      execute: async () => {
        return await this.ragTools.cleanupMemory();
      }
    });
  }

  /**
   * Initialise automatiquement le système RAG si configuré
   */
  async initialize(): Promise<RAGToolResult> {
    if (this.config.autoInitialize) {
      return await this.ragTools.initialize();
    }
    
    return {
      success: true,
      data: { message: 'RAG system ready for manual initialization' },
    };
  }

  /**
   * Exécute une commande RAG par son nom
   */
  async executeCommand(commandName: string, parameters: any = {}): Promise<RAGToolResult> {
    const command = this.commands.get(commandName);
    
    if (!command) {
      return {
        success: false,
        error: `Unknown RAG command: ${commandName}`,
      };
    }

    try {
      return await command.execute(parameters);
    } catch (error) {
      return {
        success: false,
        error: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Obtient la liste des commandes disponibles
   */
  getAvailableCommands(): AgentRAGCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Obtient une commande spécifique
   */
  getCommand(commandName: string): AgentRAGCommand | undefined {
    return this.commands.get(commandName);
  }

  /**
   * Vérifie si le système RAG est prêt
   */
  isReady(): boolean {
    return this.ragTools.isReady();
  }

  /**
   * Obtient les outils RAG sous-jacents
   */
  getRAGTools(): RAGTools {
    return this.ragTools;
  }

  /**
   * Exemple d'utilisation pour un agent
   */
  async exampleAgentUsage(): Promise<void> {
    console.log('🤖 Exemple d\'utilisation RAG pour un agent...\n');

    // 1. Initialisation
    console.log('1️⃣ Initialisation du système RAG...');
    const initResult = await this.initialize();
    if (!initResult.success) {
      console.error('❌ Échec de l\'initialisation:', initResult.error);
      return;
    }
    console.log('✅ Système RAG initialisé\n');

    // 2. Création d'un pack de connaissances
    console.log('2️⃣ Création d\'un pack de connaissances...');
    const packResult = await this.executeCommand('rag_create_pack', {
      name: 'cuisine_francaise',
      description: 'Recettes et techniques de la cuisine française'
    });
    if (packResult.success) {
      console.log('✅ Pack créé:', packResult.data.message);
    }
    console.log('');

    // 3. Ajout d'un document
    console.log('3️⃣ Ajout d\'un document...');
    const docResult = await this.executeCommand('rag_add_document', {
      content: 'La ratatouille est un plat traditionnel provençal composé de légumes d\'été : aubergines, courgettes, poivrons, tomates et oignons. Les légumes sont d\'abord revenus séparément dans l\'huile d\'olive, puis mijotés ensemble avec des herbes de Provence.',
      title: 'Ratatouille provençale',
      source: 'Livre de cuisine traditionnelle',
      language: 'fr'
    });
    if (docResult.success) {
      console.log('✅ Document ajouté:', docResult.data.message);
    }
    console.log('');

    // 4. Recherche d'informations
    console.log('4️⃣ Recherche d\'informations...');
    const searchResult = await this.executeCommand('rag_search', {
      query: 'ratatouille provençale',
      maxResults: 3
    });
    if (searchResult.success) {
      console.log(`✅ Recherche terminée: ${searchResult.data.totalFound} résultats trouvés`);
    }
    console.log('');

    // 5. Génération d'une réponse
    console.log('5️⃣ Génération d\'une réponse RAG...');
    const answerResult = await this.executeCommand('rag_answer', {
      query: 'Comment préparer une ratatouille ?',
      style: 'detailed',
      language: 'fr'
    });
    if (answerResult.success) {
      console.log('✅ Réponse générée:', answerResult.data.answer.substring(0, 200) + '...');
    }
    console.log('');

    // 6. Statistiques
    console.log('6️⃣ Statistiques du système...');
    const statsResult = await this.executeCommand('rag_stats');
    if (statsResult.success) {
      const stats = statsResult.data;
      console.log(`📊 Documents: ${stats.totalDocuments}`);
      console.log(`📊 Packs: ${stats.knowledgePacks}`);
      console.log(`💾 Mémoire: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }

    console.log('\n🎉 Exemple d\'utilisation terminé !');
  }
}
