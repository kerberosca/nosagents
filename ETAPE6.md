# Étape 6 : Gestion complète des agents (CRUD via l'interface)

## 🎯 Objectif

Implémenter la gestion complète des agents via l'interface web, permettant de créer, modifier, supprimer et configurer les agents directement depuis l'UI.

## ✅ Réalisations

### 1. Interfaces TypeScript étendues (`apps/web/src/lib/api.ts`)

- **Agent** : Interface complète pour représenter un agent
- **CreateAgentRequest** : Interface pour la création d'agents
- **UpdateAgentRequest** : Interface pour la modification d'agents
- **Méthodes API CRUD** :
  - `getAgents()` : Récupérer tous les agents
  - `getAgent(id)` : Récupérer un agent spécifique
  - `createAgent(data)` : Créer un nouvel agent
  - `updateAgent(data)` : Mettre à jour un agent
  - `deleteAgent(id)` : Supprimer un agent
  - `getAvailableTools()` : Récupérer les outils disponibles

### 2. Hook useAgents étendu (`apps/web/src/lib/hooks.ts`)

- **État des agents** : Gestion de la liste des agents
- **Méthodes CRUD** : `getAgents`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`
- **Gestion des outils** : `getTools` pour récupérer les outils disponibles
- **Gestion d'erreurs** : États de chargement et erreurs pour chaque opération

### 3. Composant AgentForm (`apps/web/src/components/agents/agent-form.tsx`)

- **Formulaire complet** : Tous les champs nécessaires pour configurer un agent
- **Validation** : Validation des champs obligatoires
- **Sélection dynamique** : Modèles IA, outils, packs de connaissances
- **Gestion des permissions** : Switches pour réseau et système de fichiers
- **Mode édition** : Réutilisation pour créer et modifier les agents

### 4. Composant AgentList (`apps/web/src/components/agents/agent-list.tsx`)

- **Liste interactive** : Affichage de tous les agents avec actions
- **Actions CRUD** : Boutons pour modifier, supprimer, chatter
- **Avatars dynamiques** : Emojis selon le rôle de l'agent
- **Confirmation de suppression** : Dialog de confirmation pour la suppression
- **États de chargement** : Indicateurs visuels pendant les opérations

### 5. Page agents mise à jour (`apps/web/src/app/agents/page.tsx`)

- **Intégration complète** : Utilisation des hooks et composants
- **Formulaire modal** : Dialog pour créer/modifier les agents
- **Gestion d'état** : États pour le formulaire et les opérations
- **Navigation** : Redirection vers le chat avec un agent spécifique
- **Gestion d'erreurs** : Affichage des erreurs de l'API

### 6. Interface de chat intégrée (`apps/web/src/components/chat/chat-interface.tsx`)

- **Agents réels** : Utilisation des vrais agents au lieu des données mockées
- **Sélection dynamique** : Chargement automatique des agents disponibles
- **Gestion des états** : Affichage si aucun agent n'est disponible
- **Navigation** : Lien vers la page agents si nécessaire

## 🔧 Fonctionnalités clés

### Formulaire d'agent
```typescript
// Exemple de création d'agent
const agentData: CreateAgentRequest = {
  name: 'Assistant Cuisinier',
  description: 'Aide à la planification de menus',
  role: 'Cuisinier',
  model: 'qwen2.5:7b',
  systemPrompt: 'Tu es un assistant cuisinier...',
  tools: ['rag.search', 'rag.answer'],
  permissions: {
    network: false,
    filesystem: true,
    tools: ['rag.search']
  },
  knowledgePacks: ['recettes']
};
```

### Gestion des agents
```typescript
// Exemple d'utilisation des hooks
const { 
  agents, 
  createAgent, 
  updateAgent, 
  deleteAgent 
} = useAgents();

// Créer un agent
await createAgent(agentData);

// Modifier un agent
await updateAgent({ id: 'agent-1', name: 'Nouveau nom' });

