@echo off
echo ========================================
echo Digital Catalog AI Agent - Quick Start
echo ========================================
echo Starting your AI-powered catalog system...
echo.

REM Check if Python and Node.js are available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 14+
    pause
    exit /b 1
)

echo Python and Node.js found!
echo.

REM Start the complete setup
echo Running quick setup...
python quick_start.py

pause