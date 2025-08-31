/**
 * Script principal pour exécuter tous les tests end-to-end
 */

const SystemIntegrationTests = require('../e2e/integration/system-integration.test');
const AgentManagementTests = require('../e2e/functional/agent-management.test');
const TestHelpers = require('../utils/test-helpers');
const testConfig = require('../config/test-config');

class TestRunner {
  constructor() {
    this.helpers = new TestHelpers(testConfig);
    this.results = {
      system: null,
      functional: null,
      performance: null,
      security: null,
      ui: null
    };
    this.startTime = Date.now();
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    this.helpers.log('🚀 Démarrage de la suite complète de tests end-to-end', 'INFO');
    this.helpers.log('================================================', 'INFO');

    try {
      // 1. Tests d'intégration système
      await this.runSystemTests();

      // 2. Tests fonctionnels
      await this.runFunctionalTests();

      // 3. Tests de performance (optionnels)
      if (testConfig.tests.performance.enabled) {
        await this.runPerformanceTests();
      }

      // 4. Tests de sécurité
      if (testConfig.tests.security.enabled) {
        await this.runSecurityTests();
      }

      // 5. Tests UI (optionnels)
      if (testConfig.tests.ui.enabled) {
        await this.runUITests();
      }

      // 6. Générer le rapport final
      const finalReport = this.generateFinalReport();
      this.helpers.log('✅ Tous les tests sont terminés', 'INFO');
      
      return finalReport;

    } catch (error) {
      this.helpers.log(`❌ Erreur critique lors des tests: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Exécuter les tests d'intégration système
   */
  async runSystemTests() {
    this.helpers.log('\n🧪 EXÉCUTION DES TESTS D\'INTÉGRATION SYSTÈME', 'INFO');
    this.helpers.log('============================================', 'INFO');

    try {
      const systemTests = new SystemIntegrationTests();
      this.results.system = await systemTests.runAllTests();

      this.helpers.log(`✅ Tests système terminés: ${this.results.system.summary.successRate}`, 'INFO');
      
      if (this.results.system.summary.failed > 0) {
        this.helpers.log(`⚠️ ${this.results.system.summary.failed} tests système ont échoué`, 'WARN');
      }

    } catch (error) {
      this.helpers.log(`❌ Erreur lors des tests système: ${error.message}`, 'ERROR');
      this.results.system = {
        summary: { total: 0, passed: 0, failed: 1, successRate: '0%' },
        error: error.message
      };
    }
  }

  /**
   * Exécuter les tests fonctionnels
   */
  async runFunctionalTests() {
    this.helpers.log('\n🔧 EXÉCUTION DES TESTS FONCTIONNELS', 'INFO');
    this.helpers.log('==================================', 'INFO');

    try {
      // Tests de gestion des agents
      this.helpers.log('\n🤖 Tests de gestion des agents...', 'INFO');
      const agentTests = new AgentManagementTests();
      this.results.functional = await agentTests.runAllTests();

      this.helpers.log(`✅ Tests fonctionnels terminés: ${this.results.functional.summary.successRate}`, 'INFO');
      
      if (this.results.functional.summary.failed > 0) {
        this.helpers.log(`⚠️ ${this.results.functional.summary.failed} tests fonctionnels ont échoué`, 'WARN');
      }

    } catch (error) {
      this.helpers.log(`❌ Erreur lors des tests fonctionnels: ${error.message}`, 'ERROR');
      this.results.functional = {
        summary: { total: 0, passed: 0, failed: 1, successRate: '0%' },
        error: error.message
      };
    }
  }

  /**
   * Exécuter les tests de performance
   */
  async runPerformanceTests() {
    this.helpers.log('\n⚡ EXÉCUTION DES TESTS DE PERFORMANCE', 'INFO');
    this.helpers.log('====================================', 'INFO');

    try {
      // Tests de charge
      this.helpers.log('\n📊 Tests de charge...', 'INFO');
      const loadTestResult = await this.runLoadTests();

      // Tests de stress
      this.helpers.log('\n🔥 Tests de stress...', 'INFO');
      const stressTestResult = await this.runStressTests();

      this.results.performance = {
        load: loadTestResult,
        stress: stressTestResult,
        summary: {
          total: loadTestResult.total + stressTestResult.total,
          passed: loadTestResult.passed + stressTestResult.passed,
          failed: loadTestResult.failed + stressTestResult.failed,
          successRate: `${(((loadTestResult.passed + stressTestResult.passed) / (loadTestResult.total + stressTestResult.total)) * 100).toFixed(2)}%`
        }
      };

      this.helpers.log(`✅ Tests de performance terminés: ${this.results.performance.summary.successRate}`, 'INFO');

    } catch (error) {
      this.helpers.log(`❌ Erreur lors des tests de performance: ${error.message}`, 'ERROR');
      this.results.performance = {
        summary: { total: 0, passed: 0, failed: 1, successRate: '0%' },
        error: error.message
      };
    }
  }

  /**
   * Exécuter les tests de charge
   */
  async runLoadTests() {
    const config = testConfig.tests.performance.loadTest;
    const results = [];

    this.helpers.log(`📈 Test de charge: ${config.users} utilisateurs pendant ${config.duration}s`, 'INFO');

    // Simuler des requêtes concurrentes
    for (let i = 0; i < config.users; i++) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${testConfig.services.worker.baseUrl}/health`);
        const duration = Date.now() - startTime;

        results.push({
          success: response.ok,
          duration,
          status: response.status
        });

        // Attendre un peu entre les requêtes
        await this.helpers.wait(100);
      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    return {
      total: results.length,
      passed,
      failed,
      successRate: `${((passed / results.length) * 100).toFixed(2)}%`,
      averageResponseTime: results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / passed || 0
    };
  }

  /**
   * Exécuter les tests de stress
   */
  async runStressTests() {
    const config = testConfig.tests.performance.stressTest;
    const results = [];

    this.helpers.log(`🔥 Test de stress: ${config.users} utilisateurs pendant ${config.duration}s`, 'INFO');

    // Simuler des requêtes intensives
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);

    while (Date.now() < endTime) {
      const promises = [];
      
      for (let i = 0; i < Math.min(config.users, 10); i++) {
        promises.push(
          fetch(`${testConfig.services.worker.baseUrl}/health`)
            .then(response => ({
              success: response.ok,
              status: response.status,
              timestamp: Date.now()
            }))
            .catch(error => ({
              success: false,
              error: error.message,
              timestamp: Date.now()
            }))
        );
      }

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Attendre un peu entre les batches
      await this.helpers.wait(100);
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    return {
      total: results.length,
      passed,
      failed,
      successRate: `${((passed / results.length) * 100).toFixed(2)}%`,
      requestsPerSecond: results.length / (config.duration)
    };
  }

  /**
   * Exécuter les tests de sécurité
   */
  async runSecurityTests() {
    this.helpers.log('\n🔒 EXÉCUTION DES TESTS DE SÉCURITÉ', 'INFO');
    this.helpers.log('==================================', 'INFO');

    try {
      const securityResults = [];

      // Test d'injection SQL
      this.helpers.log('\n💉 Test d\'injection SQL...', 'INFO');
      const sqlInjectionResult = await this.testSQLInjection();
      securityResults.push(sqlInjectionResult);

      // Test d'injection XSS
      this.helpers.log('\n🕷️ Test d\'injection XSS...', 'INFO');
      const xssResult = await this.testXSSInjection();
      securityResults.push(xssResult);

      // Test d'autorisation
      this.helpers.log('\n🔐 Test d\'autorisation...', 'INFO');
      const authResult = await this.testAuthorization();
      securityResults.push(authResult);

      const passed = securityResults.filter(r => r.success).length;
      const failed = securityResults.length - passed;

      this.results.security = {
        summary: {
          total: securityResults.length,
          passed,
          failed,
          successRate: `${((passed / securityResults.length) * 100).toFixed(2)}%`
        },
        results: securityResults
      };

      this.helpers.log(`✅ Tests de sécurité terminés: ${this.results.security.summary.successRate}`, 'INFO');

    } catch (error) {
      this.helpers.log(`❌ Erreur lors des tests de sécurité: ${error.message}`, 'ERROR');
      this.results.security = {
        summary: { total: 0, passed: 0, failed: 1, successRate: '0%' },
        error: error.message
      };
    }
  }

  /**
   * Test d'injection SQL
   */
  async testSQLInjection() {
    const maliciousInputs = [
      "'; DROP TABLE agents; --",
      "' OR '1'='1",
      "'; INSERT INTO agents VALUES ('hacker', 'hacker'); --"
    ];

    for (const input of maliciousInputs) {
      try {
        const response = await fetch(`${testConfig.services.worker.baseUrl}/agents?search=${encodeURIComponent(input)}`);
        
        // Si la requête réussit avec une injection SQL, c'est un échec de sécurité
        if (response.ok) {
          const data = await response.json();
          // Vérifier si des données sensibles ont été exposées
          if (data.length > 0 && data.some(item => item.name === 'hacker')) {
            return { success: false, type: 'SQL Injection', input, details: 'Injection SQL réussie' };
          }
        }
      } catch (error) {
        // Erreur attendue pour une injection SQL
      }
    }

    return { success: true, type: 'SQL Injection', details: 'Aucune injection SQL détectée' };
  }

  /**
   * Test d'injection XSS
   */
  async testXSSInjection() {
    const maliciousInputs = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')"
    ];

    for (const input of maliciousInputs) {
      try {
        const response = await fetch(`${testConfig.services.worker.baseUrl}/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: input,
            description: 'Test XSS',
            role: 'assistant',
            model: testConfig.services.ollama.model
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Vérifier si le script a été exécuté
          if (data.name && data.name.includes('<script>')) {
            return { success: false, type: 'XSS Injection', input, details: 'XSS non filtré' };
          }
        }
      } catch (error) {
        // Erreur attendue
      }
    }

    return { success: true, type: 'XSS Injection', details: 'XSS correctement filtré' };
  }

  /**
   * Test d'autorisation
   */
  async testAuthorization() {
    try {
      // Tenter d'accéder à des endpoints sans autorisation
      const endpoints = [
        '/agents',
        '/admin/users',
        '/system/config'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${testConfig.services.worker.baseUrl}${endpoint}`);
        
        // Vérifier que l'accès est correctement restreint
        if (response.status !== 401 && response.status !== 403) {
          return { 
            success: false, 
            type: 'Authorization', 
            endpoint, 
            details: `Accès non autorisé à ${endpoint}` 
          };
        }
      }

      return { success: true, type: 'Authorization', details: 'Autorisation correctement appliquée' };
    } catch (error) {
      return { success: false, type: 'Authorization', error: error.message };
    }
  }

