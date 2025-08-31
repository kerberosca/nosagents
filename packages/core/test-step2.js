const { PrismaClient } = require('@prisma/client');
const { OllamaProvider } = require('./dist/src/models/ollama-provider');
const { Agent } = require('./dist/src/runtime/agent');
const { AgentManager } = require('./dist/src/runtime/agent-manager');
const { ToolRegistry } = require('./dist/src/tools/tool-registry');
const { MemoryManager } = require('./dist/src/memory/memory-manager');
const { RagSearchTool, MathEvaluateTool } = require('./dist/src/tools/builtin-tools');

async function testStep2() {
  console.log('🚀 Test de l\'ÉTAPE 2 : Modèles AI\n');

  try {
    // 1. Test de connexion à la base de données
    console.log('1. Test de connexion à la base de données...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Connexion à PostgreSQL réussie');

    // 2. Test du provider Ollama
    console.log('\n2. Test du provider Ollama...');
    const ollamaProvider = new OllamaProvider({
      model: 'qwen2.5:7b',
      baseUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
      temperature: 0.7,
      maxTokens: 1000,
    });

    const isOllamaAvailable = await ollamaProvider.isAvailable();
    if (isOllamaAvailable) {
      console.log('✅ Ollama disponible');
      const models = await ollamaProvider.listModels();
      console.log(`   Modèles disponibles: ${models.length}`);
      
      // 3. Test de génération de texte
      console.log('\n3. Test de génération de texte...');
      try {
        const response = await ollamaProvider.generate({
          messages: [
            { role: 'system', content: 'Tu es un assistant utile.' },
            { role: 'user', content: 'Dis-moi bonjour en français.' }
          ],
          config: {
            model: 'qwen2.5:7b',
            temperature: 0.7,
            maxTokens: 100,
          }
        });
        console.log(`✅ Génération réussie: ${response.content.substring(0, 50)}...`);
      } catch (error) {
        console.log(`⚠️  Génération échouée (modèle peut-être non disponible): ${error.message}`);
      }
    } else {
      console.log('⚠️  Ollama non disponible (démarrez Ollama avec : docker-compose up ollama -d)');
    }

    // 4. Test des outils
    console.log('\n4. Test des outils...');
    const toolRegistry = new ToolRegistry();
    
    // Enregistrer les outils
    toolRegistry.registerTool(new RagSearchTool());
    toolRegistry.registerTool(new MathEvaluateTool());
    
    console.log(`✅ Outils enregistrés: ${toolRegistry.getToolNames().join(', ')}`);

    // 5. Test du Memory Manager
    console.log('\n5. Test du Memory Manager...');
    const memoryManager = new MemoryManager();
    console.log('✅ Memory Manager initialisé');

    // 6. Test de création d'un agent
    console.log('\n6. Test de création d\'un agent...');
    const agentConfig = {
      name: 'TestAgent',
      role: 'Agent de test',
      model: 'qwen2.5:7b',
      goals: ['Tester les modèles AI'],
      tools: ['rag.search', 'math.evaluate'],
      knowledge_packs: [],
      authorizations: {
        network: false,
        filesystem: true,
      },
      memory: {
        type: 'postgres',
        scope: 'per-agent',
      },
      style: {
        tone: 'professionnel',
        language: 'fr-CA',
      },
    };

    const agentManager = new AgentManager(ollamaProvider, toolRegistry, memoryManager);
    const agent = agentManager.registerAgent(agentConfig);
    console.log(`✅ Agent créé: ${agent.getConfig().name} (ID: ${agent.getAgentId()})`);

    // 7. Test de traitement d'un message (si Ollama est disponible)
    if (isOllamaAvailable) {
      console.log('\n7. Test de traitement d\'un message...');
      try {
        const context = {
          agentId: agent.getAgentId(),
          sessionId: 'test-session',
          metadata: { test: true }
        };

        const response = await agent.processMessage('Dis-moi bonjour', context);
        console.log(`✅ Message traité: ${response.content.substring(0, 100)}...`);
        console.log(`   Tool calls: ${response.toolCalls.length}`);
        console.log(`   Thoughts: ${response.thoughts.length}`);
      } catch (error) {
        console.log(`⚠️  Traitement de message échoué: ${error.message}`);
      }
    }

    // 8. Test des statistiques
    console.log('\n8. Test des statistiques...');
    const stats = agentManager.getAgentStats();
    console.log(`✅ Statistiques récupérées: ${Object.keys(stats).length} agents`);

    await prisma.$disconnect();
    console.log('\n🎉 ÉTAPE 2 TERMINÉE AVEC SUCCÈS !');
    console.log('\nProchaines étapes :');
    console.log('1. Finaliser le système RAG (processeurs de documents, LanceDB)');
    console.log('2. Créer l\'application worker');
    console.log('3. Intégrer l\'interface web avec les services');
    console.log('4. Implémenter les outils manquants');
    console.log('5. Ajouter le système de permissions');

  } catch (error) {
    console.error('❌ Erreur lors du test de l\'étape 2:', error);
    console.log('\nVérifiez que :');
    console.log('1. PostgreSQL est démarré : docker-compose up postgres -d');
    console.log('2. Ollama est démarré : docker-compose up ollama -d');
    console.log('3. Le fichier .env est correctement configuré');
  }
}

// Instructions pour l'utilisateur
console.log('📋 Instructions pour l\'ÉTAPE 2 :');
console.log('');
console.log('1. Démarrez Ollama (optionnel pour les tests complets) :');
console.log('   docker-compose up ollama -d');
console.log('');
console.log('2. Lancez ce test :');
console.log('   node test-step2.js');
console.log('');

// Lancer le test si le script est exécuté directement
if (require.main === module) {
  console.log('🚀 Lancement du test de l\'étape 2...');
  testStep2().catch(error => {
    console.error('❌ Erreur dans le test:', error);
  });
}

module.exports = { testStep2 };
