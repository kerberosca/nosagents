import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyer la base de données
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.toolCall.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.knowledgePack.deleteMany();
  await prisma.workflowParticipant.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.user.deleteMany();

  // Créer des utilisateurs de test
  console.log('👤 Création des utilisateurs...');
  const user1 = await prisma.user.create({
    data: {
      email: 'admin@elavira.local',
      name: 'Administrateur',
      role: 'admin',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user@elavira.local',
      name: 'Utilisateur Test',
      role: 'user',
    },
  });

  // Créer des outils de base
  console.log('🛠️ Création des outils...');
  const tools = await Promise.all([
    prisma.tool.create({
      data: {
        name: 'rag.search',
        description: 'Recherche dans la base de connaissances RAG',
        schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Requête de recherche' },
            k: { type: 'number', description: 'Nombre de résultats', default: 5 },
            filters: { type: 'object', description: 'Filtres de recherche' },
          },
          required: ['query'],
        },
      },
    }),
    prisma.tool.create({
      data: {
        name: 'rag.answer',
        description: 'Génère une réponse basée sur la recherche RAG',
        schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Question à répondre' },
            context: { type: 'string', description: 'Contexte de recherche' },
          },
          required: ['query'],
        },
      },
    }),
    prisma.tool.create({
      data: {
        name: 'fs.read',
        description: 'Lit un fichier du système de fichiers',
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Chemin du fichier' },
          },
          required: ['path'],
        },
      },
    }),
    prisma.tool.create({
      data: {
        name: 'fs.write',
        description: 'Écrit dans un fichier du système de fichiers',
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Chemin du fichier' },
            content: { type: 'string', description: 'Contenu à écrire' },
          },
          required: ['path', 'content'],
        },
      },
    }),
    prisma.tool.create({
      data: {
        name: 'math.evaluate',
        description: 'Évalue une expression mathématique',
        schema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Expression mathématique' },
          },
          required: ['expression'],
        },
      },
    }),
    prisma.tool.create({
      data: {
        name: 'calendar.local',
        description: 'Gère le calendrier local',
        schema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['get', 'add', 'remove'], description: 'Action à effectuer' },
            event: { type: 'object', description: 'Détails de l\'événement' },
          },
          required: ['action'],
        },
      },
    }),
  ]);

  // Créer des agents de test
  console.log('🤖 Création des agents...');
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        name: 'Assistant',
        role: 'Assistant général polyvalent',
        description: 'Assistant capable d\'aider avec diverses tâches',
        model: 'qwen2.5:7b',
        goals: [
          'Aider l\'utilisateur avec ses questions',
          'Utiliser les outils disponibles de manière efficace',
          'Maintenir une conversation naturelle et utile',
        ],
        tools: ['rag.search', 'rag.answer', 'math.evaluate', 'fs.read'],
        knowledgePackIds: [],
        authorizations: {
          network: false,
          filesystem: true,
          maxFileSize: 1024 * 1024, // 1MB
          allowedPaths: ['./data', './sandbox'],
        },
        style: {
          tone: 'professionnel',
          language: 'fr',
          personality: 'serviable et précis',
        },
      },
    }),
    prisma.agent.create({
      data: {
        name: 'Chef',
        role: 'Chef cuisinier spécialisé',
        description: 'Expert en cuisine et recettes',
        model: 'qwen2.5:7b',
        goals: [
          'Créer des recettes délicieuses',
          'Expliquer les techniques culinaires',
          'Suggérer des alternatives d\'ingrédients',
        ],
        tools: ['rag.search', 'rag.answer', 'math.evaluate'],
        knowledgePackIds: ['recettes'],
        authorizations: {
          network: false,
          filesystem: false,
        },
        style: {
          tone: 'chaleureux',
          language: 'fr',
          personality: 'passionné de cuisine',
        },
      },
    }),
    prisma.agent.create({
      data: {
        name: 'Prof',
        role: 'Professeur et tuteur',
        description: 'Expert en enseignement et explications',
        model: 'qwen2.5:7b',
        goals: [
          'Expliquer des concepts complexes',
          'Créer des exercices d\'apprentissage',
          'Adapter l\'enseignement au niveau de l\'élève',
        ],
        tools: ['rag.search', 'rag.answer', 'math.evaluate'],
        knowledgePackIds: ['enseignement'],
        authorizations: {
          network: false,
          filesystem: false,
        },
        style: {
          tone: 'pédagogique',
          language: 'fr',
          personality: 'patient et encourageant',
        },
      },
    }),
  ]);

  // Créer des packs de connaissances
  console.log('📚 Création des packs de connaissances...');
  const knowledgePacks = await Promise.all([
    prisma.knowledgePack.create({
      data: {
        name: 'Recettes de cuisine',
        description: 'Collection de recettes traditionnelles et modernes',
        path: './data/knowledge/recettes',
        metadata: {
          category: 'cuisine',
          tags: ['recettes', 'cuisine', 'gastronomie'],
          language: 'fr',
        },
      },
    }),
    prisma.knowledgePack.create({
      data: {
        name: 'Enseignement',
        description: 'Matériel pédagogique et cours',
        path: './data/knowledge/enseignement',
        metadata: {
          category: 'éducation',
          tags: ['enseignement', 'cours', 'pédagogie'],
          language: 'fr',
        },
      },
    }),
  ]);

  // Créer quelques conversations de test
  console.log('💬 Création des conversations...');
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        title: 'Discussion générale',
        agentId: agents[0].id, // Assistant
        userId: user2.id,
      },
    }),
    prisma.conversation.create({
      data: {
        title: 'Recette de carbonara',
        agentId: agents[1].id, // Chef
        userId: user2.id,
      },
    }),
  ]);

  // Ajouter quelques messages de test
  console.log('💭 Ajout de messages...');
  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        role: 'user',
        content: 'Bonjour ! Pouvez-vous m\'aider ?',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        agentId: agents[0].id,
        role: 'assistant',
        content: 'Bonjour ! Bien sûr, je suis là pour vous aider. Que puis-je faire pour vous ?',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[1].id,
        role: 'user',
        content: 'J\'aimerais une recette de carbonara',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[1].id,
        agentId: agents[1].id,
        role: 'assistant',
        content: 'Excellente idée ! La carbonara est un plat italien délicieux. Voici une recette traditionnelle...',
      },
    }),
  ]);

  // Créer quelques logs système
  console.log('📝 Création des logs système...');
  await Promise.all([
    prisma.systemLog.create({
      data: {
        level: 'info',
        category: 'system',
        message: 'Base de données initialisée avec succès',
        metadata: { version: '1.0.0' },
      },
    }),
    prisma.systemLog.create({
      data: {
        level: 'info',
        category: 'agent',
        message: 'Agent Assistant créé',
        metadata: { agentId: agents[0].id },
      },
    }),
    prisma.systemLog.create({
      data: {
        level: 'info',
        category: 'agent',
        message: 'Agent Chef créé',
        metadata: { agentId: agents[1].id },
      },
    }),
    prisma.systemLog.create({
      data: {
        level: 'info',
        category: 'agent',
        message: 'Agent Prof créé',
        metadata: { agentId: agents[2].id },
      },
    }),
  ]);

  console.log('✅ Seeding terminé avec succès !');
  console.log(`📊 Statistiques :
  - ${agents.length} agents créés
  - ${tools.length} outils créés
  - ${knowledgePacks.length} packs de connaissances créés
  - ${conversations.length} conversations créées
  - ${user1.email} (admin)
  - ${user2.email} (user)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
