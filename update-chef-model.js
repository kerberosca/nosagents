/**
 * Script pour mettre à jour le modèle de l'agent Chef
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateChefModel() {
  try {
    console.log('🔄 Mise à jour du modèle de l\'agent Chef...');
    
    // Mettre à jour l'agent Chef avec le modèle plus rapide
    const updatedAgent = await prisma.agent.update({
      where: {
        name: 'Chef'
      },
      data: {
        model: 'qwen2.5:3b'
      }
    });
    
    console.log('✅ Agent Chef mis à jour avec succès !');
    console.log(`   Nom: ${updatedAgent.name}`);
    console.log(`   Modèle: ${updatedAgent.model}`);
    console.log(`   ID: ${updatedAgent.id}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateChefModel();
