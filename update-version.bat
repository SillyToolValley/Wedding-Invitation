@echo off
echo ===================================
echo Cache Busting Version Update
echo ===================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the update script
node update-version.js

echo.
echo ===================================
echo Version update completed!
echo ===================================
echo.
echo Remember to:
echo 1. Test the changes locally
echo 2. Commit and push to GitHub
echo.
pause