# Script pour arrêter tous les services de développement
# Usage: .\stop-dev.ps1

Write-Host "🛑 Arrêt des services Elavira..." -ForegroundColor Red

# Arrêter les processus Node.js liés au projet
$processes = Get-Process | Where-Object { 
    $_.ProcessName -eq "node" -and 
    ($_.CommandLine -like "*apps/worker*" -or $_.CommandLine -like "*apps/web*")
}

if ($processes) {
    Write-Host "📦 Arrêt de $($processes.Count) processus Node.js..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Write-Host "✅ Processus arrêtés" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun processus de développement trouvé" -ForegroundColor Blue
}

# Arrêter les fenêtres PowerShell avec "Elavira" dans le titre
$windows = Get-Process | Where-Object { 
    $_.ProcessName -eq "powershell" -and 
    $_.MainWindowTitle -like "*Elavira*"
}

if ($windows) {
    Write-Host "🪟 Fermeture des fenêtres de développement..." -ForegroundColor Yellow
    $windows | Stop-Process -Force
    Write-Host "✅ Fenêtres fermées" -ForegroundColor Green
}

Write-Host "🏁 Tous les services ont été arrêtés" -ForegroundColor Green
