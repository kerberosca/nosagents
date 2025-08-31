/**
 * Configuration de l'environnement de test
 */

const TestHelpers = require('../../utils/test-helpers');
const testConfig = require('../../config/test-config');

class TestEnvironment {
  constructor() {
    this.helpers = new TestHelpers(testConfig);
    this.services = {
      web: null,
      worker: null,
      database: null,
      redis: null,
      ollama: null
    };
  }

  /**
   * Initialiser l'environnement de test complet
   */
  async initialize() {
    this.helpers.log('🚀 Initialisation de l\'environnement de test...', 'INFO');

    try {
      // 1. Vérifier les prérequis
      await this.checkPrerequisites();

      // 2. Initialiser les services
      await this.initializeServices();

      // 3. Configurer la base de données de test
      await this.setupTestDatabase();

      // 4. Vérifier la connectivité
      await this.verifyConnectivity();

      // 5. Préparer les données de test
      await this.prepareTestData();

      this.helpers.log('✅ Environnement de test initialisé avec succès', 'INFO');
      return { success: true };

    } catch (error) {
      this.helpers.log(`❌ Erreur lors de l'initialisation: ${error.message}`, 'ERROR');
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Vérifier les prérequis
   */
  async checkPrerequisites() {
    this.helpers.log('📋 Vérification des prérequis...', 'INFO');

    const checks = [
      { name: 'Node.js', check: () => process.version },
      { name: 'npm/pnpm', check: () => require('child_process').execSync('pnpm --version').toString().trim() },
      { name: 'Docker', check: () => require('child_process').execSync('docker --version').toString().trim() }
    ];

    for (const check of checks) {
      try {
        const result = check.check();
        this.helpers.log(`✅ ${check.name}: ${result}`, 'INFO');
      } catch (error) {
        throw new Error(`Prérequis manquant: ${check.name}`);
      }
    }
  }

  /**
   * Initialiser les services
   */
  async initializeServices() {
    this.helpers.log('🔧 Initialisation des services...', 'INFO');

    // Démarrer PostgreSQL via Docker
    await this.startPostgreSQL();

    // Démarrer Redis via Docker
    await this.startRedis();

    // Vérifier Ollama
    await this.checkOllama();

    // Démarrer les services applicatifs
    await this.startApplicationServices();
  }

  /**
   * Démarrer PostgreSQL
   */
  async startPostgreSQL() {
    this.helpers.log('🐘 Démarrage de PostgreSQL...', 'INFO');

    try {
      // Vérifier si PostgreSQL est déjà en cours d'exécution
      const connectivity = await this.helpers.testPostgresConnectivity();
      if (connectivity.success) {
        this.helpers.log('✅ PostgreSQL déjà en cours d\'exécution', 'INFO');
        return;
      }

      // Démarrer PostgreSQL via Docker
      const { execSync } = require('child_process');
      execSync(`docker run -d --name elavira-postgres-test \
        -e POSTGRES_DB=${testConfig.services.database.database} \
        -e POSTGRES_USER=${testConfig.services.database.username} \
        -e POSTGRES_PASSWORD=${testConfig.services.database.password} \
        -p ${testConfig.services.database.port}:5432 \
        postgres:15`, { stdio: 'inherit' });

      // Attendre que PostgreSQL soit prêt
      await this.helpers.retry(async () => {
        const result = await this.helpers.testPostgresConnectivity();
        if (!result.success) {
          throw new Error('PostgreSQL not ready');
        }
        return result;
      }, 10, 2000);

      this.helpers.log('✅ PostgreSQL démarré avec succès', 'INFO');

    } catch (error) {
      throw new Error(`Erreur lors du démarrage de PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Démarrer Redis
   */
  async startRedis() {
    this.helpers.log('🔴 Démarrage de Redis...', 'INFO');

    try {
      // Vérifier si Redis est déjà en cours d'exécution
      const connectivity = await this.helpers.testRedisConnectivity();
      if (connectivity.success) {
        this.helpers.log('✅ Redis déjà en cours d\'exécution', 'INFO');
        return;
      }

      // Démarrer Redis via Docker
      const { execSync } = require('child_process');
      execSync(`docker run -d --name elavira-redis-test \
        -p ${testConfig.services.redis.port}:6379 \
        redis:7-alpine`, { stdio: 'inherit' });

      // Attendre que Redis soit prêt
      await this.helpers.retry(async () => {
        const result = await this.helpers.testRedisConnectivity();
        if (!result.success) {
          throw new Error('Redis not ready');
        }
        return result;
      }, 10, 1000);

      this.helpers.log('✅ Redis démarré avec succès', 'INFO');

    } catch (error) {
      throw new Error(`Erreur lors du démarrage de Redis: ${error.message}`);
    }
  }

  /**
   * Vérifier Ollama
   */
  async checkOllama() {
    this.helpers.log('🤖 Vérification d\'Ollama...', 'INFO');

    try {
      const connectivity = await this.helpers.testOllamaConnectivity();
      if (connectivity.success) {
        this.helpers.log(`✅ Ollama connecté, modèles disponibles: ${connectivity.models.length}`, 'INFO');
        
        // Vérifier que le modèle requis est disponible
        const hasRequiredModel = connectivity.models.some(model => 
          model.name === testConfig.services.ollama.model
        );
        
        if (!hasRequiredModel) {
          this.helpers.log(`⚠️ Modèle ${testConfig.services.ollama.model} non trouvé, utilisation du premier modèle disponible`, 'WARN');
        }
      } else {
        this.helpers.log('⚠️ Ollama non disponible, les tests utilisant l\'IA seront simulés', 'WARN');
      }
    } catch (error) {
      this.helpers.log(`⚠️ Erreur lors de la vérification d'Ollama: ${error.message}`, 'WARN');
    }
  }

  /**
   * Démarrer les services applicatifs
   */
  async startApplicationServices() {
    this.helpers.log('🚀 Démarrage des services applicatifs...', 'INFO');

    try {
      // Démarrer le worker
      await this.startWorker();

      // Démarrer le web
      await this.startWeb();

      this.helpers.log('✅ Services applicatifs démarrés', 'INFO');

    } catch (error) {
      throw new Error(`Erreur lors du démarrage des services: ${error.message}`);
    }
  }

  /**
   * Démarrer le service worker
   */
  async startWorker() {
    this.helpers.log('⚙️ Démarrage du service worker...', 'INFO');

    try {
      const { spawn } = require('child_process');
      
      // Démarrer le worker en arrière-plan
      this.services.worker = spawn('npx', ['tsx', 'apps/worker/src/index.ts'], {
        cwd: process.cwd(),
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: testConfig.services.worker.port,
          DATABASE_URL: `postgresql://${testConfig.services.database.username}:${testConfig.services.database.password}@${testConfig.services.database.host}:${testConfig.services.database.port}/${testConfig.services.database.database}`,
          REDIS_URL: `redis://${testConfig.services.redis.host}:${testConfig.services.redis.port}`,
          OLLAMA_BASE_URL: testConfig.services.ollama.baseUrl
        }
      });

      // Attendre que le worker soit prêt
      await this.helpers.retry(async () => {
        const result = await this.helpers.testHttpConnectivity(
          `${testConfig.services.worker.baseUrl}/health`
        );
        if (!result.success) {
          throw new Error('Worker not ready');
        }
        return result;
      }, 15, 2000);

      this.helpers.log('✅ Service worker démarré', 'INFO');

    } catch (error) {
      throw new Error(`Erreur lors du démarrage du worker: ${error.message}`);
    }
  }

  /**
   * Démarrer le service web
   */
  async startWeb() {
    this.helpers.log('🌐 Démarrage du service web...', 'INFO');

    try {
      const { spawn } = require('child_process');
      
      // Démarrer le web en arrière-plan
      this.services.web = spawn('npx', ['next', 'dev', '-p', testConfig.services.web.port.toString()], {
        cwd: process.cwd(),
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: testConfig.services.web.port,
          NEXT_PUBLIC_API_URL: testConfig.services.worker.baseUrl
        }
      });

      // Attendre que le web soit prêt
      await this.helpers.retry(async () => {
        const result = await this.helpers.testHttpConnectivity(
          testConfig.services.web.baseUrl
        );
        if (!result.success) {
          throw new Error('Web not ready');
        }
        return result;
      }, 15, 2000);

      this.helpers.log('✅ Service web démarré', 'INFO');

    } catch (error) {
      throw new Error(`Erreur lors du démarrage du web: ${error.message}`);
    }
  }

  /**
   * Configurer la base de données de test
   */
  async setupTestDatabase() {
    this.helpers.log('🗄️ Configuration de la base de données de test...', 'INFO');

    try {
      // Exécuter les migrations Prisma
      const { execSync } = require('child_process');
      execSync('pnpm prisma migrate deploy', {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://${testConfig.services.database.username}:${testConfig.services.database.password}@${testConfig.services.database.host}:${testConfig.services.database.port}/${testConfig.services.database.database}`
        }
      });

      this.helpers.log('✅ Base de données configurée', 'INFO');

    } catch (error) {
      throw new Error(`Erreur lors de la configuration de la base de données: ${error.message}`);
    }
  }

