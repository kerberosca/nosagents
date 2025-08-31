/**
 * Tests d'intégration système
 */

const TestEnvironment = require('../setup/test-environment');
const TestHelpers = require('../../utils/test-helpers');
const testConfig = require('../../config/test-config');

class SystemIntegrationTests {
  constructor() {
    this.environment = new TestEnvironment();
    this.helpers = new TestHelpers(testConfig);
    this.results = [];
  }

  /**
   * Exécuter tous les tests d'intégration système
   */
  async runAllTests() {
    this.helpers.log('🧪 Démarrage des tests d\'intégration système...', 'INFO');

    try {
      // Initialiser l'environnement
      await this.environment.initialize();

      // Exécuter les tests
      await this.testSystemInitialization();
      await this.testServiceConnectivity();
      await this.testDatabaseOperations();
      await this.testRedisOperations();
      await this.testOllamaIntegration();
      await this.testApiEndpoints();
      await this.testErrorHandling();

      // Générer le rapport
      const report = this.generateReport();
      this.helpers.log('✅ Tests d\'intégration système terminés', 'INFO');
      
      return report;

    } catch (error) {
      this.helpers.log(`❌ Erreur lors des tests: ${error.message}`, 'ERROR');
      throw error;
    } finally {
      await this.environment.cleanup();
    }
  }

