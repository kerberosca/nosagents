@echo off
echo Installation complete de Elavira...
echo.

REM Vérifier Node.js
node --version
if errorlevel 1 (
    echo ERREUR: Node.js non trouve
    pause
    exit /b 1
)

REM Vérifier pnpm
pnpm --version
if errorlevel 1 (
    echo Installation de pnpm...
    npm install -g pnpm
)

echo.
echo ========================================
echo ETAPE 1: Installation dependances racine
echo ========================================
pnpm install
if errorlevel 1 (
    echo ERREUR: Echec installation dependances racine
    pause
    exit /b 1
)

echo.
echo ========================================
echo ETAPE 2: Build package core
echo ========================================
cd packages\core
pnpm run build
if errorlevel 1 (
    echo ERREUR: Echec build core
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo ETAPE 3: Build package config
echo ========================================
cd packages\config
pnpm run build
if errorlevel 1 (
    echo ERREUR: Echec build config
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo ETAPE 4: Build package rag
echo ========================================
cd packages\rag
pnpm run build
if errorlevel 1 (
    echo ERREUR: Echec build rag
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo ETAPE 5: Build package ui
echo ========================================
cd packages\ui
pnpm run build
if errorlevel 1 (
    echo ERREUR: Echec build ui
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo ETAPE 6: Configuration worker
echo ========================================
cd apps\worker
pnpm install
if errorlevel 1 (
    echo ERREUR: Echec installation worker
    pause
    exit /b 1
)
pnpm run build
if errorlevel 1 (
    echo ERREUR: Echec build worker
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo ETAPE 7: Configuration web app
echo ========================================
cd apps\web
pnpm install
if errorlevel 1 (
    echo ERREUR: Echec installation web app
    pause
    exit /b 1
)
pnpm run build
if errorlevel 1 (
    echo ERREUR: Echec build web app
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo ETAPE 8: Generation Prisma
echo ========================================
cd packages\core
npx prisma generate
if errorlevel 1 (
    echo ERREUR: Echec generation Prisma
    pause
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo INSTALLATION TERMINEE AVEC SUCCES !
echo ========================================
echo.
echo Vous pouvez maintenant utiliser:
echo   - start-dev.bat pour demarrer les services
echo.
pause
