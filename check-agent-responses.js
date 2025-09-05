/**
 * Script pour vérifier les réponses des agents
 * Ce script récupère les jobs récents et affiche les réponses
 */

const http = require('http');

console.log('🔍 Vérification des réponses des agents');
console.log('=====================================');

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

// Fonction pour vérifier les jobs récents
async function checkRecentJobs() {
  console.log('\n📋 Vérification des jobs récents...');
  try {
    const response = await makeRequest(`${WORKER_URL}/api/jobs/stats`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ Stats des jobs récupérées');
      console.log('   Jobs en cours:', response.data.data?.active || 0);
      console.log('   Jobs terminés:', response.data.data?.completed || 0);
      console.log('   Jobs échoués:', response.data.data?.failed || 0);
      
      // Afficher les détails si disponibles
      if (response.data.data?.recent) {
        console.log('\n📝 Jobs récents:');
        response.data.data.recent.forEach((job, index) => {
          console.log(`   ${index + 1}. Job ${job.id}: ${job.status}`);
          if (job.result) {
            console.log(`      Résultat: ${JSON.stringify(job.result, null, 2)}`);
          }
        });
      }
    } else {
      console.log('❌ Erreur lors de la récupération des stats des jobs');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }
}

// Fonction pour tester un job spécifique
async function testSpecificJob(jobId) {
  console.log(`\n🔍 Vérification du job ${jobId}...`);
  try {
    // La route est /api/jobs/:type/:id, on essaie avec le type agent_execution
    const response = await makeRequest(`${WORKER_URL}/api/jobs/agent_execution/${jobId}`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ Job trouvé');
      console.log('   Status:', response.data.job?.status);
      console.log('   Type:', response.data.job?.type);
      console.log('   Créé:', response.data.job?.createdAt);
      console.log('   Résultat:', JSON.stringify(response.data.job?.result, null, 2));
    } else {
      console.log('❌ Job non trouvé ou erreur');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }
}

// Fonction pour envoyer un message de test et suivre la réponse
async function testMessageWithFollowUp() {
  console.log('\n🧪 Test de message avec suivi...');
  
  const testMessage = "Salut ! Comment ça va ?";
  console.log(`   Message: "${testMessage}"`);
  
  try {
    // Envoyer le message
    const response = await makeRequest(`${WORKER_URL}/api/agents/execute`, {
      method: 'POST',
      body: {
        agentId: 'cmf4lmgiv000812hdq3j70amw', // ID de l'agent Assistant
        message: testMessage,
        sessionId: `test-followup-${Date.now()}`,
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
      
      // Attendre un peu puis vérifier le job
      console.log('   Attente de 3 secondes...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await testSpecificJob(jobId);
    } else {
      console.log('❌ Erreur lors de l\'envoi du message');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
  }
}

// Fonction principale
async function runChecks() {
  console.log('🚀 Démarrage des vérifications...\n');
  
  await checkRecentJobs();
  await testMessageWithFollowUp();
  
  console.log('\n📊 Résumé des vérifications:');
  console.log('============================');
  console.log('✅ Vérification des jobs terminée');
  console.log('✅ Test de message avec suivi terminé');
  
  console.log('\n💡 Pour voir les réponses complètes:');
  console.log('1. Vérifiez les logs du worker dans le terminal');
  console.log('2. Consultez les fichiers de logs dans apps/worker/logs/');
  console.log('3. Utilisez ce script régulièrement pour suivre les jobs');
  
  console.log('\n✨ Vérifications terminées !');
}

// Exécuter les vérifications
runChecks().catch(error => {
  console.error('❌ Erreur lors des vérifications:', error);
  process.exit(1);
});