  /**
   * Exécuter les tests UI
   */
  async runUITests() {
    this.helpers.log('\n🖥️ EXÉCUTION DES TESTS UI', 'INFO');
    this.helpers.log('========================', 'INFO');

    try {
      const uiResults = [];

      // Test de connectivité UI
      this.helpers.log('\n🌐 Test de connectivité UI...', 'INFO');
      const connectivityResult = await this.testUIConnectivity();
      uiResults.push(connectivityResult);

      // Test de navigation
      this.helpers.log('\n🧭 Test de navigation...', 'INFO');
      const navigationResult = await this.testUINavigation();
      uiResults.push(navigationResult);

      const passed = uiResults.filter(r => r.success).length;
      const failed = uiResults.length - passed;

      this.results.ui = {
        summary: {
          total: uiResults.length,
          passed,
          failed,
          successRate: `${((passed / uiResults.length) * 100).toFixed(2)}%`
        },
        results: uiResults
      };

      this.helpers.log(`✅ Tests UI terminés: ${this.results.ui.summary.successRate}`, 'INFO');

    } catch (error) {
      this.helpers.log(`❌ Erreur lors des tests UI: ${error.message}`, 'ERROR');
      this.results.ui = {
        summary: { total: 0, passed: 0, failed: 1, successRate: '0%' },
        error: error.message
      };
    }
  }

