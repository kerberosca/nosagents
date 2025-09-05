/**
 * Script pour vérifier les agents dans la base de données
 */

const { PrismaClient } = require('@prisma/client');

console.log('🔍 Vérification des agents dans la base de données');
console.log('==================================================');

const prisma = new PrismaClient();

async function checkAgents() {
  try {
    console.log('\n1. Agents dans la base de données:');
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`   Nombre d'agents: ${agents.length}`);
    agents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent.name} (${agent.role})`);
      console.log(`      ID: ${agent.id}`);
      console.log(`      Actif: ${agent.isActive}`);
      console.log(`      Créé: ${agent.createdAt}`);
      console.log('');
    });

    console.log('\n2. Mémoires dans la base de données:');
    const memories = await prisma.memory.findMany({
      select: {
        id: true,
        agentId: true,
        type: true,
        content: true,
        createdAt: true
      },
      take: 10 // Limiter à 10 pour éviter trop de logs
    });

    console.log(`   Nombre de mémoires: ${memories.length}`);
    memories.forEach((memory, index) => {
      console.log(`   ${index + 1}. Mémoire ${memory.type}`);
      console.log(`      ID: ${memory.id}`);
      console.log(`      Agent ID: ${memory.agentId}`);
      console.log(`      Contenu: ${memory.content.substring(0, 50)}...`);
      console.log(`      Créé: ${memory.createdAt}`);
      console.log('');
    });

    console.log('\n3. Vérification des contraintes:');
    const orphanMemories = await prisma.memory.findMany({
      where: {
        agent: null
      }
    });

    if (orphanMemories.length > 0) {
      console.log(`   ⚠️  ${orphanMemories.length} mémoires orphelines trouvées !`);
      orphanMemories.forEach(memory => {
        console.log(`      - Mémoire ${memory.id} avec agentId ${memory.agentId}`);
      });
    } else {
      console.log('   ✅ Aucune mémoire orpheline trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la vérification
checkAgents().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
