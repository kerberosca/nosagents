/**
 * Script pour vérifier le modèle dans la base de données
 */

const { Client } = require('pg');

async function checkChefModel() {
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

    console.log('🔍 Vérification du modèle de l\'agent Chef...');
    const result = await client.query(
      "SELECT id, name, model FROM agents WHERE name = 'Chef'"
    );

    if (result.rows.length > 0) {
      const agent = result.rows[0];
      console.log('✅ Agent Chef trouvé:');
      console.log(`   ID: ${agent.id}`);
      console.log(`   Nom: ${agent.name}`);
      console.log(`   Modèle: ${agent.model}`);
      
      if (agent.model === 'qwen2.5:3b') {
        console.log('🎉 Modèle optimisé détecté !');
      } else {
        console.log('⚠️  Modèle non optimisé:', agent.model);
        console.log('🔄 Mise à jour nécessaire...');
        
        const updateResult = await client.query(
          "UPDATE agents SET model = 'qwen2.5:3b' WHERE name = 'Chef' RETURNING model"
        );
        
        if (updateResult.rows.length > 0) {
          console.log('✅ Mise à jour réussie !');
          console.log(`   Nouveau modèle: ${updateResult.rows[0].model}`);
        }
      }
    } else {
      console.log('❌ Agent Chef non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Déconnexion de la base de données');
  }
}

checkChefModel();
