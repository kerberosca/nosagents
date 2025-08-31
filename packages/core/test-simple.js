const { PrismaClient } = require('@prisma/client');

async function testSimple() {
  console.log('🚀 Test simple de l\'ÉTAPE 1\n');

  try {
    // 1. Test de connexion à la base de données
    console.log('1. Test de connexion à la base de données...');
    const prisma = new PrismaClient();
    
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à PostgreSQL réussie');

    // Test de requête simple
    const agentCount = await prisma.agent.count();
    console.log(`✅ Base de données accessible (${agentCount} agents)`);

    // Test de création d'un agent
    console.log('\n2. Test de création d\'un agent...');
    const testAgent = await prisma.agent.create({
      data: {
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
      }
    });
    console.log(`✅ Agent créé: ${testAgent.name} (ID: ${testAgent.id})`);

    // Test de création d'une conversation
    console.log('\n3. Test de création d\'une conversation...');
    const testConversation = await prisma.conversation.create({
      data: {
        agentId: testAgent.id,
        title: 'Test de conversation'
      }
    });
    console.log(`✅ Conversation créée: ${testConversation.title} (ID: ${testConversation.id})`);

    // Test d'ajout d'un message
    console.log('\n4. Test d\'ajout d\'un message...');
    const testMessage = await prisma.message.create({
      data: {
        conversationId: testConversation.id,
        role: 'user',
        content: 'Bonjour, c\'est un test de l\'étape 1'
      }
    });
    console.log(`✅ Message ajouté: ${testMessage.content.substring(0, 50)}...`);

    // Test de création d'une mémoire
    console.log('\n5. Test de création d\'une mémoire...');
    const testMemory = await prisma.memory.create({
      data: {
        agentId: testAgent.id,
        type: 'conversation',
        content: 'Test de mémoire de conversation',
        metadata: { test: true }
      }
    });
    console.log(`✅ Mémoire créée: ${testMemory.type} (ID: ${testMemory.id})`);

    // Nettoyage des données de test
    console.log('\n6. Nettoyage des données de test...');
    await prisma.message.deleteMany({ where: { conversationId: testConversation.id } });
    await prisma.conversation.delete({ where: { id: testConversation.id } });
    await prisma.memory.delete({ where: { id: testMemory.id } });
    await prisma.agent.delete({ where: { id: testAgent.id } });
    console.log('✅ Données de test nettoyées');

    await prisma.$disconnect();
    console.log('\n🎉 ÉTAPE 1 TERMINÉE AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ Erreur lors du test simple:', error);
    console.log('\nVérifiez que :');
    console.log('1. PostgreSQL est démarré : docker-compose up postgres -d');
    console.log('2. Le fichier .env est correctement configuré');
    console.log('3. Prisma est initialisé : pnpm db:generate && pnpm db:push');
  }
}

// Lancer le test
testSimple();