// Supprimer un agent
await deleteAgent('agent-1');
```

### Interface utilisateur
- **Design moderne** : Utilise shadcn/ui avec Tailwind CSS
- **Responsive** : S'adapte aux différentes tailles d'écran
- **Accessibilité** : Support des raccourcis clavier et navigation
- **États visuels** : Indicateurs de chargement, erreurs, succès

## 📁 Structure des fichiers

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── api.ts                    # Interfaces et API CRUD étendues
│   │   └── hooks.ts                  # Hook useAgents étendu
│   ├── components/
│   │   ├── agents/
│   │   │   ├── agent-form.tsx        # Formulaire CRUD
│   │   │   └── agent-list.tsx        # Liste avec actions
│   │   └── chat/
│   │       └── chat-interface.tsx    # Intégration vrais agents
│   └── app/
│       └── agents/
│           └── page.tsx              # Page mise à jour
└── test-step6-simple.js              # Script de test
```

## 🚀 Utilisation

### 1. Créer un agent
1. Aller sur la page `/agents`
2. Cliquer sur "Nouvel agent"
3. Remplir le formulaire avec les informations de l'agent
4. Configurer les outils et permissions
5. Sauvegarder

### 2. Modifier un agent
1. Dans la liste des agents, cliquer sur "Modifier"
2. Le formulaire s'ouvre avec les données actuelles
3. Modifier les champs souhaités
4. Sauvegarder les modifications

### 3. Supprimer un agent
1. Dans la liste des agents, cliquer sur "Supprimer"
2. Confirmer la suppression dans le dialog
3. L'agent est supprimé définitivement

### 4. Chatter avec un agent
1. Dans la liste des agents, cliquer sur "Chat"
2. Ou aller sur `/chat` et sélectionner un agent
3. Commencer la conversation

## 🔗 Intégration avec le worker

L'interface web communique avec le worker via les nouvelles routes API :

- **GET** `/api/agents` - Liste tous les agents
- **GET** `/api/agents/:id` - Récupère un agent spécifique
- **POST** `/api/agents` - Crée un nouvel agent
- **PUT** `/api/agents/:id` - Met à jour un agent
- **DELETE** `/api/agents/:id` - Supprime un agent
- **GET** `/api/agents/tools` - Liste les outils disponibles

## 🎨 Interface utilisateur

### Formulaire d'agent
- **Champs obligatoires** : Nom, description, rôle, modèle, prompt système
- **Sélections dynamiques** : Modèles IA, outils, packs de connaissances
- **Permissions** : Switches pour réseau et système de fichiers
- **Validation** : Vérification des champs obligatoires

### Liste des agents
- **Affichage complet** : Nom, rôle, description, modèle, outils
- **Actions rapides** : Chat, modifier, supprimer
- **Avatars** : Emojis selon le rôle de l'agent
- **États** : Indicateurs de chargement et erreurs

## 🔄 Flux de données

1. **Chargement** : `getAgents()` → Affichage de la liste
2. **Création** : Formulaire → `createAgent()` → Mise à jour de la liste
3. **Modification** : Formulaire → `updateAgent()` → Mise à jour de la liste
4. **Suppression** : Confirmation → `deleteAgent()` → Mise à jour de la liste
5. **Chat** : Sélection → Navigation vers `/chat?agent=id`

## 🧪 Tests

Le script `test-step6-simple.js` valide :
- Interfaces TypeScript pour les agents
- Méthodes API CRUD
- Hooks React étendus
- Composants créés
- Fonctionnalités implémentées
- Structure des fichiers

## 📋 Prochaines étapes

1. **Tester l'intégration complète** avec le worker démarré
2. **Finaliser l'orchestration multi-agents** (Coordinator)
3. **Ajouter la gestion des workflows** (Workflows page)
4. **Implémenter la gestion des connaissances** (Knowledge packs)
5. **Tests end-to-end complets**

## ✨ Résultat

L'interface web permet maintenant une gestion complète des agents via l'UI, avec création, modification, suppression et configuration complète. Les agents sont intégrés dans le chat et toutes les opérations sont synchronisées avec le worker backend.