  /**
   * Vérifier la connectivité
   */
  async verifyConnectivity() {
    this.helpers.log('🔍 Vérification de la connectivité...', 'INFO');

    const checks = [
      { name: 'PostgreSQL', check: () => this.helpers.testPostgresConnectivity() },
      { name: 'Redis', check: () => this.helpers.testRedisConnectivity() },
      { name: 'Worker API', check: () => this.helpers.testHttpConnectivity(`${testConfig.services.worker.baseUrl}/health`) },
      { name: 'Web UI', check: () => this.helpers.testHttpConnectivity(testConfig.services.web.baseUrl) }
    ];

    for (const check of checks) {
      const result = await check.check();
      if (result.success) {
        this.helpers.log(`✅ ${check.name}: Connecté`, 'INFO');
      } else {
        this.helpers.log(`❌ ${check.name}: ${result.error}`, 'ERROR');
        throw new Error(`Échec de la connectivité: ${check.name}`);
      }
    }
  }

  /**
   * Préparer les données de test
   */
  async prepareTestData() {
    this.helpers.log('📊 Préparation des données de test...', 'INFO');

    try {
      // Créer des agents de test
      const testAgents = this.helpers.generateTestData('agent', testConfig.testData.agents.count);
      
      // Créer des documents de test
      const testDocuments = this.helpers.generateTestData('document', testConfig.testData.documents.count);

      // Sauvegarder les données de test
      this.testData = {
        agents: testAgents,
        documents: testDocuments
      };

      this.helpers.log(`✅ Données de test préparées: ${testConfig.testData.agents.count} agents, ${testConfig.testData.documents.count} documents`, 'INFO');

    } catch (error) {
      throw new Error(`Erreur lors de la préparation des données: ${error.message}`);
    }
  }

