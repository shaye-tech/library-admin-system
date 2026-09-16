@echo off
title Library Management System - Starting

echo ========================================
echo    Library Management System
echo ========================================
echo.

cd /d "%~dp0"

if exist "node_modules" goto start

echo [Info] Dependencies not found, installing...
echo.
call npm install
if errorlevel 1 goto install_fail
echo.
echo [OK] Dependencies installed successfully!
echo.
goto start

:install_fail
echo.
echo [Error] Failed to install dependencies. Please check your network.
pause
exit /b 1

:start
echo [Starting] Launching dev server...
echo [Tip] Browser will open automatically. Press Ctrl+C to stop.
echo.

call npm run dev

pause
