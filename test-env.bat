@echo off
echo Test de l'environnement...
echo.

echo Repertoire actuel:
cd

echo.
echo Test Node.js:
node --version
if errorlevel 1 (
    echo ERREUR: Node.js non trouve
) else (
    echo OK: Node.js fonctionne
)

echo.
echo Test npm:
npm --version
if errorlevel 1 (
    echo ERREUR: npm non trouve
) else (
    echo OK: npm fonctionne
)

echo.
echo Test pnpm:
pnpm --version
if errorlevel 1 (
    echo ERREUR: pnpm non trouve
) else (
    echo OK: pnpm fonctionne
)

echo.
echo Test des repertoires:
if exist "package.json" (
    echo OK: package.json trouve
) else (
    echo ERREUR: package.json non trouve
)

if exist "packages\core" (
    echo OK: packages\core existe
) else (
    echo ERREUR: packages\core non trouve
)

if exist "apps\worker" (
    echo OK: apps\worker existe
) else (
    echo ERREUR: apps\worker non trouve
)

if exist "apps\web" (
    echo OK: apps\web existe
) else (
    echo ERREUR: apps\web non trouve
)

echo.
echo Test termine.
pause
