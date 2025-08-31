/**
 * Tests fonctionnels - Gestion des agents
 */

const TestEnvironment = require('../setup/test-environment');
const TestHelpers = require('../../utils/test-helpers');
const testConfig = require('../../config/test-config');

class AgentManagementTests {
  constructor() {
    this.environment = new TestEnvironment();
    this.helpers = new TestHelpers(testConfig);
    this.results = [];
    this.testAgents = [];
  }

  /**
   * Exécuter tous les tests de gestion des agents
   */
  async runAllTests() {
    this.helpers.log('🤖 Démarrage des tests de gestion des agents...', 'INFO');

    try {
      // Initialiser l'environnement
      await this.environment.initialize();

      // Exécuter les tests
      await this.testAgentCreation();
      await this.testAgentRetrieval();
      await this.testAgentUpdate();
      await this.testAgentDeletion();
      await this.testAgentValidation();
      await this.testAgentPermissions();
      await this.testAgentExecution();

      // Générer le rapport
      const report = this.generateReport();
      this.helpers.log('✅ Tests de gestion des agents terminés', 'INFO');
      
      return report;

    } catch (error) {
      this.helpers.log(`❌ Erreur lors des tests: ${error.message}`, 'ERROR');
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test de création d'agents
   */
  async testAgentCreation() {
    this.helpers.log('➕ Test de création d\'agents...', 'INFO');

    const testAgents = [
      {
        name: 'Test Assistant',
        description: 'Agent assistant de test',
        role: 'assistant',
        model: testConfig.services.ollama.model,
        tools: ['rag.search', 'fs.read'],
        permissions: {
          network: false,
          files: true,
          tools: ['rag.search', 'fs.read']
        }
      },
      {
        name: 'Test Researcher',
        description: 'Agent chercheur de test',
        role: 'researcher',
        model: testConfig.services.ollama.model,
        tools: ['rag.search', 'web.fetch'],
        permissions: {
          network: true,
          files: false,
          tools: ['rag.search', 'web.fetch']
        }
      },
      {
        name: 'Test Writer',
        description: 'Agent écrivain de test',
        role: 'writer',
        model: testConfig.services.ollama.model,
        tools: ['fs.write', 'rag.answer'],
        permissions: {
          network: false,
          files: true,
          tools: ['fs.write', 'rag.answer']
        }
      }
    ];

    for (const agentData of testAgents) {
      try {
        const response = await fetch(`${testConfig.services.worker.baseUrl}/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData)
        });

        if (response.ok) {
          const createdAgent = await response.json();
          this.testAgents.push(createdAgent);

          this.recordResult(`Création agent: ${agentData.name}`, {
            success: true,
            details: `Agent créé avec ID: ${createdAgent.id}`,
            data: createdAgent
          });
          this.helpers.log(`✅ Agent créé: ${agentData.name}`, 'INFO');
        } else {
          const error = await response.text();
          this.recordResult(`Création agent: ${agentData.name}`, {
            success: false,
            error: `HTTP ${response.status}: ${error}`
          });
          this.helpers.log(`❌ Échec création: ${agentData.name}`, 'ERROR');
        }
      } catch (error) {
        this.recordResult(`Création agent: ${agentData.name}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ Erreur création: ${agentData.name} - ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test de récupération d'agents
   */
  async testAgentRetrieval() {
    this.helpers.log('📋 Test de récupération d\'agents...', 'INFO');

    const tests = [
      {
        name: 'Liste tous les agents',
        test: async () => {
          const response = await fetch(`${testConfig.services.worker.baseUrl}/agents`);
          if (response.ok) {
            const agents = await response.json();
            return { success: true, count: agents.length, agents };
          } else {
            return { success: false, error: `HTTP ${response.status}` };
          }
        }
      },
      {
        name: 'Récupération par ID',
        test: async () => {
          if (this.testAgents.length === 0) {
            return { success: false, error: 'Aucun agent de test disponible' };
          }

          const agent = this.testAgents[0];
          const response = await fetch(`${testConfig.services.worker.baseUrl}/agents/${agent.id}`);
          if (response.ok) {
            const retrievedAgent = await response.json();
            return { success: true, agent: retrievedAgent };
          } else {
            return { success: false, error: `HTTP ${response.status}` };
          }
        }
      },
      {
        name: 'Filtrage par rôle',
        test: async () => {
          const response = await fetch(`${testConfig.services.worker.baseUrl}/agents?role=assistant`);
          if (response.ok) {
            const agents = await response.json();
            return { success: true, count: agents.length, role: 'assistant' };
          } else {
            return { success: false, error: `HTTP ${response.status}` };
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordResult(`Récupération: ${test.name}`, {
          success: result.success,
          details: result.success ? test.name : result.error,
          data: result
        });

        if (result.success) {
          this.helpers.log(`✅ ${test.name}: Succès`, 'INFO');
        } else {
          this.helpers.log(`❌ ${test.name}: ${result.error}`, 'ERROR');
        }
      } catch (error) {
        this.recordResult(`Récupération: ${test.name}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ ${test.name}: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test de mise à jour d'agents
   */
  async testAgentUpdate() {
    this.helpers.log('✏️ Test de mise à jour d\'agents...', 'INFO');

    if (this.testAgents.length === 0) {
      this.helpers.log('⚠️ Aucun agent disponible pour les tests de mise à jour', 'WARN');
      return;
    }

    const agent = this.testAgents[0];
    const updateData = {
      name: `${agent.name} (Mis à jour)`,
      description: `${agent.description} - Mise à jour de test`,
      tools: [...agent.tools, 'math.evaluate'],
      permissions: {
        ...agent.permissions,
        tools: [...agent.permissions.tools, 'math.evaluate']
      }
    };

    try {
      const response = await fetch(`${testConfig.services.worker.baseUrl}/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedAgent = await response.json();
        
        // Vérifier que les modifications ont été appliquées
        const isUpdated = 
          updatedAgent.name === updateData.name &&
          updatedAgent.description === updateData.description &&
          updatedAgent.tools.includes('math.evaluate');

        this.recordResult('Mise à jour agent', {
          success: isUpdated,
          details: isUpdated ? 'Agent mis à jour avec succès' : 'Mise à jour incomplète',
          data: updatedAgent
        });

        if (isUpdated) {
          this.helpers.log('✅ Agent mis à jour avec succès', 'INFO');
        } else {
          this.helpers.log('❌ Mise à jour incomplète', 'ERROR');
        }
      } else {
        const error = await response.text();
        this.recordResult('Mise à jour agent', {
          success: false,
          error: `HTTP ${response.status}: ${error}`
        });
        this.helpers.log(`❌ Échec mise à jour: ${error}`, 'ERROR');
      }
    } catch (error) {
      this.recordResult('Mise à jour agent', {
        success: false,
        error: error.message
      });
      this.helpers.log(`❌ Erreur mise à jour: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Test de suppression d'agents
   */
  async testAgentDeletion() {
    this.helpers.log('🗑️ Test de suppression d\'agents...', 'INFO');

    if (this.testAgents.length === 0) {
      this.helpers.log('⚠️ Aucun agent disponible pour les tests de suppression', 'WARN');
      return;
    }

    // Supprimer le dernier agent créé
    const agentToDelete = this.testAgents[this.testAgents.length - 1];

    try {
      const response = await fetch(`${testConfig.services.worker.baseUrl}/agents/${agentToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Vérifier que l'agent a bien été supprimé
        const checkResponse = await fetch(`${testConfig.services.worker.baseUrl}/agents/${agentToDelete.id}`);
        const isDeleted = checkResponse.status === 404;

        this.recordResult('Suppression agent', {
          success: isDeleted,
          details: isDeleted ? 'Agent supprimé avec succès' : 'Agent toujours présent',
          data: { deletedId: agentToDelete.id }
        });

        if (isDeleted) {
          this.helpers.log('✅ Agent supprimé avec succès', 'INFO');
          this.testAgents.pop(); // Retirer de la liste
        } else {
          this.helpers.log('❌ Agent toujours présent après suppression', 'ERROR');
        }
      } else {
        const error = await response.text();
        this.recordResult('Suppression agent', {
          success: false,
          error: `HTTP ${response.status}: ${error}`
        });
        this.helpers.log(`❌ Échec suppression: ${error}`, 'ERROR');
      }
    } catch (error) {
      this.recordResult('Suppression agent', {
        success: false,
        error: error.message
      });
      this.helpers.log(`❌ Erreur suppression: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Test de validation des agents
   */
  async testAgentValidation() {
    this.helpers.log('✅ Test de validation des agents...', 'INFO');

    const invalidAgents = [
      {
        name: '', // Nom vide
        description: 'Agent avec nom vide',
        role: 'assistant',
        model: testConfig.services.ollama.model
      },
      {
        name: 'Agent sans modèle',
        description: 'Agent sans modèle spécifié',
        role: 'assistant'
        // Pas de modèle
      },
      {
        name: 'Agent avec outils invalides',
        description: 'Agent avec outils qui n\'existent pas',
        role: 'assistant',
        model: testConfig.services.ollama.model,
        tools: ['invalid.tool', 'another.invalid']
      },
      {
        name: 'Agent avec permissions invalides',
        description: 'Agent avec permissions contradictoires',
        role: 'assistant',
        model: testConfig.services.ollama.model,
        permissions: {
          network: false,
          files: false,
          tools: ['web.fetch'] // Outil réseau sans permission réseau
        }
      }
    ];

    for (const invalidAgent of invalidAgents) {
      try {
        const response = await fetch(`${testConfig.services.worker.baseUrl}/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidAgent)
        });

        // Un agent invalide devrait être rejeté
        const isValidRejection = response.status === 400 || response.status === 422;

        this.recordResult(`Validation: ${invalidAgent.name || 'Agent sans nom'}`, {
          success: isValidRejection,
          details: isValidRejection ? 'Validation correcte' : 'Validation échouée',
          data: { status: response.status }
        });

        if (isValidRejection) {
          this.helpers.log(`✅ Validation correcte pour: ${invalidAgent.name || 'Agent sans nom'}`, 'INFO');
        } else {
          this.helpers.log(`❌ Validation échouée pour: ${invalidAgent.name || 'Agent sans nom'}`, 'ERROR');
        }
      } catch (error) {
        this.recordResult(`Validation: ${invalidAgent.name || 'Agent sans nom'}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ Erreur validation: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test des permissions des agents
   */
  async testAgentPermissions() {
    this.helpers.log('🔐 Test des permissions des agents...', 'INFO');

    if (this.testAgents.length === 0) {
      this.helpers.log('⚠️ Aucun agent disponible pour les tests de permissions', 'WARN');
      return;
    }

    const agent = this.testAgents[0];

    const permissionTests = [
      {
        name: 'Vérification permissions réseau',
        test: async () => {
          const hasNetworkPermission = agent.permissions?.network === true;
          return { success: true, hasNetwork: hasNetworkPermission };
        }
      },
      {
        name: 'Vérification permissions fichiers',
        test: async () => {
          const hasFilePermission = agent.permissions?.files === true;
          return { success: true, hasFiles: hasFilePermission };
        }
      },
      {
        name: 'Vérification outils autorisés',
        test: async () => {
          const allowedTools = agent.permissions?.tools || [];
          const hasValidTools = allowedTools.length > 0;
          return { success: true, tools: allowedTools, hasValidTools };
        }
      },
      {
        name: 'Validation cohérence permissions',
        test: async () => {
          const hasNetworkTools = agent.tools.some(tool => tool.startsWith('web.'));
          const hasNetworkPermission = agent.permissions?.network === true;
          const isConsistent = !hasNetworkTools || hasNetworkPermission;
          
          return { 
            success: isConsistent, 
            hasNetworkTools, 
            hasNetworkPermission, 
            isConsistent 
          };
        }
      }
    ];

    for (const test of permissionTests) {
      try {
        const result = await test.test();
        this.recordResult(`Permissions: ${test.name}`, {
          success: result.success,
          details: test.name,
          data: result
        });

        if (result.success) {
          this.helpers.log(`✅ ${test.name}: Succès`, 'INFO');
        } else {
          this.helpers.log(`❌ ${test.name}: Incohérence détectée`, 'ERROR');
        }
      } catch (error) {
        this.recordResult(`Permissions: ${test.name}`, {
          success: false,
          error: error.message
        });
        this.helpers.log(`❌ ${test.name}: ${error.message}`, 'ERROR');
      }
    }
  }

  /**
   * Test d'exécution des agents
   */
  async testAgentExecution() {
    this.helpers.log('▶️ Test d\'exécution des agents...', 'INFO');

    if (this.testAgents.length === 0) {
      this.helpers.log('⚠️ Aucun agent disponible pour les tests d\'exécution', 'WARN');
      return;
    }

    const agent = this.testAgents[0];
    const testMessage = {
      content: 'Bonjour, pouvez-vous me dire qui vous êtes ?',
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${testConfig.services.worker.baseUrl}/agents/${agent.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage })
      });

      if (response.ok) {
        const result = await response.json();
        
        const isValidResponse = 
          result.success &&
          result.response &&
          result.response.content &&
          result.response.agentId === agent.id;

        this.recordResult('Exécution agent', {
          success: isValidResponse,
          details: isValidResponse ? 'Agent exécuté avec succès' : 'Réponse invalide',
          data: {
            agentId: agent.id,
            hasResponse: !!result.response,
            responseLength: result.response?.content?.length || 0
          }
        });

        if (isValidResponse) {
          this.helpers.log('✅ Agent exécuté avec succès', 'INFO');
        } else {
          this.helpers.log('❌ Réponse d\'exécution invalide', 'ERROR');
        }
      } else {
        const error = await response.text();
        this.recordResult('Exécution agent', {
          success: false,
          error: `HTTP ${response.status}: ${error}`
        });
        this.helpers.log(`❌ Échec exécution: ${error}`, 'ERROR');
      }
    } catch (error) {
      this.recordResult('Exécution agent', {
        success: false,
        error: error.message
      });
      this.helpers.log(`❌ Erreur exécution: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Nettoyage des données de test
   */
  async cleanup() {
    this.helpers.log('🧹 Nettoyage des agents de test...', 'INFO');

    // Supprimer tous les agents de test créés
    for (const agent of this.testAgents) {
      try {
        await fetch(`${testConfig.services.worker.baseUrl}/agents/${agent.id}`, {
          method: 'DELETE'
        });
        this.helpers.log(`🗑️ Agent supprimé: ${agent.name}`, 'INFO');
      } catch (error) {
        this.helpers.log(`⚠️ Erreur suppression agent ${agent.name}: ${error.message}`, 'WARN');
      }
    }

    this.testAgents = [];
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

module.exports = AgentManagementTests;
