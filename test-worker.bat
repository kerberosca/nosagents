@echo off
echo Test du Worker...
echo.

cd /d "%~dp0apps\worker"
echo Repertoire: %CD%
echo.

echo Test des dependances...
if exist "node_modules" (
    echo OK: node_modules existe
) else (
    echo ERREUR: node_modules manquant
    echo Installation des dependances...
    pnpm install
)

echo.
echo Demarrage du worker...
echo Les erreurs s'afficheront ici.
echo.
npm run dev

echo.
echo Le worker s'est arrete.
pause
