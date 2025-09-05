/**
 * Script pour vérifier les IDs des agents
 */

const http = require('http');

console.log('🔍 Vérification des IDs des agents');
console.log('==================================');

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

// Vérifier les agents
async function checkAgents() {
  console.log('\n1. Vérification des agents...');
  try {
    const response = await makeRequest(`${WORKER_URL}/api/agents`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ Agents récupérés avec succès');
      console.log(`   Nombre d'agents: ${response.data.data.length}`);
      console.log('\n   Détails des agents:');
      response.data.data.forEach((agent, index) => {
        console.log(`   ${index + 1}. ${agent.name}`);
        console.log(`      ID: ${agent.id}`);
        console.log(`      Rôle: ${agent.role}`);
        console.log(`      Modèle: ${agent.model}`);
        console.log('');
      });
      return response.data.data;
    } else {
      console.log('❌ Erreur lors de la récupération des agents');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }
  return [];
}

// Fonction principale
async function runCheck() {
  console.log('🚀 Démarrage de la vérification...\n');
  
  const agents = await checkAgents();
  
  if (agents.length > 0) {
    console.log('\n💡 Utilisez l\'un de ces IDs pour tester:');
    agents.forEach(agent => {
      console.log(`   - ${agent.name}: ${agent.id}`);
    });
  }
  
  console.log('\n✨ Vérification terminée !');
}

// Exécuter la vérification
runCheck().catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
  process.exit(1);
});
