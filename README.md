# 🤖 Elavira Agents

Une plateforme d'agents IA spécialisés, 100% locale et open-source, pour créer, configurer et orchestrer des agents intelligents avec un système RAG intégré.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.0+-orange.svg)](https://pnpm.io/)

## ✨ Fonctionnalités

- 🤖 **Agents IA spécialisés** - Créez et configurez des agents avec des rôles spécifiques
- 🔍 **Système RAG intégré** - Indexation et recherche de documents avec LanceDB
- 🎯 **Orchestration multi-agents** - Collaboration et délégation entre agents
- 🚀 **Coordinateur intelligent** - Gestion automatique des workflows et délégations
- 🌐 **Interface web moderne** - Interface utilisateur intuitive avec Next.js 15
- 🔒 **100% local** - Fonctionne entièrement hors ligne avec Ollama
- 📊 **Base de données robuste** - PostgreSQL avec Prisma ORM
- 🚀 **Architecture modulaire** - Monorepo TypeScript avec Turborepo
- 🛡️ **Sécurité granulaire** - Permissions par agent et par outil
- 🔄 **Fallback automatique** - Basculement intelligent entre modèles IA

## 🏗️ Architecture

```
Elavira Agents/
├── apps/
│   ├── web/                 # Interface Next.js 15
│   └── worker/              # API Express.js
├── packages/
│   ├── core/                # SDK des agents
│   ├── rag/                 # Système RAG
│   ├── ui/                  # Composants partagés
│   └── config/              # Configuration Zod
├── data/
│   ├── knowledge/           # Packs de connaissances
│   ├── vectors/             # Stockage LanceDB
│   └── workflows/           # Définitions YAML
└── agents/                  # Définitions d'agents
```

## 🚀 Installation rapide

### Prérequis

- **Node.js** 18+ 
- **pnpm** 8.0+
- **Docker** (pour PostgreSQL et Redis)
- **Ollama** (pour les modèles IA locaux)

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/elavira-agents.git
cd elavira-agents

# Installer les dépendances
pnpm install

# Copier la configuration
cp .env.example .env

# Démarrer les services
pnpm dev
```

L'application sera disponible sur `http://localhost:3000`

## 📖 Guide d'utilisation

### 1. Créer un agent

```yaml
# agents/assistant.yml
name: "Assistant IA"
role: "assistant"
description: "Assistant général pour répondre aux questions"
model: "llama2"
permissions:
  - rag.search
  - rag.answer
  - fs.read
tools:
  - name: "recherche"
    type: "rag.search"
    description: "Rechercher dans la base de connaissances"
```

### 2. Indexer des documents

```bash
# Via l'interface web
# Ou via l'API
curl -X POST http://localhost:3002/api/rag/ingest \
  -F "file=@document.pdf" \
  -F "pack=knowledge-base"
```

### 3. Orchestrer des agents

```yaml
# workflows/analyse-document.yml
name: "Analyse de document"
description: "Analyser un document avec plusieurs agents"
steps:
  - agent: "researcher"
    action: "extract_key_points"
  - agent: "writer"
    action: "summarize"
  - agent: "analyst"
    action: "generate_insights"
```

## 🛠️ Développement

### Structure du projet

```bash
# Installer les dépendances
pnpm install

# Lancer en mode développement
pnpm dev

# Lancer les tests
pnpm test

# Lancer les tests E2E
pnpm test:e2e

# Build de production
pnpm build
```

### Scripts disponibles

- `pnpm dev` - Démarre l'environnement de développement
- `pnpm build` - Build de production
- `pnpm test` - Tests unitaires
- `pnpm test:e2e` - Tests end-to-end
- `pnpm lint` - Vérification du code
- `pnpm format` - Formatage du code

## 🔧 Configuration

### Variables d'environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/elavira"

# Redis
REDIS_URL="redis://localhost:6379"

# Ollama
OLLAMA_BASE_URL="http://localhost:11434"

# Sécurité
ALLOW_NETWORK=false
JWT_SECRET="your-secret-key"
```

### Modèles Ollama requis

```bash
# Installer les modèles
ollama pull llama2
ollama pull llama2:7b
ollama pull nomic-embed-text
```

## 📚 Documentation

- [Guide des agents](./docs/agents.md)
- [Système RAG](./docs/rag.md)
- [Orchestration](./docs/orchestration.md)
- [API Reference](./docs/api.md)
- [Déploiement](./docs/deployment.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](./CONTRIBUTING.md).

### Comment contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Ollama](https://ollama.ai/) - Modèles IA locaux
- [LanceDB](https://lancedb.github.io/lancedb/) - Base de données vectorielle
- [Next.js](https://nextjs.org/) - Framework React
- [Prisma](https://www.prisma.io/) - ORM TypeScript
- [shadcn/ui](https://ui.shadcn.com/) - Composants UI

## 📞 Support

- 📧 Email: support@elavira-agents.com
- 💬 Discord: [Serveur Elavira](https://discord.gg/elavira)
- 🐛 Issues: [GitHub Issues](https://github.com/votre-username/elavira-agents/issues)

---

**Fait avec ❤️ par l'équipe Elavira Agents**
