@echo off
echo Test de la Web App...
echo.

cd /d "%~dp0apps\web"
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
echo Demarrage de la web app...
echo Les erreurs s'afficheront ici.
echo.
npm run dev

echo.
echo La web app s'est arretee.
pause
