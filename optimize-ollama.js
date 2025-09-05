/**
 * Script pour optimiser Ollama pour CPU
 */

const http = require('http');

console.log('🔧 Optimisation d\'Ollama pour CPU...');

// Configuration
const OLLAMA_URL = 'http://localhost:11434';

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

async function testOptimizedModel() {
  try {
    console.log('🧪 Test du modèle optimisé qwen2.5:3b...');
    
    const response = await makeRequest(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      body: {
        model: 'qwen2.5:3b',
        prompt: 'Bonjour, peux-tu me donner une recette simple ?',
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 100, // Limite à 100 tokens pour le test
          num_thread: 4,    // Optimisation CPU
          num_ctx: 512      // Contexte réduit
        }
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Test réussi !');
      console.log('   Réponse:', response.data.response);
      console.log('   Temps de génération:', response.data.total_duration / 1000000000, 'secondes');
    } else {
      console.log('❌ Erreur lors du test');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testOptimizedModel();
