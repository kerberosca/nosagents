#!/bin/bash

echo "🚀 Configuration d'Elavira Agents..."

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm n'est pas installé. Installation en cours..."
    npm install -g pnpm
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker n'est pas installé. L'installation locale sera utilisée."
    USE_DOCKER=false
else
    USE_DOCKER=true
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
pnpm install

# Copier la configuration
if [ ! -f .env ]; then
    echo "⚙️  Configuration de l'environnement..."
    cp env.example .env
    echo "✅ Fichier .env créé. Veuillez le modifier selon vos besoins."
fi

# Créer les dossiers nécessaires
echo "📁 Création des dossiers de données..."
mkdir -p data/knowledge
mkdir -p data/vectors
mkdir -p sandbox

# Lancer les services avec Docker si disponible
if [ "$USE_DOCKER" = true ]; then
    echo "🐳 Lancement des services avec Docker..."
    docker-compose up -d postgres ollama
    
    echo "⏳ Attente du démarrage des services..."
    sleep 10
    
    # Vérifier que Ollama fonctionne
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        echo "✅ Ollama est prêt"
    else
        echo "⚠️  Ollama ne répond pas encore. Veuillez attendre quelques secondes."
    fi
else
    echo "⚠️  Docker non disponible. Veuillez lancer PostgreSQL et Ollama manuellement."
fi

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Modifiez le fichier .env selon vos besoins"
echo "2. Téléchargez des modèles Ollama :"
echo "   ollama pull qwen2.5:7b"
echo "   ollama pull nomic-embed-text"
echo "3. Lancez l'application :"
echo "   pnpm dev"
echo ""
echo "🌐 L'interface sera disponible sur http://localhost:3000"
