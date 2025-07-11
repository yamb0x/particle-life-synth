@echo off
REM Comprehensive Particle Life System - Auto Launcher for Windows
REM This batch file handles everything needed to run the system

echo ================================================
echo 🚀 Comprehensive Particle Life System Launcher
echo ================================================

REM Get the directory of this script
cd /d "%~dp0"

REM Check if TypeScript needs compilation
if not exist "src\core\ComprehensiveParticleSystem.js" (
    echo 📦 TypeScript files need compilation...
    goto :compile
)

REM Check if TypeScript files are newer than JavaScript files
for %%i in (src\core\ComprehensiveParticleSystem.ts) do set TS_TIME=%%~ti
for %%i in (src\core\ComprehensiveParticleSystem.js) do set JS_TIME=%%~ti
if "%TS_TIME%" GTR "%JS_TIME%" (
    echo 📦 TypeScript files have been updated, recompiling...
    goto :compile
) else (
    echo ✅ JavaScript files are up to date
    goto :startserver
)

:compile
REM Check if TypeScript is installed
where tsc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ TypeScript compiler found, compiling...
    call tsc -p tsconfig-comprehensive.json
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Compilation successful!
    ) else (
        echo ⚠️  Compilation had errors but continuing anyway...
    )
) else (
    echo ⚠️  TypeScript compiler not found.
    echo    To install: npm install -g typescript
    echo    Continuing with existing JavaScript files...
)

:startserver
REM Find an available port
set PORT=8080
:findport
netstat -an | find ":%PORT%" >nul
if %ERRORLEVEL% EQU 0 (
    echo Port %PORT% is in use, trying next port...
    set /a PORT=%PORT%+1
    goto :findport
)

echo.
echo 🌐 Starting web server on port %PORT%...
echo.

REM Start browser after a delay
start /b cmd /c "timeout /t 2 >nul && start http://localhost:%PORT%/index-comprehensive.html"

echo ================================================
echo ✨ Server running at:
echo    http://localhost:%PORT%/index-comprehensive.html
echo.
echo 📌 Controls:
echo    • Press 'C' to toggle parameter panel
echo    • Press 'R' to reset particles
echo    • Press '1-5' to load presets
echo    • Click to create pulse effects
echo.
echo 🛑 Press Ctrl+C to stop the server
echo ================================================
echo.

REM Check Python installation and start server
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python --version 2>&1 | find "Python 3" >nul
    if %ERRORLEVEL% EQU 0 (
        python -m http.server %PORT%
    ) else (
        python -m SimpleHTTPServer %PORT%
    )
) else (
    where py >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        py -3 -m http.server %PORT%
    ) else (
        echo ❌ Error: Python is required to run the web server
        echo Please install Python 3 from https://www.python.org/
        pause
        exit /b 1
    )
)