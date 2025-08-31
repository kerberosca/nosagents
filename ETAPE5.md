# Étape 5 : Intégration de l'application web avec l'API worker

## 🎯 Objectif

Connecter l'interface web existante avec les services backend réels du worker, en remplaçant les données mockées par de vraies interactions avec l'API.

## ✅ Réalisations

### 1. Client API (`apps/web/src/lib/api.ts`)

- **ApiClient** : Classe pour gérer tous les appels API vers le worker
- **Interfaces TypeScript** : Définition des types pour les requêtes et réponses
- **Méthodes API** :
  - Jobs : `createJob`, `getJob`, `cancelJob`, `getQueueStats`
  - Agents : `executeAgent`, `getAgentStats`, `getAvailableModels`, `checkAgentHealth`
  - RAG : `indexFile`, `indexDirectory`, `searchRAG`, `getRAGStats`, `getSupportedExtensions`, `deleteDocument`, `clearRAGIndex`

### 2. Hooks React personnalisés (`apps/web/src/lib/hooks.ts`)

- **useAsyncState** : Hook générique pour gérer l'état de chargement et les erreurs
- **useJobs** : Gestion des jobs avec polling automatique
- **useAgents** : Gestion des agents et modèles disponibles
- **useRAG** : Gestion des opérations RAG (indexation, recherche, stats)
- **useChat** : Gestion du chat en temps réel avec les agents

### 3. Dashboard mis à jour (`apps/web/src/components/dashboard/dashboard.tsx`)

- **Statistiques réelles** : Utilise les vrais services au lieu des données mockées
- **État des services** : Affichage dynamique du statut des services (Ollama, PostgreSQL, LanceDB, Worker)
- **Activité récente** : Affichage des jobs récents avec leur statut
- **Gestion d'erreurs** : Affichage des erreurs de connexion

### 4. Interface de chat intégrée (`apps/web/src/components/chat/chat-interface.tsx`)

- **Agents réels** : Intégration avec les vrais agents via l'API
- **Chat en temps réel** : Utilisation du hook `useChat` pour les conversations
- **Gestion d'erreurs** : Affichage des erreurs de connexion et de communication
- **États de chargement** : Indicateurs visuels pendant l'exécution des agents

### 5. Gestionnaire de connaissances RAG (`apps/web/src/components/knowledge/knowledge-manager.tsx`)

- **Upload de fichiers** : Interface pour importer des documents dans la base RAG
- **Statistiques RAG** : Affichage des documents indexés, chunks, extensions supportées
- **Recherche RAG** : Interface de recherche dans les documents indexés
- **Gestion d'erreurs** : Affichage des erreurs d'indexation et de recherche

## 🔧 Fonctionnalités clés

### API Client
```typescript
// Exemple d'utilisation
const apiClient = new ApiClient('http://localhost:3001');

// Exécuter un agent
const response = await apiClient.executeAgent({
  agentId: 'assistant',
  message: 'Hello',
  context: {}
});

// Indexer un fichier
const result = await apiClient.indexFile(file, options);
```

### Hooks React
```typescript
// Exemple d'utilisation des hooks
const { messages, isTyping, sendMessage } = useChat();
const { stats, indexFile, search } = useRAG();
const { models, executeAgent } = useAgents();
```

### Gestion d'erreurs
- Affichage des erreurs de connexion
- Retry automatique pour les opérations échouées
- États de chargement pour une meilleure UX

## 📁 Structure des fichiers

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── api.ts          # Client API pour le worker
│   │   └── hooks.ts        # Hooks React personnalisés
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── dashboard.tsx           # Dashboard avec vrais services
│   │   ├── chat/
│   │   │   └── chat-interface.tsx      # Chat avec vrais agents
│   │   └── knowledge/
│   │       └── knowledge-manager.tsx   # Gestionnaire RAG
│   └── app/                # Pages Next.js
└── test-step5-simple.js    # Script de test
```

## 🚀 Utilisation

### 1. Configuration
Créer un fichier `.env.local` dans `apps/web/` :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Elavira Agents
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=development
```

### 2. Démarrage
```bash
# Dans le répertoire apps/web
pnpm dev
```

### 3. Test
```bash
# Tester l'intégration
node test-step5-simple.js
```

## 🔗 Intégration avec le worker

L'application web communique avec le worker via HTTP sur le port 3001 :

- **Jobs API** : `/api/jobs/*`
- **Agents API** : `/api/agents/*`
- **RAG API** : `/api/rag/*`

## 🎨 Interface utilisateur

- **Design moderne** : Utilise Tailwind CSS et shadcn/ui
- **Responsive** : S'adapte aux différentes tailles d'écran
- **États visuels** : Indicateurs de chargement, erreurs, succès
- **Accessibilité** : Support des raccourcis clavier et navigation

## 🔄 Flux de données

1. **Dashboard** : Charge les stats des services au démarrage
2. **Chat** : Envoie les messages via l'API worker, reçoit les réponses
3. **Connaissances** : Upload de fichiers → Indexation RAG → Recherche

## 🧪 Tests

Le script `test-step5-simple.js` valide :
- Configuration API
- Interfaces TypeScript
- Hooks React
- Composants mis à jour
- Structure des fichiers

## 📋 Prochaines étapes

1. **Tester l'intégration complète** avec le worker démarré
2. **Implémenter la gestion des agents** (CRUD via l'interface)
3. **Finaliser l'orchestration multi-agents** (Coordinator)
4. **Ajouter la gestion des workflows** (Workflows page)
5. **Tests end-to-end complets**

## ✨ Résultat

L'application web est maintenant entièrement intégrée avec le worker backend, permettant une interaction réelle avec les agents, le système RAG et les jobs, tout en conservant une interface utilisateur moderne et réactive.
