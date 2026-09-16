@echo off
title Library Management System - Building

cd /d "%~dp0"

echo ========================================
echo    Library Management System - Build
echo ========================================
echo.
echo [Building] Creating production build...
echo.

call npm run build
if errorlevel 1 goto build_fail

echo.
echo ========================================
echo [OK] Build successful! Output in dist folder
echo ========================================
echo.
pause
exit /b 0

:build_fail
echo.
echo [Error] Build failed!
pause
exit /b 1
