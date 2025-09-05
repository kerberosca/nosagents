@echo off
chcp 65001 >nul
echo Configuration de l'environnement de developpement Elavira...
echo.

REM Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo Erreur: Ce script doit etre execute depuis la racine du projet
    pause
    exit /b 1
)

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo Erreur: Node.js n'est pas installe ou pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js detecte
node --version

REM Vérifier que pnpm est installé
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo Installation de pnpm...
    npm install -g pnpm
    if errorlevel 1 (
        echo Erreur: Impossible d'installer pnpm
        pause
        exit /b 1
    )
)

echo pnpm detecte
pnpm --version
echo.

REM Installer les dépendances racine
echo Installation des dependances racine...
call pnpm install
if errorlevel 1 (
    echo Erreur lors de l'installation des dependances racine
    pause
    exit /b 1
)

echo Dependances racine installees
echo.

REM Build des packages core
echo Build du package core...
cd /d "%~dp0packages\core"
call pnpm run build
if errorlevel 1 (
    echo Erreur lors du build du package core
    pause
    exit /b 1
)
cd /d "%~dp0"

echo Package core builde
echo.

REM Build des autres packages
echo Build du package config...
cd /d "%~dp0packages\config"
call pnpm run build
if errorlevel 1 (
    echo Erreur lors du build du package config
    pause
    exit /b 1
)
cd /d "%~dp0"

echo Build du package rag...
cd /d "%~dp0packages\rag"
call pnpm run build
if errorlevel 1 (
    echo Erreur lors du build du package rag
    pause
    exit /b 1
)
cd /d "%~dp0"

echo Build du package ui...
cd /d "%~dp0packages\ui"
call pnpm run build
if errorlevel 1 (
    echo Erreur lors du build du package ui
    pause
    exit /b 1
)
cd /d "%~dp0"

echo Tous les packages buildees
echo.

REM Installer et build le worker
echo Configuration du worker...
cd /d "%~dp0apps\worker"
call pnpm install
if errorlevel 1 (
    echo Erreur lors de l'installation des dependances du worker
    pause
    exit /b 1
)

call pnpm run build
if errorlevel 1 (
    echo Erreur lors du build du worker
    pause
    exit /b 1
)
cd /d "%~dp0"

echo Worker configure
echo.

REM Installer et build la web app
echo Configuration de la web app...
cd /d "%~dp0apps\web"
call pnpm install
if errorlevel 1 (
    echo Erreur lors de l'installation des dependances de la web app
    pause
    exit /b 1
)

call pnpm run build
if errorlevel 1 (
    echo Erreur lors du build de la web app
    pause
    exit /b 1
)
cd /d "%~dp0"

echo Web app configuree
echo.

REM Générer le client Prisma
echo Generation du client Prisma...
cd /d "%~dp0packages\core"
call npx prisma generate
if errorlevel 1 (
    echo Erreur lors de la generation du client Prisma
    pause
    exit /b 1
)
cd /d "%~dp0"

echo Client Prisma genere
echo.

echo Configuration terminee avec succes !
echo.
echo Resume :
echo   - Dependances installees
echo   - Packages buildees
echo   - Worker configure
echo   - Web app configuree
echo   - Client Prisma genere
echo.
echo Vous pouvez maintenant utiliser :
echo   - start-dev.bat pour demarrer les services
echo   - stop-dev.ps1 pour arreter les services
echo.
echo Appuyez sur une touche pour fermer...
pause > nul
