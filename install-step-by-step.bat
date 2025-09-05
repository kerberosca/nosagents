@echo off
echo Installation etape par etape de Elavira...
echo.

:menu
echo.
echo Choisissez une etape:
echo 1. Installer dependances racine
echo 2. Build package core
echo 3. Build package config
echo 4. Build package rag
echo 5. Build package ui
echo 6. Installer et build worker
echo 7. Installer et build web app
echo 8. Generer Prisma
echo 9. Tout faire
echo 0. Quitter
echo.
set /p choice="Votre choix (0-9): "

if "%choice%"=="1" goto step1
if "%choice%"=="2" goto step2
if "%choice%"=="3" goto step3
if "%choice%"=="4" goto step4
if "%choice%"=="5" goto step5
if "%choice%"=="6" goto step6
if "%choice%"=="7" goto step7
if "%choice%"=="8" goto step8
if "%choice%"=="9" goto all
if "%choice%"=="0" goto end
goto menu

:step1
echo Installation dependances racine...
pnpm install
pause
goto menu

:step2
echo Build package core...
cd packages\core
pnpm run build
cd ..\..
pause
goto menu

:step3
echo Build package config...
cd packages\config
pnpm run build
cd ..\..
pause
goto menu

:step4
echo Build package rag...
cd packages\rag
pnpm run build
cd ..\..
pause
goto menu

:step5
echo Build package ui...
cd packages\ui
pnpm run build
cd ..\..
pause
goto menu

:step6
echo Configuration worker...
cd apps\worker
pnpm install
pnpm run build
cd ..\..
pause
goto menu

:step7
echo Configuration web app...
cd apps\web
pnpm install
pnpm run build
cd ..\..
pause
goto menu

:step8
echo Generation Prisma...
cd packages\core
npx prisma generate
cd ..\..
pause
goto menu

:all
echo Installation complete...
call install-all.bat
goto end

:end
echo Au revoir!
pause
