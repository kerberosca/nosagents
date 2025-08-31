/**
 * Test simplifié pour valider l'infrastructure de base
 */

const TestHelpers = require('./utils/test-helpers');
const testConfig = require('./config/test-config');
const { execSync } = require('child_process');

class SimpleTest {
  constructor() {
    this.helpers = new TestHelpers(testConfig);
    this.config = testConfig;
  }

  async run() {
    console.log('🚀 Test simplifié de l\'infrastructure Elavira Agents');
    console.log('==================================================');

    try {
      // 1. Vérifier les prérequis
      await this.checkPrerequisites();

      // 2. Démarrer PostgreSQL
      await this.startPostgreSQL();

      // 3. Démarrer Redis
      await this.startRedis();

      // 4. Vérifier Ollama
      await this.checkOllama();

      // 5. Tests de connectivité
      await this.testConnectivity();

      console.log('\n✅ Tous les tests de base sont passés !');
      console.log('🎉 L\'infrastructure est prête pour les tests complets.');

    } catch (error) {
      console.error('\n❌ Erreur lors des tests:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async checkPrerequisites() {
    console.log('\n📋 Vérification des prérequis...');
    
    // Node.js
    const nodeVersion = process.version;
    console.log(`✅ Node.js: ${nodeVersion}`);

    // pnpm
    try {
      const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ pnpm: ${pnpmVersion}`);
    } catch (error) {
      throw new Error('pnpm non trouvé');
    }

    // Docker
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Docker: ${dockerVersion}`);
    } catch (error) {
      throw new Error('Docker non trouvé');
    }
  }

  async startPostgreSQL() {
    console.log('\n🐘 Démarrage de PostgreSQL...');
    
    try {
      // Nettoyer les conteneurs existants
      try {
        execSync('docker rm -f elavira-postgres-test', { stdio: 'ignore' });
      } catch (error) {
        // Ignore si le conteneur n'existe pas
      }

      // Démarrer PostgreSQL
      execSync(`docker run -d --name elavira-postgres-test \
        -e POSTGRES_DB=${this.config.services.database.database} \
        -e POSTGRES_USER=${this.config.services.database.username} \
        -e POSTGRES_PASSWORD=${this.config.services.database.password} \
        -p ${this.config.services.database.port}:5432 \
        postgres:15`, { stdio: 'inherit' });

      // Attendre que PostgreSQL soit prêt
      await this.helpers.retry(async () => {
        const result = await this.helpers.testPostgresConnectivity();
        if (!result.success) {
          throw new Error('PostgreSQL not ready');
        }
        return result;
      }, 10, 2000);

      console.log('✅ PostgreSQL démarré avec succès');

    } catch (error) {
      throw new Error(`Erreur lors du démarrage de PostgreSQL: ${error.message}`);
    }
  }

  async startRedis() {
    console.log('\n🔴 Démarrage de Redis...');
    
    try {
      // Nettoyer les conteneurs existants
      try {
        execSync('docker rm -f elavira-redis-test', { stdio: 'ignore' });
      } catch (error) {
        // Ignore si le conteneur n'existe pas
      }

      // Démarrer Redis
      execSync(`docker run -d --name elavira-redis-test \
        -p ${this.config.services.redis.port}:6379 \
        redis:7-alpine`, { stdio: 'inherit' });

      // Attendre que Redis soit prêt
      await this.helpers.retry(async () => {
        const result = await this.helpers.testRedisConnectivity();
        if (!result.success) {
          throw new Error('Redis not ready');
        }
        return result;
      }, 10, 1000);

      console.log('✅ Redis démarré avec succès');

    } catch (error) {
      throw new Error(`Erreur lors du démarrage de Redis: ${error.message}`);
    }
  }

  async checkOllama() {
    console.log('\n🤖 Vérification d\'Ollama...');
    
    try {
      const connectivity = await this.helpers.testOllamaConnectivity();
      if (connectivity.success) {
        console.log(`✅ Ollama connecté, modèles disponibles: ${connectivity.models.length}`);
        
        if (connectivity.models.length > 0) {
          console.log(`📋 Modèles: ${connectivity.models.join(', ')}`);
        }
      } else {
        console.log('⚠️ Ollama non disponible, mais les tests peuvent continuer');
      }

    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification d\'Ollama:', error.message);
    }
  }

  async testConnectivity() {
    console.log('\n🔗 Tests de connectivité...');
    
    // Test PostgreSQL
    const postgresResult = await this.helpers.testPostgresConnectivity();
    console.log(`✅ PostgreSQL: ${postgresResult.success ? 'Connecté' : 'Erreur'}`);

    // Test Redis
    const redisResult = await this.helpers.testRedisConnectivity();
    console.log(`✅ Redis: ${redisResult.success ? 'Connecté' : 'Erreur'}`);

    // Test Ollama
    const ollamaResult = await this.helpers.testOllamaConnectivity();
    console.log(`✅ Ollama: ${ollamaResult.success ? 'Connecté' : 'Non disponible'}`);

    if (!postgresResult.success || !redisResult.success) {
      throw new Error('Services critiques non disponibles');
    }
  }

  async cleanup() {
    console.log('\n🧹 Nettoyage...');
    
    try {
      execSync('docker rm -f elavira-postgres-test elavira-redis-test', { stdio: 'ignore' });
      console.log('✅ Conteneurs nettoyés');
    } catch (error) {
      console.log('⚠️ Erreur lors du nettoyage:', error.message);
    }
  }
}

// Exécuter le test
async function main() {
  const test = new SimpleTest();
  await test.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleTest;
