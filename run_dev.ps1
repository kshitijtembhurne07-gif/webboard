Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting NoticePulse Full-Stack Application..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000" -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\backend'; python main.py"

Start-Sleep -Seconds 2

Write-Host "[2/2] Launching Vite React Frontend on http://localhost:3000" -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\frontend'; npm.cmd run dev"

Write-Host "`nApplication is starting up!" -ForegroundColor Green
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "Frontend Web UI: http://localhost:3000" -ForegroundColor White
