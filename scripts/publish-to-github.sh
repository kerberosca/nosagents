#!/bin/bash

# Script pour publier Elavira Agents sur GitHub
# Usage: ./scripts/publish-to-github.sh [repository-name]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Vérifier si le nom du repository est fourni
if [ -z "$1" ]; then
    print_error "Usage: $0 <repository-name>"
    print_error "Example: $0 elavira-agents"
    exit 1
fi

REPO_NAME=$1
GITHUB_USERNAME=$(git config user.name || echo "your-username")

print_step "🚀 Préparation de la publication sur GitHub"
print_message "Repository: $REPO_NAME"
print_message "Username: $GITHUB_USERNAME"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -f "pnpm-workspace.yaml" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet Elavira Agents"
    exit 1
fi

# Vérifier que Git est initialisé
if [ ! -d ".git" ]; then
    print_error "Git n'est pas initialisé. Exécutez 'git init' d'abord."
    exit 1
fi

print_step "📋 Vérification de l'état du repository"

# Vérifier s'il y a des changements non commités
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Il y a des changements non commités. Voulez-vous les commiter ? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "feat: prepare for GitHub publication"
        print_message "Changements commités"
    else
        print_error "Veuillez commiter vos changements avant de continuer"
        exit 1
    fi
fi

print_step "🔗 Configuration du remote GitHub"

# Vérifier si le remote existe déjà
if git remote get-url origin >/dev/null 2>&1; then
    print_warning "Le remote 'origin' existe déjà. Voulez-vous le remplacer ? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git remote remove origin
    else
        print_message "Utilisation du remote existant"
    fi
fi

# Ajouter le remote GitHub
if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    print_message "Remote GitHub ajouté: https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

print_step "📝 Mise à jour de la documentation"

# Mettre à jour les URLs dans le README
if [ -f "README.md" ]; then
    # Remplacer les URLs génériques par les vraies URLs
    sed -i.bak "s|votre-username|$GITHUB_USERNAME|g" README.md
    sed -i.bak "s|elavira-agents|$REPO_NAME|g" README.md
    rm README.md.bak 2>/dev/null || true
    print_message "README.md mis à jour avec les bonnes URLs"
fi

# Mettre à jour CONTRIBUTING.md
if [ -f "CONTRIBUTING.md" ]; then
    sed -i.bak "s|votre-username|$GITHUB_USERNAME|g" CONTRIBUTING.md
    sed -i.bak "s|elavira-agents|$REPO_NAME|g" CONTRIBUTING.md
    rm CONTRIBUTING.md.bak 2>/dev/null || true
    print_message "CONTRIBUTING.md mis à jour"
fi

print_step "🔧 Configuration Git"

# Configurer la branche principale
git branch -M main

# Configurer le push par défaut
git config push.default current

print_step "📤 Push vers GitHub"

# Pousser vers GitHub
print_message "Pushing vers GitHub..."
git push -u origin main

print_step "✅ Publication terminée !"

print_message "🎉 Votre projet Elavira Agents est maintenant sur GitHub !"
print_message "📋 URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
print_message "🌐 Clone URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

print_step "📋 Prochaines étapes recommandées"

echo "1. 🌟 Aller sur https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "2. 📝 Ajouter une description au repository"
echo "3. 🏷️ Ajouter des topics: ai-agents, rag, ollama, typescript, nextjs"
echo "4. 📄 Configurer GitHub Pages (optionnel)"
echo "5. 🔧 Configurer GitHub Actions pour CI/CD"
echo "6. 📦 Créer une release v1.0.0"

print_step "🔧 Configuration GitHub Actions (optionnel)"

if [ ! -d ".github/workflows" ]; then
    print_message "Création du dossier GitHub Actions..."
    mkdir -p .github/workflows
    
    # Créer un workflow CI basique
    cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: elavira_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run tests
      run: pnpm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/elavira_test
        REDIS_URL: redis://localhost:6379
    
    - name: Build
      run: pnpm build
EOF
    
    print_message "Workflow CI créé: .github/workflows/ci.yml"
    print_message "Commitez et poussez pour activer GitHub Actions"
fi

print_message "🎯 Votre projet Elavira Agents est prêt pour la collaboration !"
print_message "💡 N'oubliez pas de partager le lien avec votre communauté !"
