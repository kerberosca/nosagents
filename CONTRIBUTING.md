# 🤝 Guide de contribution

Merci de votre intérêt pour contribuer à Elavira Agents ! Ce document vous guidera à travers le processus de contribution.

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Configuration de l'environnement](#configuration-de-lenvironnement)
- [Standards de code](#standards-de-code)
- [Tests](#tests)
- [Pull Request](#pull-request)
- [Rapport de bugs](#rapport-de-bugs)
- [Demande de fonctionnalité](#demande-de-fonctionnalité)

## 📜 Code de conduite

Ce projet et ses participants sont régis par notre Code de Conduite. En participant, vous acceptez de respecter ce code.

## 🚀 Comment contribuer

### Types de contributions

Nous accueillons différents types de contributions :

- 🐛 **Rapports de bugs** - Aidez-nous à identifier et corriger les problèmes
- 💡 **Demandes de fonctionnalités** - Proposez de nouvelles idées
- 📝 **Documentation** - Améliorez la documentation existante
- 🔧 **Corrections de bugs** - Corrigez des bugs existants
- ✨ **Nouvelles fonctionnalités** - Ajoutez de nouvelles fonctionnalités
- 🧪 **Tests** - Ajoutez ou améliorez les tests
- 🎨 **UI/UX** - Améliorez l'interface utilisateur

### Processus de contribution

1. **Fork** le repository
2. **Clone** votre fork localement
3. **Créez** une branche pour votre contribution
4. **Développez** votre fonctionnalité ou correction
5. **Testez** votre code
6. **Commitez** vos changements
7. **Poussez** vers votre fork
8. **Ouvrez** une Pull Request

## ⚙️ Configuration de l'environnement

### Prérequis

- Node.js 18+
- pnpm 8.0+
- Docker
- Ollama

### Installation

```bash
# Fork et clone le repository
git clone https://github.com/votre-username/elavira-agents.git
cd elavira-agents

# Installer les dépendances
pnpm install

# Copier la configuration
cp .env.example .env

# Démarrer les services
pnpm dev
```

### Structure du projet

```
elavira-agents/
├── apps/
│   ├── web/                 # Interface Next.js
│   └── worker/              # API Express.js
├── packages/
│   ├── core/                # SDK des agents
│   ├── rag/                 # Système RAG
│   ├── ui/                  # Composants partagés
│   └── config/              # Configuration
├── tests/                   # Tests E2E
└── docs/                    # Documentation
```

## 📏 Standards de code

### TypeScript

- Utilisez TypeScript strict
- Définissez des types explicites
- Évitez `any` autant que possible
- Utilisez des interfaces pour les objets

```typescript
// ✅ Bon
interface AgentConfig {
  name: string;
  role: string;
  model: string;
}

// ❌ Éviter
const config: any = { name: "agent" };
```

### Nommage

- **Variables** : camelCase
- **Fonctions** : camelCase
- **Classes** : PascalCase
- **Interfaces** : PascalCase
- **Types** : PascalCase
- **Constantes** : UPPER_SNAKE_CASE

### Formatage

Nous utilisons Prettier pour le formatage automatique :

```bash
# Formater le code
pnpm format

# Vérifier le formatage
pnpm lint
```

### Commits

Utilisez des messages de commit conventionnels :

```
feat: ajouter la fonctionnalité de recherche RAG
fix: corriger le bug de connexion à la base de données
docs: mettre à jour la documentation des agents
test: ajouter des tests pour le système RAG
refactor: refactoriser le gestionnaire d'agents
```

## 🧪 Tests

### Tests unitaires

```bash
# Lancer tous les tests
pnpm test

# Lancer les tests d'un package spécifique
pnpm --filter @elavira/core test

# Lancer les tests en mode watch
pnpm test:watch
```

### Tests E2E

```bash
# Lancer les tests E2E
pnpm test:e2e

# Lancer un test spécifique
node tests/simple-test.js
```

### Couverture de code

```bash
# Générer le rapport de couverture
pnpm test:coverage
```

## 🔄 Pull Request

### Avant de soumettre

- [ ] Votre code suit les standards de code
- [ ] Vous avez ajouté des tests pour les nouvelles fonctionnalités
- [ ] Tous les tests passent
- [ ] Vous avez mis à jour la documentation si nécessaire
- [ ] Votre code est documenté

### Template de Pull Request

```markdown
## Description

Brève description des changements apportés.

## Type de changement

- [ ] Bug fix (changement non-breaking qui corrige un problème)
- [ ] Nouvelle fonctionnalité (changement non-breaking qui ajoute une fonctionnalité)
- [ ] Breaking change (correction ou fonctionnalité qui cause un changement incompatible)
- [ ] Documentation (mise à jour de la documentation)

## Tests

- [ ] J'ai ajouté des tests qui prouvent que ma correction fonctionne
- [ ] J'ai ajouté des tests pour les nouvelles fonctionnalités
- [ ] Tous les tests existants passent

## Checklist

- [ ] Mon code suit les guidelines de style de ce projet
- [ ] J'ai effectué une auto-révision de mon propre code
- [ ] J'ai commenté mon code, particulièrement dans les zones difficiles à comprendre
- [ ] J'ai apporté les changements correspondants à la documentation
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] J'ai ajouté des tests qui prouvent que ma correction fonctionne ou que ma fonctionnalité fonctionne
- [ ] Les tests unitaires et d'intégration passent localement avec mes changements
- [ ] J'ai mis à jour les dépendances si nécessaire

## Screenshots (si applicable)

Ajoutez des captures d'écran pour les changements UI.

## Informations supplémentaires

Toute information supplémentaire ou contexte nécessaire.
```

## 🐛 Rapport de bugs

### Avant de rapporter un bug

1. Vérifiez que le bug n'a pas déjà été rapporté
2. Essayez de reproduire le bug avec la dernière version
3. Vérifiez que le bug n'est pas lié à votre configuration

### Template de rapport de bug

```markdown
## Description du bug

Description claire et concise du bug.

## Étapes pour reproduire

1. Aller à '...'
2. Cliquer sur '...'
3. Faire défiler jusqu'à '...'
4. Voir l'erreur

## Comportement attendu

Description claire de ce qui devrait se passer.

## Comportement actuel

Description de ce qui se passe actuellement.

## Screenshots

Si applicable, ajoutez des captures d'écran pour expliquer votre problème.

## Environnement

- OS: [ex: Windows 11, macOS 14, Ubuntu 22.04]
- Node.js: [ex: 18.17.0]
- pnpm: [ex: 8.15.0]
- Ollama: [ex: 0.1.29]

## Informations supplémentaires

Toute autre information ou contexte sur le problème.
```

## 💡 Demande de fonctionnalité

### Template de demande de fonctionnalité

```markdown
## Problème résolu

Description claire et concise du problème que cette fonctionnalité résoudrait.

## Solution proposée

Description claire et concise de ce que vous voulez qu'il se passe.

## Alternatives considérées

Description claire et concise de toutes les solutions alternatives ou fonctionnalités que vous avez considérées.

## Informations supplémentaires

Toute autre information ou captures d'écran sur la demande de fonctionnalité.
```

## 🏷️ Labels

Nous utilisons les labels suivants pour organiser les issues :

- `bug` - Quelque chose ne fonctionne pas
- `enhancement` - Nouvelle fonctionnalité ou amélioration
- `documentation` - Amélioration de la documentation
- `good first issue` - Bon pour les nouveaux contributeurs
- `help wanted` - Besoin d'aide
- `priority: high` - Priorité élevée
- `priority: medium` - Priorité moyenne
- `priority: low` - Priorité faible

## 📞 Support

Si vous avez des questions ou besoin d'aide :

- 📧 Email: support@elavira-agents.com
- 💬 Discord: [Serveur Elavira](https://discord.gg/elavira)
- 🐛 Issues: [GitHub Issues](https://github.com/votre-username/elavira-agents/issues)

## 🙏 Remerciements

Merci de contribuer à Elavira Agents ! Votre contribution aide à rendre cette plateforme meilleure pour tous.

---

**Ensemble, construisons l'avenir des agents IA ! 🚀**
