@echo off
echo ========================================================
echo Starting NoticePulse Full-Stack Application...
echo ========================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000
start "NoticePulse Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 2 >nul

echo [2/2] Launching Vite React Frontend on http://localhost:3000
start "NoticePulse Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Application is running!
echo Backend API Docs: http://127.0.0.1:8000/docs
echo Frontend Web UI: http://localhost:3000
echo ========================================================
pause
