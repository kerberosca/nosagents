console.log('🚀 Démarrage du test de debug...');

try {
  console.log('1. Test de chargement de Prisma...');
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma chargé');

  console.log('2. Test de chargement d\'OllamaProvider...');
  const { OllamaProvider } = require('./dist/src/models/ollama-provider');
  console.log('✅ OllamaProvider chargé');

  console.log('3. Test de chargement d\'Agent...');
  const { Agent } = require('./dist/src/runtime/agent');
  console.log('✅ Agent chargé');

  console.log('4. Test de chargement d\'AgentManager...');
  const { AgentManager } = require('./dist/src/runtime/agent-manager');
  console.log('✅ AgentManager chargé');

  console.log('5. Test de chargement de ToolRegistry...');
  const { ToolRegistry } = require('./dist/src/tools/tool-registry');
  console.log('✅ ToolRegistry chargé');

  console.log('6. Test de chargement de MemoryManager...');
  const { MemoryManager } = require('./dist/src/memory/memory-manager');
  console.log('✅ MemoryManager chargé');

  console.log('7. Test de chargement des outils...');
  const { RagSearchTool, MathEvaluateTool } = require('./dist/src/tools/builtin-tools');
  console.log('✅ Outils chargés');

  console.log('🎉 Tous les modules ont été chargés avec succès !');

} catch (error) {
  console.error('❌ Erreur lors du chargement:', error);
  console.error('Stack trace:', error.stack);
}
