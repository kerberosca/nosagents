const { 
  AgentService, 
  ConversationService, 
  ToolService, 
  LogService,
  MemoryService,
  KnowledgeService,
  WorkflowService,
  prisma,
  healthCheck
} = require('./dist/index');

const { MemoryManager } = require('./dist/memory/memory-manager');
const { OllamaProvider } = require('./dist/models/ollama-provider');

async function testStep1() {
  console.log('🚀 Test de l\'ÉTAPE 1 : Configuration et environnement\n');

  try {
    // 1. Test de connexion à la base de données
    console.log('1. Test de connexion à la base de données...');
    const isHealthy = await healthCheck();
    if (isHealthy) {
      console.log('✅ Connexion à PostgreSQL réussie');
    } else {
      console.log('❌ Échec de connexion à PostgreSQL');
      console.log('   Vérifiez que :');
      console.log('   - PostgreSQL est démarré (docker-compose up postgres -d)');
      console.log('   - Le fichier .env contient DATABASE_URL=postgresql://elavira:password@localhost:5432/elavira?schema=public');
      return;
    }

    // 2. Test des services de base de données
    console.log('\n2. Test des services de base de données...');
    
    const agentService = new AgentService();
    const conversationService = new ConversationService();
    const toolService = new ToolService();
    const logService = new LogService();
    const memoryService = new MemoryService();
    const knowledgeService = new KnowledgeService();
    const workflowService = new WorkflowService();

    console.log('✅ Tous les services de base de données initialisés');

    // 3. Test du Memory Manager
    console.log('\n3. Test du Memory Manager...');
    const memoryManager = new MemoryManager();
    console.log('✅ Memory Manager initialisé');

    // 4. Test du provider Ollama
    console.log('\n4. Test du provider Ollama...');
    const ollamaProvider = new OllamaProvider({
      model: 'qwen2.5:7b',
      baseUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434'
    });

    const isOllamaAvailable = await ollamaProvider.isAvailable();
    if (isOllamaAvailable) {
      console.log('✅ Ollama disponible');
      const models = await ollamaProvider.listModels();
      console.log(`   Modèles disponibles: ${models.length}`);
    } else {
      console.log('⚠️  Ollama non disponible (démarrez Ollama avec : docker-compose up ollama -d)');
    }

    // 5. Test de création d'un agent
    console.log('\n5. Test de création d\'un agent...');
    try {
      const testAgent = await agentService.createAgent({
        name: 'TestAgent',
        role: 'Agent de test',
        description: 'Agent pour tester l\'étape 1',
        model: 'qwen2.5:7b',
        goals: ['Tester les fonctionnalités'],
        tools: ['rag.search', 'math.evaluate'],
        knowledgePackIds: [],
        authorizations: {
          network: false,
          filesystem: true,
          tools: ['rag.search', 'math.evaluate']
        }
      });
      console.log(`✅ Agent créé: ${testAgent.name} (ID: ${testAgent.id})`);

      // 6. Test de création d'une conversation
      console.log('\n6. Test de création d\'une conversation...');
      const testConversation = await conversationService.createConversation({
        agentId: testAgent.id,
        title: 'Test de conversation'
      });
      console.log(`✅ Conversation créée: ${testConversation.title} (ID: ${testConversation.id})`);

      // 7. Test d'ajout d'un message
      console.log('\n7. Test d\'ajout d\'un message...');
      const testMessage = await conversationService.addMessage({
        conversationId: testConversation.id,
        role: 'user',
        content: 'Bonjour, c\'est un test de l\'étape 1'
      });
      console.log(`✅ Message ajouté: ${testMessage.content.substring(0, 50)}...`);

      // 8. Test du Memory Manager
      console.log('\n8. Test du Memory Manager...');
      const memory = await memoryManager.addConversationMemory(
        testAgent.id,
        testConversation.id,
        'Test de mémoire de conversation',
        { test: true }
      );
      console.log(`✅ Mémoire ajoutée: ${memory.type} (ID: ${memory.id})`);

      // 9. Test de récupération des mémoires
      const memories = await memoryManager.getRelevantMemories({
        agentId: testAgent.id,
        limit: 5
      });
      console.log(`✅ Mémoires récupérées: ${memories.memories.length}`);

      // 10. Nettoyage des données de test
      console.log('\n10. Nettoyage des données de test...');
      await conversationService.deleteConversation(testConversation.id);
      await agentService.deleteAgent(testAgent.id);
      console.log('✅ Données de test nettoyées');

    } catch (error) {
      console.log(`❌ Erreur lors des tests de base de données: ${error.message}`);
    }

    // 11. Test des logs
    console.log('\n11. Test des logs...');
    await logService.info('test', 'Test de l\'étape 1 réussi');
    console.log('✅ Logs fonctionnels');

    console.log('\n🎉 ÉTAPE 1 TERMINÉE AVEC SUCCÈS !');
    console.log('\nProchaines étapes :');
    console.log('1. Créer l\'application worker (apps/worker)');
    console.log('2. Intégrer les API routes Next.js');
    console.log('3. Connecter l\'interface web avec les services');
    console.log('4. Implémenter les outils manquants');
    console.log('5. Ajouter le système de permissions');

  } catch (error) {
    console.error('❌ Erreur lors du test de l\'étape 1:', error);
    console.log('\nVérifiez que :');
    console.log('1. PostgreSQL est démarré : docker-compose up postgres -d');
    console.log('2. Le fichier .env est correctement configuré');
    console.log('3. Prisma est initialisé : pnpm db:generate && pnpm db:push');
  } finally {
    await prisma.$disconnect();
  }
}

// Instructions pour l'utilisateur
console.log('📋 Instructions pour l\'ÉTAPE 1 :');
console.log('');
console.log('1. Créez le fichier .env à partir de env.example :');
console.log('   copy env.example .env');
console.log('');
console.log('2. Modifiez le fichier .env avec les bonnes valeurs :');
console.log('   DATABASE_URL=postgresql://elavira:password@localhost:5432/elavira?schema=public');
console.log('   OLLAMA_API_URL=http://localhost:11434/api');
console.log('   NODE_ENV=development');
console.log('');
console.log('3. Démarrez PostgreSQL :');
console.log('   docker-compose up postgres -d');
console.log('');
console.log('4. Initialisez Prisma :');
console.log('   cd packages/core');
console.log('   pnpm db:generate');
console.log('   pnpm db:push');
console.log('');
console.log('5. Lancez ce test :');
console.log('   node test-step1.js');
console.log('');

// Lancer le test si le script est exécuté directement
if (require.main === module) {
  testStep1();
}

module.exports = { testStep1 };
