# Script de configuration de l'environnement de développement Elavira
# Usage: .\setup-dev.ps1

Write-Host "🚀 Configuration de l'environnement de développement Elavira..." -ForegroundColor Green
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour fermer"
    exit 1
}

# Vérifier que Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour fermer"
    exit 1
}

# Vérifier que pnpm est installé
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm détecté: v$pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installation de pnpm..." -ForegroundColor Yellow
    try {
        npm install -g pnpm
        Write-Host "✅ pnpm installé avec succès" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur: Impossible d'installer pnpm" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour fermer"
        exit 1
    }
}

Write-Host ""

# Fonction pour exécuter une commande avec gestion d'erreur
function Invoke-Command {
    param(
        [string]$Command,
        [string]$WorkingDirectory = ".",
        [string]$Description = ""
    )
    
    if ($Description) {
        Write-Host "📦 $Description..." -ForegroundColor Yellow
    }
    
    try {
        Push-Location $WorkingDirectory
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Commande échouée avec le code $LASTEXITCODE"
        }
        Write-Host "✅ Succès" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur: $_" -ForegroundColor Red
        Pop-Location
        Read-Host "Appuyez sur Entrée pour fermer"
        exit 1
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# Installer les dépendances racine
Invoke-Command -Command "pnpm install" -Description "Installation des dépendances racine"

# Build des packages
Invoke-Command -Command "pnpm run build" -WorkingDirectory "packages\core" -Description "Build du package core"
Invoke-Command -Command "pnpm run build" -WorkingDirectory "packages\config" -Description "Build du package config"
Invoke-Command -Command "pnpm run build" -WorkingDirectory "packages\rag" -Description "Build du package rag"
Invoke-Command -Command "pnpm run build" -WorkingDirectory "packages\ui" -Description "Build du package ui"

# Configuration du worker
Invoke-Command -Command "pnpm install" -WorkingDirectory "apps\worker" -Description "Installation des dépendances du worker"
Invoke-Command -Command "pnpm run build" -WorkingDirectory "apps\worker" -Description "Build du worker"

# Configuration de la web app
Invoke-Command -Command "pnpm install" -WorkingDirectory "apps\web" -Description "Installation des dépendances de la web app"
Invoke-Command -Command "pnpm run build" -WorkingDirectory "apps\web" -Description "Build de la web app"

# Générer le client Prisma
Invoke-Command -Command "npx prisma generate" -WorkingDirectory "packages\core" -Description "Génération du client Prisma"

Write-Host "🎉 Configuration terminée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Résumé :" -ForegroundColor Cyan
Write-Host "  ✅ Dépendances installées" -ForegroundColor Green
Write-Host "  ✅ Packages buildés" -ForegroundColor Green
Write-Host "  ✅ Worker configuré" -ForegroundColor Green
Write-Host "  ✅ Web app configurée" -ForegroundColor Green
Write-Host "  ✅ Client Prisma généré" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Vous pouvez maintenant utiliser :" -ForegroundColor Cyan
Write-Host "  - start-dev.bat pour démarrer les services" -ForegroundColor Yellow
Write-Host "  - stop-dev.ps1 pour arrêter les services" -ForegroundColor Yellow
Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer"