  /**
   * Test de connectivité UI
   */
  async testUIConnectivity() {
    try {
      const response = await fetch(testConfig.services.web.baseUrl);
      return {
        success: response.ok,
        type: 'UI Connectivity',
        details: `Status: ${response.status}`,
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        type: 'UI Connectivity',
        error: error.message
      };
    }
  }

  /**
   * Test de navigation UI
   */
  async testUINavigation() {
    try {
      const pages = ['/', '/agents', '/chat', '/knowledge', '/multi-agent'];
      const results = [];

      for (const page of pages) {
        const response = await fetch(`${testConfig.services.web.baseUrl}${page}`);
        results.push({
          page,
          success: response.ok,
          status: response.status
        });
      }

      const allSuccessful = results.every(r => r.success);
      return {
        success: allSuccessful,
        type: 'UI Navigation',
        details: `${results.filter(r => r.success).length}/${results.length} pages accessibles`,
        results
      };
    } catch (error) {
      return {
        success: false,
        type: 'UI Navigation',
        error: error.message
      };
    }
  }

  /**
   * Générer le rapport final
   */
  generateFinalReport() {
    const totalTests = Object.values(this.results)
      .filter(r => r && r.summary)
      .reduce((sum, r) => sum + r.summary.total, 0);

    const totalPassed = Object.values(this.results)
      .filter(r => r && r.summary)
      .reduce((sum, r) => sum + r.summary.passed, 0);

    const totalFailed = totalTests - totalPassed;
    const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0.00';

    const duration = Date.now() - this.startTime;

    const report = {
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: `${overallSuccessRate}%`,
        duration: `${(duration / 1000).toFixed(2)}s`
      },
      categories: this.results,
      timestamp: new Date().toISOString()
    };

