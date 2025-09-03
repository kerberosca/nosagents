#!/bin/bash

# Script pour démarrer le worker Elavira en local

echo "🚀 Démarrage du worker Elavira..."

# Vérifier si les services Docker sont démarrés
echo "📋 Vérification des services Docker..."
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo "❌ PostgreSQL n'est pas démarré. Lancement..."
    docker-compose up -d postgres redis ollama
    echo "⏳ Attente du démarrage de PostgreSQL..."
    sleep 10
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    pnpm install
fi

# Build du worker si nécessaire
if [ ! -d "apps/worker/dist" ]; then
    echo "🔨 Build du worker..."
    pnpm --filter=@elavira/worker build
fi

# Démarrer le worker
echo "🎯 Démarrage du worker sur le port 3001..."
cd apps/worker
pnpm dev
