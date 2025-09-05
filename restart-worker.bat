@echo off
echo Redemarrage du worker avec les nouvelles modifications...
echo.

REM Arreter le worker s'il tourne
echo Arret du worker...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Elavira Worker*" 2>nul

REM Attendre un peu
timeout /t 2 /nobreak > nul

REM Redemarrer le worker
echo Redemarrage du worker...
cd apps\worker
start "Elavira Worker" cmd /k "echo Redemarrage du Worker... && npm run dev && pause"
cd ..\..

echo Worker redemarre !
echo.
pause
