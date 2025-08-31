/**
 * Utilitaires pour les tests end-to-end
 */

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const { Client } = require('pg');
const Redis = require('ioredis');

class TestHelpers {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Log avec timestamp
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  /**
   * Attendre un délai
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry avec backoff exponentiel
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        this.log(`Retry ${i + 1}/${maxRetries}: ${error.message}`, 'WARN');
        await this.wait(delay * Math.pow(2, i));
      }
    }
  }

  /**
   * Test de connectivité HTTP
   */
  async testHttpConnectivity(url, timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'HEAD'
      });
      
      clearTimeout(timeoutId);
      return {
        success: true,
        status: response.status,
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test de connectivité PostgreSQL
   */
  async testPostgresConnectivity() {
    const client = new Client({
      host: this.config.services.database.host,
      port: this.config.services.database.port,
      database: this.config.services.database.database,
      user: this.config.services.database.username,
      password: this.config.services.database.password,
      connectionTimeoutMillis: this.config.services.database.timeout
    });

    try {
      await client.connect();
      const result = await client.query('SELECT NOW() as current_time');
      await client.end();
      
      return {
        success: true,
        currentTime: result.rows[0].current_time
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test de connectivité Redis
   */
  async testRedisConnectivity() {
    const redis = new Redis({
      host: this.config.services.redis.host,
      port: this.config.services.redis.port,
      connectTimeout: this.config.services.redis.timeout
    });

    try {
      await redis.ping();
      await redis.disconnect();
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test de connectivité Ollama
   */
  async testOllamaConnectivity() {
    try {
      const response = await fetch(`${this.config.services.ollama.baseUrl}/api/tags`, {
        timeout: this.config.services.ollama.timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          models: data.models || []
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mesurer le temps de réponse
   */
  async measureResponseTime(fn) {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      return {
        success: true,
        result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - start;
      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Créer des données de test
   */
  generateTestData(type, count = 1) {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'agent':
          data.push({
            id: `test-agent-${i}`,
            name: `Test Agent ${i}`,
            description: `Agent de test ${i}`,
            role: this.config.testData.agents.types[i % this.config.testData.agents.types.length],
            model: this.config.services.ollama.model,
            tools: ['rag.search', 'fs.read'],
            permissions: {
              network: false,
              files: true,
              tools: ['rag.search', 'fs.read']
            }
          });
          break;
          
        case 'document':
          data.push({
            id: `test-doc-${i}`,
            name: `Test Document ${i}`,
            content: `Contenu de test ${i}. Ce document contient des informations pour tester le système RAG.`,
            type: this.config.testData.documents.types[i % this.config.testData.documents.types.length],
            size: this.config.testData.documents.sizes[i % this.config.testData.documents.sizes.length]
          });
          break;
          
        case 'conversation':
          data.push({
            id: `test-conv-${i}`,
            messages: [
              {
                id: `msg-${i}-1`,
                content: `Message de test ${i}`,
                sender: 'user',
                timestamp: new Date().toISOString()
              }
            ]
          });
          break;
          
        case 'workflow':
          data.push({
            id: `test-workflow-${i}`,
            name: `Test Workflow ${i}`,
            description: `Workflow de test ${i}`,
            steps: [
              {
                id: `step-${i}-1`,
                agentId: `test-agent-${i}`,
                task: `Tâche de test ${i}`,
                dependencies: []
              }
            ]
          });
          break;
      }
    }
    
    return count === 1 ? data[0] : data;
  }

  /**
   * Valider une réponse API
   */
  validateApiResponse(response, expectedStatus = 200) {
    const validations = {
      status: response.status === expectedStatus,
      hasData: response.data !== undefined,
      hasTimestamp: response.timestamp !== undefined,
      isValidJson: typeof response === 'object'
    };

    return {
      valid: Object.values(validations).every(v => v),
      validations
    };
  }

  /**
   * Valider les performances
   */
  validatePerformance(metrics, thresholds) {
    const validations = {
      responseTime: metrics.responseTime <= thresholds.responseTime,
      memoryUsage: metrics.memoryUsage <= thresholds.memoryUsage,
      cpuUsage: metrics.cpuUsage <= thresholds.cpuUsage
    };

    return {
      valid: Object.values(validations).every(v => v),
      validations,
      metrics
    };
  }

  /**
   * Enregistrer un résultat de test
   */
  recordResult(testName, result) {
    this.results.push({
      testName,
      result,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime
    });
  }

  /**
   * Générer un rapport de test
   */
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.result.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: `${successRate.toFixed(2)}%`
      },
      duration: Date.now() - this.startTime,
      results: this.results
    };
  }

  /**
   * Nettoyer les données de test
   */
  async cleanup() {
    this.log('Nettoyage des données de test...', 'INFO');
    
    // Nettoyage des fichiers temporaires
    if (this.config.cleanup.files) {
      try {
        const tempDir = path.join(__dirname, '../temp');
        await fs.rmdir(tempDir, { recursive: true });
      } catch (error) {
        this.log(`Erreur lors du nettoyage des fichiers: ${error.message}`, 'WARN');
      }
    }

    // Nettoyage des logs
    if (this.config.cleanup.logs) {
      try {
        const logDir = path.join(__dirname, '../logs');
        await fs.rmdir(logDir, { recursive: true });
      } catch (error) {
        this.log(`Erreur lors du nettoyage des logs: ${error.message}`, 'WARN');
      }
    }
  }
}

module.exports = TestHelpers;
