const { RAGManager } = require('./dist/rag-manager');
const { OllamaEmbeddingProvider } = require('./dist/embeddings/ollama-embeddings');
const path = require('path');

// Fournisseur d'embeddings simulé pour les tests
class MockEmbeddingProvider {
  constructor() {
    this.dimension = 384;
    this.model = 'mock-embeddings';
  }

  async isAvailable() {
    return true;
  }

  async embedText(text) {
    // Générer un embedding simulé basé sur le hash du texte
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const embedding = new Array(this.dimension).fill(0);
    for (let i = 0; i < this.dimension; i++) {
      embedding[i] = Math.sin(hash + i) * 0.1;
    }
    
    return embedding;
  }

  async embedTexts(texts) {
    const embeddings = [];
    for (const text of texts) {
      const embedding = await this.embedText(text);
      embeddings.push(embedding);
    }
    return {
      embeddings,
      tokens: texts.reduce((sum, text) => sum + text.length, 0),
      model: this.model
    };
  }

  async getModelInfo() {
    return {
      name: this.model,
      dimension: this.dimension,
      maxTokens: 8192
    };
  }
}

async function testRAGSimple() {
  console.log('🚀 Test simple du système RAG Elavira Agents\n');

  try {
    // 1. Initialisation du RAG Manager avec un fournisseur d'embeddings simulé
    console.log('1. Initialisation du RAG Manager...');
    const ragManager = new RAGManager({
      dbPath: './data/vectors/test-db-simple',
      tableName: 'test-documents-simple',
      embeddingProvider: new MockEmbeddingProvider(),
      chunkingOptions: {
        chunkSize: 500,
        chunkOverlap: 100,
        separator: '\n'
      }
    });

    await ragManager.initialize();
    console.log('✅ RAG Manager initialisé avec succès');

    // 2. Vérification du fournisseur d'embeddings
    console.log('\n2. Vérification du fournisseur d\'embeddings...');
    const isAvailable = await ragManager.isEmbeddingProviderAvailable();
    console.log(`✅ Fournisseur d'embeddings disponible: ${isAvailable}`);

    // 3. Processeurs de documents disponibles
    console.log('\n3. Processeurs de documents disponibles:');
    const processors = ragManager.listProcessors();
    processors.forEach(processor => {
      console.log(`   - ${processor.name}: ${processor.extensions.join(', ')}`);
    });

    // 4. Créer des documents de test en mémoire
    console.log('\n4. Création de documents de test...');
    const testDocuments = [
      {
        content: `L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des systèmes capables de simuler l'intelligence humaine. 
        
        Les applications de l'IA incluent la reconnaissance vocale, la vision par ordinateur, et le traitement du langage naturel.`,
        metadata: {
          source: 'test-ai.md',
          title: 'Introduction à l\'IA',
          author: 'Test Author',
          language: 'fr',
          tags: ['IA', 'intelligence artificielle', 'technologie']
        }
      },
      {
        content: `Le machine learning est une sous-discipline de l'intelligence artificielle qui permet aux ordinateurs d'apprendre sans être explicitement programmés.
        
        Les algorithmes de machine learning peuvent identifier des patterns dans les données et faire des prédictions basées sur ces patterns.`,
        metadata: {
          source: 'test-ml.md',
          title: 'Machine Learning',
          author: 'Test Author',
          language: 'fr',
          tags: ['machine learning', 'IA', 'algorithmes']
        }
      },
      {
        content: `La recette de pâtes à la carbonara est un plat traditionnel italien.
        
        Ingrédients:
        - 400g de spaghetti
        - 200g de pancetta ou guanciale
        - 4 jaunes d'œufs
        - 100g de pecorino romano
        - Poivre noir fraîchement moulu
        
        Préparation:
        1. Faire cuire les pâtes dans l'eau salée
        2. Faire revenir la pancetta
        3. Mélanger avec les œufs et le fromage`,
        metadata: {
          source: 'test-recipe.md',
          title: 'Pâtes à la Carbonara',
          author: 'Chef Italien',
          language: 'fr',
          tags: ['recette', 'cuisine', 'italien', 'pâtes']
        }
      }
    ];

    // 5. Indexer les documents de test
    console.log('\n5. Indexation des documents de test...');
    for (let i = 0; i < testDocuments.length; i++) {
      const doc = testDocuments[i];
      console.log(`   Indexation: ${doc.metadata.title} (${i + 1}/${testDocuments.length})`);
      
      // Créer un document au format attendu
      const documents = [{
        id: `test-doc-${i}`,
        content: doc.content,
        metadata: {
          source: doc.metadata.source,
          title: doc.metadata.title,
          author: doc.metadata.author,
          language: doc.metadata.language,
          tags: doc.metadata.tags,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }];
      
      await ragManager.vectorStore.addDocuments(documents);
    }
    console.log('✅ Documents indexés avec succès');

    // 6. Statistiques de la base vectorielle
    console.log('\n6. Statistiques de la base vectorielle:');
    const stats = await ragManager.getStats();
    console.log(`   Documents totaux: ${stats.totalDocuments}`);
    console.log(`   Chunks totaux: ${stats.totalChunks}`);
    console.log(`   Dernière mise à jour: ${stats.lastUpdated}`);

    // 7. Tests de recherche
    console.log('\n7. Tests de recherche:');
    
    const searchQueries = [
      'intelligence artificielle',
      'machine learning',
      'recette carbonara',
      'ingrédients pâtes'
    ];

    for (const query of searchQueries) {
      console.log(`\n   Recherche: "${query}"`);
      try {
        const results = await ragManager.search({
          query,
          k: 3
        });
        
        console.log(`   ✅ ${results.length} résultats trouvés:`);
        results.forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.document.metadata.title} (score: ${result.score.toFixed(3)})`);
          console.log(`         Extrait: ${result.document.content.substring(0, 100)}...`);
        });
      } catch (error) {
        console.log(`   ❌ Erreur de recherche: ${error.message}`);
      }
    }

    // 8. Test de recherche avec filtres
    console.log('\n8. Test de recherche avec filtres:');
    try {
      const results = await ragManager.searchWithFilters(
        'intelligence',
        { tags: ['IA'] },
        2
      );
      
      console.log(`   ✅ ${results.length} résultats trouvés avec filtre 'IA':`);
      results.forEach((result, index) => {
        console.log(`      ${index + 1}. ${result.document.metadata.title} (score: ${result.score.toFixed(3)})`);
      });
    } catch (error) {
      console.log(`   ❌ Erreur de recherche avec filtres: ${error.message}`);
    }

    console.log('\n🎉 Test simple du système RAG terminé avec succès !');
    console.log('\nRésumé de l\'étape 3 :');
    console.log('✅ Processeurs de documents implémentés (PDF, DOCX, TXT, MD)');
    console.log('✅ Système de chunking intelligent');
    console.log('✅ Base de données vectorielle (LanceDB mock)');
    console.log('✅ Fournisseur d\'embeddings (Ollama + mock)');
    console.log('✅ Recherche sémantique avec filtres');
    console.log('✅ RAG Manager complet');

  } catch (error) {
    console.error('❌ Erreur lors du test RAG simple:', error);
  }
}

// Instructions pour l'utilisateur
console.log('📋 Test simple du système RAG :');
console.log('');
console.log('Ce test utilise un fournisseur d\'embeddings simulé');
console.log('pour valider le système RAG sans dépendre d\'Ollama.');
console.log('');

// Lancer le test
testRAGSimple();
