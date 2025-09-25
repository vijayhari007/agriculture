# PowerShell script to run backend (Flask) and frontend (React) together
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\run-dev.ps1

$ErrorActionPreference = 'Stop'

# Determine project root (this script's directory)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Project root: $projectRoot"

# Backend: activate venv and run Flask API
$backendCmd = "cd `"$projectRoot`"; . .\.venv\Scripts\Activate.ps1; python backend/app.py"
Write-Host "Starting backend..."
Start-Process PowerShell -ArgumentList '-NoExit','-Command', $backendCmd

# Frontend: start React dev server
$frontendPath = Join-Path $projectRoot 'frontend'
$frontendCmd = "cd `"$frontendPath`"; npm start"
Write-Host "Starting frontend..."
Start-Process PowerShell -ArgumentList '-NoExit','-Command', $frontendCmd

Write-Host "Both backend and frontend were started in separate windows."
