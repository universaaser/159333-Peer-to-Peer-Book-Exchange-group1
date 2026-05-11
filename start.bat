@echo off
title BookSwap Launcher
color 0A

echo.
echo  ========================================
echo    BookSwap - P2P Book Exchange Platform
echo  ========================================
echo.
echo  Starting backend and frontend...
echo.

:: Start backend in a new window
start "BookSwap Backend (Port 5000)" cmd /k "color 0B && echo [Backend] Starting... && cd /d "%~dp0backend" && npm run dev"

:: Start frontend in a new window
start "BookSwap Frontend (Port 5173)" cmd /k "color 0E && echo [Frontend] Starting... && cd /d "%~dp0frontend" && npm run dev"

:: Wait for Vite to be ready (usually 3-4 seconds)
echo  Waiting for servers to start...
timeout /t 5 /nobreak > nul

:: Open browser
echo  Opening browser...
start http://localhost:5173

echo.
echo  ----------------------------------------
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173
echo  ----------------------------------------
echo.
echo  Close the backend/frontend windows to stop.
echo.