    // Afficher le rapport
    this.helpers.log('\n📊 RAPPORT FINAL DES TESTS', 'INFO');
    this.helpers.log('==========================', 'INFO');
    this.helpers.log(`Total des tests: ${totalTests}`, 'INFO');
    this.helpers.log(`Tests réussis: ${totalPassed}`, 'INFO');
    this.helpers.log(`Tests échoués: ${totalFailed}`, 'INFO');
    this.helpers.log(`Taux de succès: ${overallSuccessRate}%`, 'INFO');
    this.helpers.log(`Durée totale: ${(duration / 1000).toFixed(2)}s`, 'INFO');

    // Détails par catégorie
    this.helpers.log('\n📋 Détails par catégorie:', 'INFO');
    Object.entries(this.results).forEach(([category, result]) => {
      if (result && result.summary) {
        const status = result.summary.failed > 0 ? '❌' : '✅';
        this.helpers.log(`${status} ${category}: ${result.summary.successRate} (${result.summary.passed}/${result.summary.total})`, 'INFO');
      }
    });

    // Recommandations
    if (totalFailed > 0) {
      this.helpers.log('\n⚠️ Recommandations:', 'WARN');
      this.helpers.log('- Vérifier les logs d\'erreur pour plus de détails', 'WARN');
      this.helpers.log('- Corriger les tests échoués avant le déploiement', 'WARN');
      this.helpers.log('- Revoir la configuration des services', 'WARN');
    } else {
      this.helpers.log('\n🎉 Tous les tests sont réussis !', 'INFO');
      this.helpers.log('La plateforme est prête pour le déploiement.', 'INFO');
    }

    return report;
  }
}

// Point d'entrée principal
async function main() {
  const runner = new TestRunner();
  
  try {
    const report = await runner.runAllTests();
    
    // Sauvegarder le rapport
    const fs = require('fs');
    const reportPath = 'tests/reports/final-report.json';
    
    // Créer le dossier reports s'il n'existe pas
    const reportsDir = 'tests/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
    
    // Code de sortie basé sur le succès
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`\n❌ Erreur critique: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = TestRunner;
