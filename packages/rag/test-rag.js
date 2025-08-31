const { RAGManager } = require('./dist/index');
const path = require('path');

async function testRAG() {
  console.log('🚀 Test du système RAG Elavira Agents\n');

  try {
    // Initialiser le RAG Manager
    console.log('1. Initialisation du RAG Manager...');
    const ragManager = new RAGManager({
      dbPath: './data/vectors/test-db',
      tableName: 'test-documents',
      chunkingOptions: {
        chunkSize: 500,
        chunkOverlap: 100,
      },
    });

    await ragManager.initialize();
    console.log('✅ RAG Manager initialisé avec succès\n');

    // Vérifier la disponibilité du fournisseur d'embeddings
    console.log('2. Vérification du fournisseur d\'embeddings...');
    const isAvailable = await ragManager.isEmbeddingProviderAvailable();
    if (isAvailable) {
      console.log('✅ Fournisseur d\'embeddings disponible');
      const info = await ragManager.getEmbeddingProviderInfo();
      console.log(`   Modèle: ${info.name}, Dimension: ${info.dimension}`);
    } else {
      console.log('⚠️  Fournisseur d\'embeddings non disponible (Ollama non démarré ?)');
    }
    console.log('');

    // Lister les processeurs disponibles
    console.log('3. Processeurs de documents disponibles:');
    const processors = ragManager.listProcessors();
    processors.forEach(proc => {
      console.log(`   - ${proc.name}: ${proc.extensions.join(', ')}`);
    });
    console.log('');

    // Indexer un répertoire de test
    console.log('4. Indexation du répertoire de connaissances...');
    const knowledgePath = path.join(__dirname, '../../data/knowledge');
    
    const progressCallback = (progress) => {
      if (progress.currentFile) {
        console.log(`   Traitement: ${progress.currentFile} (${progress.processedFiles}/${progress.totalFiles})`);
      }
      if (progress.error) {
        console.log(`   Erreur: ${progress.error}`);
      }
    };

    const knowledgePack = await ragManager.indexDirectory(
      knowledgePath,
      {
        title: 'Pack de test Elavira',
        description: 'Pack de connaissances pour tester le système RAG',
        tags: ['test', 'elavira'],
      },
      progressCallback
    );

    console.log(`✅ Indexation terminée: ${knowledgePack.documents.length} documents traités\n`);

    // Obtenir les statistiques
    console.log('5. Statistiques de la base vectorielle:');
    const stats = await ragManager.getStats();
    console.log(`   Documents totaux: ${stats.totalDocuments}`);
    console.log(`   Chunks totaux: ${stats.totalChunks}`);
    console.log(`   Dernière mise à jour: ${stats.lastUpdated}`);
    console.log('');

    // Effectuer des recherches de test
    console.log('6. Tests de recherche:');
    
    const testQueries = [
      'recette carbonara',
      'intelligence artificielle',
      'machine learning',
      'ingrédients pâtes',
    ];

    for (const query of testQueries) {
      console.log(`\n   Recherche: "${query}"`);
      try {
        const results = await ragManager.search({
          query,
          k: 3,
        });

        if (results.length > 0) {
          console.log(`   Résultats trouvés: ${results.length}`);
          results.forEach((result, index) => {
            const doc = result.document;
            const title = doc.metadata.title || 'Sans titre';
            const source = path.basename(doc.metadata.source);
            const score = (result.score * 100).toFixed(1);
            console.log(`     ${index + 1}. ${title} (${source}) - Score: ${score}%`);
          });
        } else {
          console.log('   Aucun résultat trouvé');
        }
      } catch (error) {
        console.log(`   Erreur de recherche: ${error.message}`);
      }
    }

    console.log('\n✅ Test du système RAG terminé avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testRAG();
}

module.exports = { testRAG };
