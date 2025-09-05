/**
 * Script de debug pour vérifier la structure des agents
 */

const http = require('http');

console.log('🔍 Debug des agents...');

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

async function debugAgents() {
  try {
    console.log('📋 Récupération des agents...');
    const response = await makeRequest(`${WORKER_URL}/api/agents`);
    
    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.agents) {
      console.log('\n✅ Agents trouvés:');
      response.data.agents.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.model}) - ID: ${agent.id}`);
      });
    } else if (response.data && Array.isArray(response.data)) {
      console.log('\n✅ Agents trouvés (array direct):');
      response.data.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.model}) - ID: ${agent.id}`);
      });
    } else {
      console.log('\n❌ Structure inattendue');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

debugAgents();
