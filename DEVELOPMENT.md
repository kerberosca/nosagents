# 🛠️ Guide de développement - Elavira Agents

Ce guide explique comment contribuer au développement d'Elavira Agents.

## 📋 Prérequis

- **Node.js** 18+ et **pnpm** 8+
- **Docker** et **Docker Compose** (recommandé)
- **Ollama** installé localement
- **Git** pour la gestion de version

## 🏗️ Architecture du projet

### Structure monorepo

```
.
├─ apps/
│  └─ web/                # Application Next.js
├─ packages/
│  ├─ core/               # Runtime des agents
│  ├─ rag/                # Indexation + recherche
│  ├─ ui/                 # Composants React partagés
│  └─ config/             # Schémas Zod et types
├─ data/                  # Données persistantes
├─ agents/                # Définitions YAML des agents
└─ scripts/               # Scripts utilitaires
```

### Packages

#### `@elavira/config`
- Schémas Zod pour la validation
- Types TypeScript partagés
- Constantes et configurations

#### `@elavira/core`
- Runtime des agents
- Gestionnaire d'outils
- Système de mémoire
- Orchestrateur d'agents

#### `@elavira/rag`
- Indexation de documents
- Recherche vectorielle
- Processeurs de fichiers
- Embeddings avec Ollama

#### `@elavira/ui`
- Composants React réutilisables
- Design system basé sur shadcn/ui
- Composants spécifiques aux agents

## 🚀 Configuration de l'environnement

### 1. Installation

```bash
# Cloner le projet
git clone <repository>
cd elavira-agents

# Installer les dépendances
pnpm install

# Copier la configuration
cp env.example .env
```

### 2. Services externes

```bash
# Lancer PostgreSQL et Ollama
docker-compose up -d postgres ollama

# Télécharger les modèles
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

### 3. Base de données

```bash
# Générer le client Prisma
pnpm db:generate

# Appliquer les migrations
pnpm db:migrate

# Seed initial (optionnel)
pnpm db:seed
```

## 🧪 Développement

### Commandes utiles

```bash
# Lancer en mode développement
pnpm dev

# Construire tous les packages
pnpm build

# Vérification des types
pnpm type-check

# Linting
pnpm lint

# Nettoyer les builds
pnpm clean
```

### Workflow de développement

1. **Créer une branche** pour votre fonctionnalité
2. **Développer** dans le package approprié
3. **Tester** localement avec `pnpm dev`
4. **Construire** pour vérifier les erreurs
5. **Commiter** avec des messages descriptifs
6. **Pousser** et créer une Pull Request

## 🤖 Développement d'agents

### Créer un nouvel agent

1. **Définition YAML** dans `agents/`
2. **Configuration** des outils et autorisations
3. **Tests** avec l'interface web

### Exemple d'agent

```yaml
name: MonAgent
role: "Description du rôle"
model: "qwen2.5:7b"
goals:
  - "Objectif 1"
  - "Objectif 2"
tools: ["rag.search", "math.evaluate"]
authorizations:
  network: false
  filesystem: true
```

## 🛠️ Développement d'outils

### Créer un nouvel outil

1. **Hériter** de `BaseTool`
2. **Implémenter** `executeTool()`
3. **Définir** le schéma de validation
4. **Enregistrer** dans le registre

### Exemple d'outil

```typescript
export class MonOutil extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'mon.outil',
      description: 'Description de l\'outil',
      parameters: {},
      security: {
        requiresNetwork: false,
        requiresFilesystem: false,
        dangerous: false,
      },
    };

    const schema = z.object({
      param1: z.string(),
      param2: z.number(),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: AgentContext): Promise<any> {
    // Implémentation de l'outil
    return { result: 'success' };
  }
}
```

## 🔍 Développement RAG

### Processeurs de documents

- **PDF** : `pdf-parse`
- **DOCX** : `mammoth`
- **TXT/MD** : Lecture directe
- **Images** : OCR (à implémenter)

### Indexation

```typescript
// Exemple d'indexation
const ragManager = new RagManager();
await ragManager.indexDocument({
  content: "Contenu du document",
  metadata: {
    source: "document.pdf",
    title: "Titre",
    page: 1,
  },
});
```

## 🎨 Développement UI

### Composants

- **Base** : Button, Card, Input, Dialog
- **Spécifiques** : AgentCard, ChatInterface, ToolList
- **Utilitaires** : cn() pour les classes CSS

### Style

- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants de base
- **Radix UI** pour l'accessibilité

## 🧪 Tests

### Structure des tests

```
packages/
├─ core/
│  └─ __tests__/
│     ├─ runtime/
│     ├─ tools/
│     └─ memory/
├─ rag/
│  └─ __tests__/
│     ├─ indexing/
│     └─ search/
└─ ui/
    └─ __tests__/
       └─ components/
```

### Exécuter les tests

```bash
# Tous les tests
pnpm test

# Tests d'un package spécifique
pnpm --filter @elavira/core test

# Tests en mode watch
pnpm test:watch
```

## 📦 Build et déploiement

### Build de production

```bash
# Construire tous les packages
pnpm build

# Build de l'application web
pnpm --filter @elavira/web build
```

### Docker

```bash
# Build de l'image
docker build -t elavira-agents .

# Lancer avec Docker Compose
docker-compose up -d
```

## 🔧 Configuration avancée

### Variables d'environnement

```bash
# Modèles IA
OLLAMA_BASE_URL=http://localhost:11434
MODEL_DEFAULT=qwen2.5:7b
EMBED_MODEL=nomic-embed-text

# Base de données
POSTGRES_URL=postgresql://user:pass@localhost:5432/elavira

# Sécurité
ALLOW_NETWORK=false
ALLOWED_DOMAINS=example.com,quebec.ca

# Performance
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
BATCH_SIZE=10
```

### Logging

```typescript
import { Logger } from '@elavira/core';

const logger = new Logger('MonModule');
logger.info('Message informatif');
logger.warn('Avertissement');
logger.error('Erreur', error);
```

## 🐛 Débogage

### Logs

- **Développement** : Logs dans la console
- **Production** : Logs structurés JSON
- **Niveaux** : DEBUG, INFO, WARN, ERROR

### Outils de débogage

- **Chrome DevTools** pour l'interface web
- **Node.js Inspector** pour le backend
- **Docker logs** pour les services

### Problèmes courants

1. **Ollama ne répond pas**
   ```bash
   curl http://localhost:11434/api/tags
   docker-compose restart ollama
   ```

2. **Base de données**
   ```bash
   docker-compose down
   docker volume rm elavira-agents_pgdata
   docker-compose up -d postgres
   ```

3. **Modèles manquants**
   ```bash
   ollama list
   ollama pull qwen2.5:7b
   ```

## 📚 Ressources

- [Documentation Ollama](https://ollama.ai/docs)
- [LanceDB Documentation](https://lancedb.github.io/lancedb/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche feature
3. **Développer** avec les bonnes pratiques
4. **Tester** localement
5. **Commiter** avec des messages clairs
6. **Pousser** et créer une Pull Request

### Standards de code

- **TypeScript** strict
- **ESLint** et **Prettier**
- **Conventional Commits**
- **Tests** pour les nouvelles fonctionnalités
- **Documentation** mise à jour

---

**Bonne contribution ! 🚀**
