/**
 * Script pour mettre à jour directement le modèle de l'agent Chef
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
    // Récupérer l'agent Chef
    const agentsResponse = await makeRequest(`${WORKER_URL}/api/agents`);
    if (agentsResponse.status === 200) {
      const agents = agentsResponse.data.data;
      const chefAgent = agents.find(agent => agent.name === 'Chef');
      
      if (chefAgent) {
        console.log(`✅ Agent Chef trouvé: ${chefAgent.name} (${chefAgent.id})`);
        console.log(`   Modèle actuel: ${chefAgent.model}`);
        
        // Essayer de mettre à jour via l'API (si elle existe)
        console.log('🔄 Tentative de mise à jour via API...');
        
        try {
          const updateResponse = await makeRequest(`${WORKER_URL}/api/agents/${chefAgent.id}`, {
            method: 'PUT',
            body: {
              model: 'qwen2.5:3b'
            }
          });
          
          if (updateResponse.status === 200) {
            console.log('✅ Mise à jour réussie via API !');
            console.log('   Nouveau modèle:', updateResponse.data.model);
          } else {
            console.log('⚠️  API de mise à jour non disponible');
            console.log('   Status:', updateResponse.status);
            console.log('   Response:', updateResponse.data);
          }
        } catch (error) {
          console.log('⚠️  API de mise à jour non disponible:', error.message);
        }
        
        console.log('\n💡 Solutions alternatives:');
        console.log('   1. Redémarrer le worker après avoir modifié agents/chef.yaml');
        console.log('   2. Utiliser une requête SQL directe:');
        console.log(`      UPDATE agents SET model = 'qwen2.5:3b' WHERE id = '${chefAgent.id}';`);
        
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
