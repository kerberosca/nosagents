/**
 * Script de débogage pour tester l'exécution d'un agent
 */

const http = require('http');

console.log('🔍 Débogage de l\'exécution d\'agent');
console.log('===================================');

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

// Test 1: Vérifier la santé du worker
async function testWorkerHealth() {
  console.log('\n1. Vérification de la santé du worker...');
  try {
    const response = await makeRequest(`${WORKER_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Worker est en bonne santé');
      console.log('   Services:', JSON.stringify(response.data.services, null, 2));
    } else {
      console.log('❌ Worker ne répond pas correctement');
    }
  } catch (error) {
    console.log('❌ Erreur de connexion au worker:', error.message);
  }
}

// Test 2: Tester Ollama directement
async function testOllamaDirect() {
  console.log('\n2. Test direct d\'Ollama...');
  try {
    const response = await makeRequest('http://localhost:11434/api/generate', {
      method: 'POST',
      body: {
        model: 'qwen2.5:7b',
        prompt: 'Bonjour, comment allez-vous ?',
        stream: false
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Ollama répond correctement');
      console.log('   Réponse:', response.data.response);
    } else {
      console.log('❌ Ollama ne répond pas correctement');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion à Ollama:', error.message);
  }
}

// Test 3: Envoyer un message simple et attendre plus longtemps
async function testSimpleMessage() {
  console.log('\n3. Test d\'envoi de message simple...');
  
  const testMessage = "Salut !";
  console.log(`   Message: "${testMessage}"`);
  
  try {
    // Envoyer le message
    const response = await makeRequest(`${WORKER_URL}/api/agents/execute`, {
      method: 'POST',
      body: {
        agentId: 'cmf4lmgiv000812hdq3j70amw', // ID de l'agent Assistant
        message: testMessage,
        sessionId: `debug-test-${Date.now()}`,
        context: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }
    });

    if (response.status === 202) {
      const jobId = response.data.jobId;
      console.log('✅ Message envoyé avec succès');
      console.log(`   Job ID: ${jobId}`);
      
      // Attendre plus longtemps et vérifier plusieurs fois
      console.log('   Attente du traitement (jusqu\'à 30 secondes)...');
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const jobResponse = await makeRequest(`${WORKER_URL}/api/jobs/agent_execution/${jobId}`);
          if (jobResponse.status === 200 && jobResponse.data.success) {
            const job = jobResponse.data.job;
            console.log(`   État du job (${i + 1}s): ${job.status}`);
            
            if (job.status === 'completed') {
              console.log('✅ Job terminé avec succès !');
              console.log('   Réponse de l\'agent:', JSON.stringify(job.result, null, 2));
              return true;
            } else if (job.status === 'failed') {
              console.log('❌ Job échoué');
              console.log('   Raison:', job.failedReason);
              return false;
            }
          }
        } catch (error) {
          console.log(`   Erreur lors de la vérification (${i + 1}s):`, error.message);
        }
      }
      
      console.log('⚠️  Timeout - Le job n\'a pas été traité dans les 30 secondes');
      return false;
    } else {
      console.log('❌ Erreur lors de l\'envoi du message');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
    return false;
  }
}

// Fonction principale
async function runDebug() {
  console.log('🚀 Démarrage du débogage...\n');
  
  await testWorkerHealth();
  await testOllamaDirect();
  const success = await testSimpleMessage();
  
  console.log('\n📊 Résumé du débogage:');
  console.log('======================');
  console.log(`✅ Test de message: ${success ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
  
  if (success) {
    console.log('\n🎉 Le système fonctionne !');
  } else {
    console.log('\n⚠️  Le système a encore des problèmes.');
    console.log('💡 Vérifiez les logs du worker pour plus de détails.');
  }
  
  console.log('\n✨ Débogage terminé !');
}

// Exécuter le débogage
runDebug().catch(error => {
  console.error('❌ Erreur lors du débogage:', error);
  process.exit(1);
});