  /**
   * Nettoyer l'environnement
   */
  async cleanup() {
    this.helpers.log('🧹 Nettoyage de l\'environnement...', 'INFO');

    try {
      // Arrêter les services applicatifs
      if (this.services.worker) {
        this.services.worker.kill('SIGTERM');
      }
      if (this.services.web) {
        this.services.web.kill('SIGTERM');
      }

      // Attendre que les services s'arrêtent
      await this.helpers.wait(2000);

      // Arrêter les conteneurs Docker
      const { execSync } = require('child_process');
      try {
        execSync('docker stop elavira-postgres-test elavira-redis-test', { stdio: 'ignore' });
        execSync('docker rm elavira-postgres-test elavira-redis-test', { stdio: 'ignore' });
      } catch (error) {
        // Ignorer les erreurs si les conteneurs n'existent pas
      }

      // Nettoyer les données de test
      await this.helpers.cleanup();

      this.helpers.log('✅ Environnement nettoyé', 'INFO');

    } catch (error) {
      this.helpers.log(`⚠️ Erreur lors du nettoyage: ${error.message}`, 'WARN');
    }
  }

  /**
   * Obtenir les données de test
   */
  getTestData() {
    return this.testData;
  }

  /**
   * Obtenir la configuration
   */
  getConfig() {
    return testConfig;
  }
}

module.exports = TestEnvironment;
