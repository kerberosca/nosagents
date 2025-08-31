# 🗄️ Base de données Prisma - Elavira Agents

Ce document décrit l'utilisation de Prisma avec PostgreSQL dans Elavira Agents.

## 📋 Vue d'ensemble

Elavira Agents utilise **PostgreSQL** comme base de données principale avec **Prisma** comme ORM pour gérer :

- **Agents** : Définitions et configurations
- **Conversations** : Historique des échanges
- **Messages** : Contenu des conversations
- **Outils** : Définitions et traçabilité
- **Connaissances** : Packs et documents RAG
- **Mémoire** : Stockage persistant des agents
- **Workflows** : Orchestration multi-agents
- **Logs** : Traçabilité système

## 🚀 Installation et configuration

### Prérequis

- PostgreSQL 12+ installé et configuré
- Node.js 18+ et pnpm
- Variables d'environnement configurées

### Configuration

1. **Variables d'environnement** :
```bash
DATABASE_URL="postgresql://elavira:password@localhost:5432/elavira?schema=public"
NODE_ENV="development"
```

2. **Installation des dépendances** :
```bash
pnpm install
```

## 📊 Schéma de base de données

### Agents
```sql
agents (
  id: String (CUID)
  name: String (unique)
  role: String
  description: String?
  model: String
  goals: String[]
  tools: String[]
  knowledgePackIds: String[]
  authorizations: Json
  style: Json?
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
)
```

### Conversations
```sql
conversations (
  id: String (CUID)
  title: String?
  agentId: String (FK)
  userId: String? (FK)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
)
```

### Messages
```sql
messages (
  id: String (CUID)
  conversationId: String (FK)
  agentId: String? (FK)
  role: String (user|assistant|system)
  content: String
  metadata: Json?
  createdAt: DateTime
)
```

### Outils et Appels
```sql
tools (
  id: String (CUID)
  name: String (unique)
  description: String
  schema: Json
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
)

tool_calls (
  id: String (CUID)
  conversationId: String (FK)
  agentId: String? (FK)
  toolId: String (FK)
  name: String
  arguments: Json
  result: Json?
  error: String?
  duration: Int?
  createdAt: DateTime
)
```

### Connaissances
```sql
knowledge_packs (
  id: String (CUID)
  name: String
  description: String?
  path: String
  metadata: Json?
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
)

documents (
  id: String (CUID)
  knowledgePackId: String (FK)
  source: String
  title: String?
  author: String?
  content: String
  metadata: Json?
  embeddings: Float[]?
  isIndexed: Boolean
  createdAt: DateTime
  updatedAt: DateTime
)
```

### Mémoire
```sql
memories (
  id: String (CUID)
  agentId: String (FK)
  type: String (short_term|long_term|episodic)
  key: String
  value: Json
  metadata: Json?
  expiresAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
)
```

### Workflows
```sql
workflows (
  id: String (CUID)
  name: String
  description: String?
  definition: Json
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
)

workflow_executions (
  id: String (CUID)
  workflowId: String (FK)
  status: String (running|completed|failed|cancelled)
  input: Json?
  output: Json?
  error: String?
  startedAt: DateTime
  completedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
)

workflow_participants (
  id: String (CUID)
  workflowId: String (FK)
  agentId: String (FK)
  role: String
  order: Int
  createdAt: DateTime
)
```

### Logs et Utilisateurs
```sql
system_logs (
  id: String (CUID)
  level: String (info|warn|error|debug)
  category: String
  message: String
  metadata: Json?
  createdAt: DateTime
)

users (
  id: String (CUID)
  email: String (unique)
  name: String?
  role: String (user|admin)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
)
```

## 🛠️ Commandes Prisma

### Génération et migration

```bash
# Générer le client Prisma
pnpm db:generate

# Pousser le schéma vers la base de données
pnpm db:push

# Créer une migration
pnpm db:migrate

# Appliquer les migrations
pnpm db:migrate:deploy

# Réinitialiser la base de données (développement)
pnpm db:reset
```

### Développement

