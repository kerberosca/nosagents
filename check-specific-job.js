/**
 * Vérification du job spécifique
 */

const http = require('http');

console.log('🔍 Vérification du job spécifique...');

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

async function checkSpecificJob() {
  try {
    // Le job ID du dernier test
    const jobId = '3e034e1f-73d2-4590-883e-efbd3428ee0b';
    
    console.log(`🔍 Vérification du job: ${jobId}`);
    
    const response = await makeRequest(`${WORKER_URL}/api/jobs/agent_execution/${jobId}`);
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      const job = response.data.job;
      console.log('✅ Job trouvé !');
      console.log(`   ID: ${job.id}`);
      console.log(`   Statut: ${job.status}`);
      console.log(`   Créé: ${job.createdOn}`);
      console.log(`   Terminé: ${job.finishedOn || 'En cours'}`);
      
      if (job.status === 'completed') {
        console.log('🎉 Job terminé avec succès !');
        console.log('   Réponse de l\'agent:');
        console.log('   ' + '='.repeat(50));
        console.log('   ' + JSON.stringify(job.result, null, 2).replace(/\n/g, '\n   '));
        console.log('   ' + '='.repeat(50));
      } else if (job.status === 'failed') {
        console.log('❌ Job échoué');
        console.log('   Raison:', job.failedReason);
      } else if (job.status === 'processing') {
        console.log('⏳ Job en cours de traitement...');
      } else {
        console.log(`⚠️  Statut inattendu: ${job.status}`);
      }
    } else {
      console.log('❌ Job non trouvé ou erreur');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkSpecificJob();