  /**
   * Test d'initialisation du système
   */
  async testSystemInitialization() {
    this.helpers.log('🔧 Test d\'initialisation du système...', 'INFO');

    const tests = [
      {
        name: 'Vérification des prérequis',
        test: async () => {
          const checks = [
            { name: 'Node.js', check: () => process.version },
            { name: 'pnpm', check: () => require('child_process').execSync('pnpm --version').toString().trim() },
            { name: 'Docker', check: () => require('child_process').execSync('docker --version').toString().trim() }
          ];

          for (const check of checks) {
            const result = check.check();
            if (!result) {
              throw new Error(`Prérequis manquant: ${check.name}`);
            }
          }
          return { success: true, details: 'Tous les prérequis sont satisfaits' };
        }
      },
      {
        name: 'Initialisation de l\'environnement',
        test: async () => {
          const result = await this.environment.initialize();
          return { success: result.success, details: 'Environnement initialisé avec succès' };
        }
      },
      {
        name: 'Configuration de la base de données',
        test: async () => {
          const connectivity = await this.helpers.testPostgresConnectivity();
          return { 
            success: connectivity.success, 
            details: connectivity.success ? 'Base de données configurée' : connectivity.error 
          };
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordResult(test.name, result);
        this.helpers.log(`✅ ${test.name}: ${result.details}`, 'INFO');
      } catch (error) {
        const result = { success: false, error: error.message };
        this.recordResult(test.name, result);
        this.helpers.log(`❌ ${test.name}: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test de connectivité des services
   */
  async testServiceConnectivity() {
    this.helpers.log('🔗 Test de connectivité des services...', 'INFO');

    const services = [
      {
        name: 'PostgreSQL',
        test: () => this.helpers.testPostgresConnectivity(),
        expected: { success: true }
      },
      {
        name: 'Redis',
        test: () => this.helpers.testRedisConnectivity(),
        expected: { success: true }
      },
      {
        name: 'Worker API',
        test: () => this.helpers.testHttpConnectivity(`${testConfig.services.worker.baseUrl}/health`),
        expected: { success: true, status: 200 }
      },
      {
        name: 'Web UI',
        test: () => this.helpers.testHttpConnectivity(testConfig.services.web.baseUrl),
        expected: { success: true, status: 200 }
      },
      {
        name: 'Ollama',
        test: () => this.helpers.testOllamaConnectivity(),
        expected: { success: true }
      }
    ];

    for (const service of services) {
      try {
        const result = await service.test();
        const isValid = this.validateServiceResult(result, service.expected);
        
        this.recordResult(`Connectivité ${service.name}`, {
          success: isValid,
          details: isValid ? 'Service connecté' : `Échec de connexion: ${result.error || 'Statut inattendu'}`,
          responseTime: result.responseTime || result.duration
        });

        if (isValid) {
          this.helpers.log(`✅ ${service.name}: Connecté`, 'INFO');
        } else {
          this.helpers.log(`❌ ${service.name}: Échec de connexion`, 'ERROR');
        }
      } catch (error) {
        this.recordResult(`Connectivité ${service.name}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ ${service.name}: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test des opérations de base de données
   */
  async testDatabaseOperations() {
    this.helpers.log('🗄️ Test des opérations de base de données...', 'INFO');

    const { Client } = require('pg');
    const client = new Client({
      host: testConfig.services.database.host,
      port: testConfig.services.database.port,
      database: testConfig.services.database.database,
      user: testConfig.services.database.username,
      password: testConfig.services.database.password
    });

    try {
      await client.connect();

      const tests = [
        {
          name: 'Connexion à la base de données',
          test: async () => {
            const result = await client.query('SELECT NOW() as current_time');
            return { success: true, currentTime: result.rows[0].current_time };
          }
        },
        {
          name: 'Création de table de test',
          test: async () => {
            await client.query(`
              CREATE TABLE IF NOT EXISTS test_table (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
              )
            `);
            return { success: true };
          }
        },
        {
          name: 'Insertion de données',
          test: async () => {
            const result = await client.query(
              'INSERT INTO test_table (name) VALUES ($1) RETURNING id',
              ['test-data']
            );
            return { success: true, id: result.rows[0].id };
          }
        },
        {
          name: 'Lecture de données',
          test: async () => {
            const result = await client.query('SELECT * FROM test_table WHERE name = $1', ['test-data']);
            return { success: result.rows.length > 0, count: result.rows.length };
          }
        },
        {
          name: 'Mise à jour de données',
          test: async () => {
            const result = await client.query(
              'UPDATE test_table SET name = $1 WHERE name = $2 RETURNING id',
              ['updated-test-data', 'test-data']
            );
            return { success: result.rows.length > 0, updated: result.rows.length };
          }
        },
        {
          name: 'Suppression de données',
          test: async () => {
            const result = await client.query('DELETE FROM test_table WHERE name = $1', ['updated-test-data']);
            return { success: true, deleted: result.rowCount };
          }
        },
        {
          name: 'Nettoyage de la table de test',
          test: async () => {
            await client.query('DROP TABLE IF EXISTS test_table');
            return { success: true };
          }
        }
      ];

      for (const test of tests) {
        try {
          const result = await test.test();
          this.recordResult(`DB: ${test.name}`, {
            success: result.success,
            details: test.name,
            data: result
          });
          this.helpers.log(`✅ ${test.name}: Succès`, 'INFO');
        } catch (error) {
          this.recordResult(`DB: ${test.name}`, {
            success: false,
            error: error.message
          });
          this.helpers.log(`❌ ${test.name}: ${error.message}`, 'ERROR');
        }
      }

    } catch (error) {
      this.helpers.log(`❌ Erreur de base de données: ${error.message}`, 'ERROR');
    } finally {
      await client.end();
    }
  }

  /**
   * Test des opérations Redis
   */
  async testRedisOperations() {
    this.helpers.log('🔴 Test des opérations Redis...', 'INFO');

    const Redis = require('ioredis');
    const redis = new Redis({
      host: testConfig.services.redis.host,
      port: testConfig.services.redis.port
    });

    try {
      const tests = [
        {
          name: 'Connexion Redis',
          test: async () => {
            const result = await redis.ping();
            return { success: result === 'PONG' };
          }
        },
        {
          name: 'Écriture de données',
          test: async () => {
            await redis.set('test:key', 'test:value');
            return { success: true };
          }
        },
        {
          name: 'Lecture de données',
          test: async () => {
            const value = await redis.get('test:key');
            return { success: value === 'test:value', value };
          }
        },
        {
          name: 'Expiration de données',
          test: async () => {
            await redis.setex('test:expire', 1, 'expire:value');
            await this.helpers.wait(1100);
            const value = await redis.get('test:expire');
            return { success: value === null };
          }
        },
        {
          name: 'Suppression de données',
          test: async () => {
            await redis.del('test:key');
            const value = await redis.get('test:key');
            return { success: value === null };
          }
        }
      ];

      for (const test of tests) {
        try {
          const result = await test.test();
          this.recordResult(`Redis: ${test.name}`, {
            success: result.success,
            details: test.name,
            data: result
          });
          this.helpers.log(`✅ ${test.name}: Succès`, 'INFO');
        } catch (error) {
          this.recordResult(`Redis: ${test.name}`, {
            success: false,
            error: error.message
          });
          this.helpers.log(`❌ ${test.name}: ${error.message}`, 'ERROR');
        }
      }

    } catch (error) {
      this.helpers.log(`❌ Erreur Redis: ${error.message}`, 'ERROR');
    } finally {
      await redis.disconnect();
    }
  }

  /**
   * Test d'intégration Ollama
   */
  async testOllamaIntegration() {
    this.helpers.log('🤖 Test d\'intégration Ollama...', 'INFO');

    const tests = [
      {
        name: 'Connexion à Ollama',
        test: async () => {
          return await this.helpers.testOllamaConnectivity();
        }
      },
      {
        name: 'Liste des modèles',
        test: async () => {
          const response = await fetch(`${testConfig.services.ollama.baseUrl}/api/tags`);
          if (response.ok) {
            const data = await response.json();
            return { success: true, models: data.models || [] };
          } else {
            return { success: false, error: `HTTP ${response.status}` };
          }
        }
      },
      {
        name: 'Test de génération (si disponible)',
        test: async () => {
          try {
            const response = await fetch(`${testConfig.services.ollama.baseUrl}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: testConfig.services.ollama.model,
                prompt: 'Hello, this is a test.',
                stream: false
              })
            });

            if (response.ok) {
              const data = await response.json();
              return { success: true, response: data.response };
            } else {
              return { success: false, error: `HTTP ${response.status}` };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordResult(`Ollama: ${test.name}`, {
          success: result.success,
          details: test.name,
          data: result
        });

        if (result.success) {
          this.helpers.log(`✅ ${test.name}: Succès`, 'INFO');
        } else {
          this.helpers.log(`⚠️ ${test.name}: ${result.error}`, 'WARN');
        }
      } catch (error) {
        this.recordResult(`Ollama: ${test.name}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ ${test.name}: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test des endpoints API
   */
  async testApiEndpoints() {
    this.helpers.log('🌐 Test des endpoints API...', 'INFO');

    const endpoints = [
      {
        name: 'Health Check Worker',
        url: `${testConfig.services.worker.baseUrl}/health`,
        method: 'GET',
        expectedStatus: 200
      },
      {
        name: 'Status Worker',
        url: `${testConfig.services.worker.baseUrl}/status`,
        method: 'GET',
        expectedStatus: 200
      },
      {
        name: 'Agents API',
        url: `${testConfig.services.worker.baseUrl}/agents`,
        method: 'GET',
        expectedStatus: 200
      },
      {
        name: 'Tools API',
        url: `${testConfig.services.worker.baseUrl}/tools`,
        method: 'GET',
        expectedStatus: 200
      },
      {
        name: 'RAG API',
        url: `${testConfig.services.worker.baseUrl}/rag/status`,
        method: 'GET',
        expectedStatus: 200
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          timeout: testConfig.services.worker.timeout
        });

        const result = {
          success: response.status === endpoint.expectedStatus,
          status: response.status,
          expectedStatus: endpoint.expectedStatus,
          responseTime: Date.now()
        };

        this.recordResult(`API: ${endpoint.name}`, {
          success: result.success,
          details: `Status: ${response.status}`,
          data: result
        });

        if (result.success) {
          this.helpers.log(`✅ ${endpoint.name}: ${response.status}`, 'INFO');
        } else {
          this.helpers.log(`❌ ${endpoint.name}: ${response.status} (attendu: ${endpoint.expectedStatus})`, 'ERROR');
        }
      } catch (error) {
        this.recordResult(`API: ${endpoint.name}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ ${endpoint.name}: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test de gestion des erreurs
   */
  async testErrorHandling() {
    this.helpers.log('⚠️ Test de gestion des erreurs...', 'INFO');

    const tests = [
      {
        name: 'Endpoint inexistant',
        test: async () => {
          const response = await fetch(`${testConfig.services.worker.baseUrl}/nonexistent`);
          return { success: response.status === 404, status: response.status };
        }
      },
      {
        name: 'Méthode non autorisée',
        test: async () => {
          const response = await fetch(`${testConfig.services.worker.baseUrl}/health`, {
            method: 'POST'
          });
          return { success: response.status === 405, status: response.status };
        }
      },
      {
        name: 'Données invalides',
        test: async () => {
          const response = await fetch(`${testConfig.services.worker.baseUrl}/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invalid: 'data' })
          });
          return { success: response.status === 400, status: response.status };
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordResult(`Error Handling: ${test.name}`, {
          success: result.success,
          details: `Status: ${result.status}`,
          data: result
        });

        if (result.success) {
          this.helpers.log(`✅ ${test.name}: Gestion d'erreur correcte`, 'INFO');
        } else {
          this.helpers.log(`❌ ${test.name}: Gestion d'erreur incorrecte`, 'ERROR');
        }
      } catch (error) {
        this.recordResult(`Error Handling: ${test.name}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ ${test.name}: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Valider le résultat d'un service
   */
  validateServiceResult(result, expected) {
    if (expected.success !== undefined && result.success !== expected.success) {
      return false;
    }
    if (expected.status !== undefined && result.status !== expected.status) {
      return false;
    }
    return true;
  }

  /**
   * Enregistrer un résultat de test
   */
  recordResult(testName, result) {
    this.results.push({
      testName,
      result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Générer le rapport de test
   */
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.result.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: `${successRate.toFixed(2)}%`
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };

    this.helpers.log(`📊 Rapport: ${passedTests}/${totalTests} tests réussis (${successRate.toFixed(2)}%)`, 'INFO');
    
    if (failedTests > 0) {
      this.helpers.log(`❌ ${failedTests} tests ont échoué:`, 'ERROR');
      this.results.filter(r => !r.result.success).forEach(r => {
        this.helpers.log(`  - ${r.testName}: ${r.result.error || 'Échec'}`, 'ERROR');
      });
    }

    return report;
  }
}

module.exports = SystemIntegrationTests;
