/**
 * Script pour forcer le rechargement des agents depuis la base de données
 */

const http = require('http');

console.log('🔄 Forçage du rechargement des agents...');

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

async function forceReload() {
  try {
    console.log('💡 Solutions pour forcer le rechargement:');
    console.log('');
    console.log('1. 🔄 Redémarrer complètement le worker:');
    console.log('   - Arrêter le worker (Ctrl+C)');
    console.log('   - Attendre 5 secondes');
    console.log('   - Relancer: cd apps/worker && pnpm dev');
    console.log('');
    console.log('2. 🗑️  Supprimer temporairement le fichier YAML:');
    console.log('   - Renommer agents/chef.yaml en agents/chef.yaml.bak');
    console.log('   - Redémarrer le worker');
    console.log('   - Le worker chargera uniquement depuis la base de données');
    console.log('');
    console.log('3. 🔧 Vérifier la priorité de chargement dans le code');
    console.log('');
    console.log('4. 📝 Modifier le fichier YAML pour correspondre à la DB:');
    console.log('   - Le fichier agents/chef.yaml a déjà le bon modèle');
    console.log('   - Mais le worker semble ignorer la base de données');
    
    console.log('\n🔍 Vérification actuelle:');
    const response = await makeRequest(`${WORKER_URL}/api/agents`);
    if (response.status === 200) {
      const agents = response.data.data;
      const chefAgent = agents.find(agent => agent.name === 'Chef');
      if (chefAgent) {
        console.log(`   Modèle actuel en mémoire: ${chefAgent.model}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

forceReload();
