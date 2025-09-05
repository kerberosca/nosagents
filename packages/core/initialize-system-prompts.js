#!/usr/bin/env node

/**
 * Script pour initialiser les systemPrompt des agents existants
 * avec le prompt générique basé sur leur configuration
 */

const { PrismaClient } = require('@prisma/client');

async function initializeSystemPrompts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Initialisation des systemPrompt des agents existants...');
    
    // Récupérer tous les agents actifs
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        description: true,
        model: true,
        systemPrompt: true,
        goals: true,
        tools: true,
        style: true,
      },
    });

    console.log(`📊 Trouvé ${agents.length} agents actifs`);

    for (const agent of agents) {
      // Si l'agent a déjà un systemPrompt, on le garde
      if (agent.systemPrompt && agent.systemPrompt.trim()) {
        console.log(`✅ Agent "${agent.name}" a déjà un systemPrompt personnalisé`);
        continue;
      }

      // Générer le prompt générique
      const genericPrompt = `Tu es ${agent.name}, ${agent.role}.

Objectifs:
${(agent.goals || []).map((goal) => `- ${goal}`).join('\n')}

Ton style de communication: ${agent.style?.tone || 'professionnel'}
Langue: ${agent.style?.language || 'fr-CA'}

Outils disponibles: ${(agent.tools || []).join(', ')}

Instructions:
1. Réponds toujours en français canadien
2. Sois utile et précis
3. Utilise les outils quand c'est nécessaire
4. Explique tes raisonnements
5. Respecte les autorisations de sécurité`;

      // Mettre à jour l'agent avec le prompt générique
      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          systemPrompt: genericPrompt,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Agent "${agent.name}" initialisé avec le prompt générique`);
    }

    console.log('🎉 Initialisation terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  initializeSystemPrompts();
}

module.exports = { initializeSystemPrompts };
