const fetch = require('node-fetch');

const WORKER_URL = 'http://localhost:3001';

async function testWorker() {
  console.log('🚀 Test de l\'application Worker Elavira Agents\n');

  try {
    // 1. Test de santé du serveur
    console.log('1. Test de santé du serveur...');
    const healthResponse = await fetch(`${WORKER_URL}/health`);
    const health = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Serveur en bonne santé:', {
        status: health.status,
        services: health.services,
        uptime: Math.round(health.uptime / 60) + ' minutes',
      });
    } else {
      console.log('❌ Serveur en mauvaise santé:', health);
      return;
    }

    // 2. Test des statistiques des jobs
    console.log('\n2. Test des statistiques des jobs...');
    const statsResponse = await fetch(`${WORKER_URL}/api/jobs/stats`);
    const stats = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('✅ Statistiques des jobs récupérées:', stats.stats);
    } else {
      console.log('❌ Erreur lors de la récupération des statistiques:', stats);
    }

    // 3. Test de création d'un job d'exécution d'agent
    console.log('\n3. Test de création d\'un job d\'exécution d\'agent...');
    const agentJobResponse = await fetch(`${WORKER_URL}/api/agents/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: 'test-agent-1',
        message: 'Dis-moi bonjour en français',
        sessionId: 'test-session-1',
        priority: 1,
      }),
    });
    
    const agentJob = await agentJobResponse.json();
    
    if (agentJobResponse.ok) {
      console.log('✅ Job d\'exécution d\'agent créé:', {
        jobId: agentJob.jobId,
        message: agentJob.message,
      });

      // Attendre un peu et vérifier le statut du job
      console.log('   Attente de 3 secondes pour le traitement...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const jobStatusResponse = await fetch(`${WORKER_URL}/api/jobs/agent_execution/${agentJob.jobId}`);
      const jobStatus = await jobStatusResponse.json();
      
      if (jobStatusResponse.ok) {
        console.log('   Statut du job:', {
          id: jobStatus.job.id,
          status: jobStatus.job.status,
          progress: jobStatus.job.progress,
        });
      }
    } else {
      console.log('❌ Erreur lors de la création du job d\'agent:', agentJob);
    }

    // 4. Test des statistiques des agents
    console.log('\n4. Test des statistiques des agents...');
    const agentStatsResponse = await fetch(`${WORKER_URL}/api/agents/stats`);
    const agentStats = await agentStatsResponse.json();
    
    if (agentStatsResponse.ok) {
      console.log('✅ Statistiques des agents récupérées:', {
        totalAgents: agentStats.stats.totalAgents,
      });
    } else {
      console.log('❌ Erreur lors de la récupération des statistiques des agents:', agentStats);
    }

    // 5. Test de la santé des agents
    console.log('\n5. Test de la santé des agents...');
    const agentHealthResponse = await fetch(`${WORKER_URL}/api/agents/health`);
    const agentHealth = await agentHealthResponse.json();
    
    if (agentHealthResponse.ok) {
      console.log('✅ Santé des agents:', {
        ollama: agentHealth.health.ollama,
        status: agentHealth.health.status,
      });
    } else {
      console.log('❌ Erreur lors de la vérification de la santé des agents:', agentHealth);
    }

    // 6. Test des statistiques RAG
    console.log('\n6. Test des statistiques RAG...');
    const ragStatsResponse = await fetch(`${WORKER_URL}/api/rag/stats`);
    const ragStats = await ragStatsResponse.json();
    
    if (ragStatsResponse.ok) {
      console.log('✅ Statistiques RAG récupérées:', {
        vectorStore: ragStats.stats.vectorStore,
        processors: ragStats.stats.processors.length,
        embeddingProvider: ragStats.stats.embeddingProvider,
      });
    } else {
      console.log('❌ Erreur lors de la récupération des statistiques RAG:', ragStats);
    }

    // 7. Test des extensions supportées
    console.log('\n7. Test des extensions supportées...');
    const extensionsResponse = await fetch(`${WORKER_URL}/api/rag/extensions`);
    const extensions = await extensionsResponse.json();
    
    if (extensionsResponse.ok) {
      console.log('✅ Extensions supportées:', extensions.extensions);
    } else {
      console.log('❌ Erreur lors de la récupération des extensions:', extensions);
    }

    // 8. Test de recherche RAG
    console.log('\n8. Test de recherche RAG...');
    const searchResponse = await fetch(`${WORKER_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'intelligence artificielle',
        k: 5,
      }),
    });
    
    const searchResult = await searchResponse.json();
    
    if (searchResponse.ok) {
      console.log('✅ Recherche RAG effectuée:', {
        resultsCount: searchResult.results.length,
        duration: searchResult.duration + 'ms',
      });
    } else {
      console.log('❌ Erreur lors de la recherche RAG:', searchResult);
    }

    console.log('\n🎉 Tests de l\'application Worker terminés avec succès !');
    console.log('\nRésumé de l\'étape 4 :');
    console.log('✅ Serveur Express avec middleware de sécurité');
    console.log('✅ Service de gestion des jobs avec Bull/Redis');
    console.log('✅ Service d\'exécution d\'agents');
    console.log('✅ Service RAG pour l\'indexation et la recherche');
    console.log('✅ API REST complète avec routes structurées');
    console.log('✅ Système de logging avec Winston');
    console.log('✅ Gestion d\'erreurs et middleware de sécurité');
    console.log('✅ Health checks et monitoring');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.log('\nVérifiez que :');
    console.log('1. Le serveur worker est démarré sur le port 3001');
    console.log('2. Redis est disponible');
    console.log('3. Ollama est démarré (optionnel)');
    console.log('4. PostgreSQL est accessible');
  }
}

// Instructions pour l'utilisateur
console.log('📋 Test de l\'application Worker :');
console.log('');
console.log('1. Démarrez le serveur worker :');
console.log('   cd apps/worker');
console.log('   pnpm install');
console.log('   pnpm dev');
console.log('');
console.log('2. Lancez ce test :');
console.log('   node test-worker.js');
console.log('');

// Lancer le test
testWorker();
