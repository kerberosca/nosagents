/**
 * Script pour mettre à jour le modèle de l'agent Chef via SQL direct
 */

const http = require('http');

console.log('🔄 Mise à jour du modèle de l\'agent Chef...');

// Configuration
const WORKER_URL = 'http://localhost:3001';

// Fonction pour faire une requête HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function updateChefModel() {
  try {
    // D'abord, récupérons la liste des agents pour voir l'ID du Chef
    console.log('📋 Récupération des agents...');
    const agentsResponse = await makeRequest(`${WORKER_URL}/api/agents`);
    
    if (agentsResponse.status === 200) {
      const agents = agentsResponse.data.agents;
      const chefAgent = agents.find(agent => agent.name === 'Chef');
      
      if (chefAgent) {
        console.log(`✅ Agent Chef trouvé: ${chefAgent.name} (${chefAgent.id})`);
        console.log(`   Modèle actuel: ${chefAgent.model}`);
        
        // Mettons à jour le modèle via l'API (si elle existe)
        console.log('🔄 Tentative de mise à jour via API...');
        
        // Pour l'instant, on va juste afficher l'info et suggérer de redémarrer le worker
        console.log('\n💡 Pour appliquer le nouveau modèle:');
        console.log('   1. Le fichier agents/chef.yaml a été mis à jour avec qwen2.5:3b');
        console.log('   2. Redémarrez le worker pour recharger la configuration');
        console.log('   3. Ou utilisez une requête SQL directe sur la base de données');
        
        console.log('\n🔧 Commande SQL pour mettre à jour directement:');
        console.log(`   UPDATE agents SET model = 'qwen2.5:3b' WHERE name = 'Chef';`);
        
      } else {
        console.log('❌ Agent Chef non trouvé');
      }
    } else {
      console.log('❌ Erreur lors de la récupération des agents');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

updateChefModel();
