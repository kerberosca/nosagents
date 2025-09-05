@echo off
echo Demarrage des services Elavira...
echo.

REM Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo ERREUR: Ce script doit etre execute depuis la racine du projet
    pause
    exit /b 1
)

echo Demarrage du Worker (Backend)...
start "Elavira Worker" cmd /k "cd /d %~dp0apps\worker && echo Demarrage du Worker... && npm run dev && pause"

REM Attendre un peu avant de démarrer la web app
echo Attente de 5 secondes...
timeout /t 5 /nobreak > nul

echo Demarrage de la Web App (Frontend)...
start "Elavira Web App" cmd /k "cd /d %~dp0apps\web && echo Demarrage de la Web App... && npm run dev && pause"

echo.
echo Services demarres !
echo Web App: http://localhost:3000
echo Worker API: http://localhost:3001
echo.
echo Les fenetres restent ouvertes pour voir les logs.
echo Fermez les fenetres pour arreter les services.
echo.
echo Appuyez sur une touche pour fermer ce script...
pause > nul
