@echo off
echo Configuration simple de Elavira...
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
echo Installation des dependances racine...
pnpm install

echo.
echo Build du package core...
cd packages\core
pnpm run build
cd ..\..

echo.
echo Build du package config...
cd packages\config
pnpm run build
cd ..\..

echo.
echo Build du package rag...
cd packages\rag
pnpm run build
cd ..\..

echo.
echo Build du package ui...
cd packages\ui
pnpm run build
cd ..\..

echo.
echo Configuration du worker...
cd apps\worker
pnpm install
pnpm run build
cd ..\..

echo.
echo Configuration de la web app...
cd apps\web
pnpm install
pnpm run build
cd ..\..

echo.
echo Generation Prisma...
cd packages\core
npx prisma generate
cd ..\..

echo.
echo TERMINE !
echo.
echo Pour demarrer: start-dev.bat
echo.
pause