```bash
# Ouvrir Prisma Studio (interface web)
pnpm db:studio

# Initialiser avec des données de test
pnpm db:seed

# Vérifier l'état de la base de données
pnpm db:status
```

### Maintenance

```bash
# Sauvegarder la base de données
pnpm db:backup

# Restaurer la base de données
pnpm db:restore

# Nettoyer les anciennes données
pnpm db:cleanup
```

## 🔧 Services de base de données

### AgentService
```typescript
import { AgentService } from '@elavira/core';

const agentService = new AgentService();

// Créer un agent
const agent = await agentService.createAgent({
  name: 'MonAgent',
  role: 'Assistant spécialisé',
  model: 'qwen2.5:7b',
  tools: ['rag.search', 'math.evaluate'],
});

// Récupérer les agents actifs
const agents = await agentService.getActiveAgents();
```

### ConversationService
```typescript
import { ConversationService } from '@elavira/core';

const conversationService = new ConversationService();

// Créer une conversation
const conversation = await conversationService.createConversation({
  agentId: 'agent-id',
  userId: 'user-id',
});

// Ajouter un message
await conversationService.addMessage({
  conversationId: conversation.id,
  role: 'user',
  content: 'Bonjour !',
});
```

### ToolService
```typescript
import { ToolService } from '@elavira/core';

const toolService = new ToolService();

// Créer un outil
const tool = await toolService.createTool({
  name: 'mon.outil',
  description: 'Description de l\'outil',
  schema: { /* JSON Schema */ },
});

// Tracer un appel d'outil
await toolService.createToolCall({
  conversationId: 'conv-id',
  toolId: tool.id,
  name: 'mon.outil',
  arguments: { param: 'value' },
  result: { success: true },
});
```

### LogService
```typescript
import { LogService } from '@elavira/core';

const logService = new LogService();

// Créer des logs
await logService.info('agent', 'Agent créé avec succès');
await logService.error('tool', 'Erreur lors de l\'appel d\'outil', { toolId: 'tool-1' });
await logService.warn('system', 'Mémoire faible');

// Récupérer les logs récents
const logs = await logService.getRecentLogs(100);
```

## 📈 Optimisations et performances

### Indexes
Le schéma inclut des indexes optimisés pour :
- Recherche par conversation
- Filtrage par agent
- Tri par date
- Recherche textuelle

### Relations
- **Cascade** : Suppression automatique des données liées
- **Soft Delete** : Désactivation plutôt que suppression
- **Lazy Loading** : Chargement à la demande

### Maintenance
- **Nettoyage automatique** : Suppression des anciens logs
- **Archivage** : Conservation des données importantes
- **Backup** : Sauvegarde régulière

## 🔒 Sécurité

### Validation des données
- **Zod** : Validation des schémas
- **Prisma** : Validation au niveau de la base de données
- **Sanitisation** : Nettoyage des entrées

### Permissions
- **Granulaires** : Par agent et par outil
- **Audit** : Traçabilité complète
- **Isolation** : Séparation des données

## 🐛 Dépannage

### Erreurs courantes

1. **Connexion refusée** :
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Vérifier la configuration
echo $DATABASE_URL
```

2. **Schéma non synchronisé** :
```bash
# Régénérer le client
pnpm db:generate

# Pousser les changements
pnpm db:push
```

3. **Données corrompues** :
```bash
# Réinitialiser (développement uniquement)
pnpm db:reset

# Restaurer depuis backup
pnpm db:restore
```

### Logs et debug

```bash
# Activer les logs Prisma
export DEBUG="prisma:*"

# Vérifier les logs système
pnpm db:logs
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [PostgreSQL](https://www.postgresql.org/docs)
- [Schéma JSON](https://json-schema.org)
- [TypeScript](https://www.typescriptlang.org/docs)

## 🤝 Contribution

Pour modifier le schéma de base de données :

1. Modifier `schema.prisma`
2. Créer une migration : `pnpm db:migrate`
3. Mettre à jour les services si nécessaire
4. Tester avec `pnpm db:seed`
5. Documenter les changements

---

**Note** : Ce schéma est conçu pour évoluer avec les besoins d'Elavira Agents. Les migrations sont gérées automatiquement par Prisma.
