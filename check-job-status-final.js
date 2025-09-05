/**
 * Vérification du statut final du job
 */

const http = require('http');

const jobId = 'a65ae225-d6de-48e6-9c85-9ee202ecf46b';

function checkJobStatus() {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3001/api/jobs/agent_execution/${jobId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🔍 Vérification du statut du job...');
  console.log(`Job ID: ${jobId}`);
  
  try {
    const result = await checkJobStatus();
    console.log(`Status HTTP: ${result.status}`);
    
    if (result.status === 200 && result.data.success) {
      const job = result.data.job;
      console.log(`Statut du job: ${job.status}`);
      
      if (job.status === 'completed') {
        console.log('✅ Job terminé avec succès !');
        console.log('Résultat:', JSON.stringify(job.result, null, 2));
      } else if (job.status === 'failed') {
        console.log(`❌ Job échoué: ${job.failedReason}`);
      } else {
        console.log('⏳ Job en cours...');
      }
    } else {
      console.log('❌ Erreur:', result.data);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

main();


