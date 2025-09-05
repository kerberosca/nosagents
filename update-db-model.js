/**
 * Script pour mettre à jour le modèle dans la base de données
 */

const { Client } = require('pg');

async function updateChefModel() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'elavira',
    user: 'elavira',
    password: 'password'
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    console.log('🔄 Mise à jour du modèle de l\'agent Chef...');
    const result = await client.query(
      "UPDATE agents SET model = 'tinyllama' WHERE name = 'Chef' RETURNING id, name, model"
    );

    if (result.rows.length > 0) {
      const agent = result.rows[0];
      console.log('✅ Agent Chef mis à jour avec succès !');
      console.log(`   ID: ${agent.id}`);
      console.log(`   Nom: ${agent.name}`);
      console.log(`   Nouveau modèle: ${agent.model}`);
    } else {
      console.log('❌ Aucun agent Chef trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Déconnexion de la base de données');
  }
}

updateChefModel();
