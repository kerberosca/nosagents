/**
 * Configuration des tests end-to-end
 */

const testConfig = {
  // Configuration de l'environnement de test
  environment: {
    nodeEnv: 'test',
    timeout: 30000, // 30 secondes
    retries: 3,
    parallel: false
  },

  // Configuration des services
  services: {
    web: {
      port: 3001,
      baseUrl: 'http://localhost:3001',
      timeout: 10000
    },
    worker: {
      port: 3002,
      baseUrl: 'http://localhost:3002',
      timeout: 15000
    },
    database: {
      host: 'localhost',
      port: 5433,
      database: 'elavira_test',
      username: 'postgres',
      password: 'postgres',
      timeout: 5000
    },
    redis: {
      host: 'localhost',
      port: 6380,
      timeout: 5000
    },
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama2',
      embeddingModel: 'llama2',
      timeout: 10000
    }
  },

  // Configuration des tests
  tests: {
    // Tests d'intégration système
    system: {
      enabled: true,
      timeout: 60000,
      retries: 2
    },

    // Tests fonctionnels
    functional: {
      enabled: true,
      timeout: 45000,
      retries: 2,
      parallel: false
    },

    // Tests de performance
    performance: {
      enabled: true,
      timeout: 120000,
      loadTest: {
        users: 10,
        duration: 30,
        rampUp: 10
      },
      stressTest: {
        users: 50,
        duration: 60,
        rampUp: 20
      }
    },

    // Tests de sécurité
    security: {
      enabled: true,
      timeout: 30000,
      retries: 1
    },

    // Tests UI
    ui: {
      enabled: true,
      timeout: 30000,
      browser: 'chromium',
      headless: true,
      viewport: {
        width: 1280,
        height: 720
      }
    }
  },

  // Configuration des données de test
  testData: {
    agents: {
      count: 5,
      types: ['assistant', 'researcher', 'writer', 'analyst', 'coordinator']
    },
    documents: {
      count: 10,
      types: ['pdf', 'txt', 'md', 'docx'],
      sizes: ['small', 'medium', 'large']
    },
    conversations: {
      count: 20,
      maxMessages: 50
    },
    workflows: {
      count: 3,
      maxSteps: 10
    }
  },

  // Configuration des assertions
  assertions: {
    responseTime: {
      fast: 1000,    // < 1s
      normal: 3000,  // < 3s
      slow: 10000    // < 10s
    },
    accuracy: {
      rag: 0.8,      // 80% de pertinence
      delegation: 0.9, // 90% de précision
      workflow: 0.95  // 95% de succès
    },
    performance: {
      memory: 512,   // MB
      cpu: 80,       // %
      concurrent: 50 // utilisateurs simultanés
    }
  },

  // Configuration des rapports
  reporting: {
    output: {
      json: 'tests/reports/results.json',
      html: 'tests/reports/report.html',
      junit: 'tests/reports/junit.xml'
    },
    screenshots: {
      enabled: true,
      path: 'tests/reports/screenshots',
      onFailure: true,
      onSuccess: false
    },
    videos: {
      enabled: false,
      path: 'tests/reports/videos'
    }
  },

  // Configuration du nettoyage
  cleanup: {
    enabled: true,
    databases: true,
    files: true,
    logs: true,
    screenshots: false
  }
};

module.exports = testConfig;
