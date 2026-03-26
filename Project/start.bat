@echo off
setlocal EnableDelayedExpansion
title ThiranMitra — Starting...

echo.
echo ====================================================
echo    ThiranMitra ^| AI Employment Platform
echo    Version 1.0  ^|  India's Career Ecosystem
echo ====================================================
echo.

:: ── Check Python ───────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.x not found!
    echo Please install Python from https://python.org
    echo Make sure to tick "Add to PATH" during installation.
    pause
    exit /b 1
)

echo [OK] Python found!

:: ── Auto-install dependencies ────────────────────────────
python -c "import flask, flask_cors, jwt, bcrypt" >nul 2>&1
if errorlevel 1 (
    echo [INSTALL] Installing required packages...
    pip install flask flask-cors PyJWT bcrypt
    if errorlevel 1 (
        echo [ERROR] Failed to install packages.
        echo Run manually: pip install flask flask-cors PyJWT bcrypt
        pause
        exit /b 1
    )
    echo [OK] Packages installed!
) else (
    echo [OK] All packages ready!
)

echo.
echo ====================================================
echo  [SERVER]  Starting Flask on http://localhost:5000
echo  [DB]      Initialising database...
echo  [BROWSER] Opening in 3 seconds...
echo  [TIP]     Even without server, the site works!
echo            Register/Login stored locally if server
echo            is not running. (Offline Mode)
echo ====================================================
echo.
echo  Press Ctrl+C to stop the server.
echo.

:: Open browser after 3-second delay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000/index.html"

:: Start Flask
cd /d "%~dp0backend"
python app.py

:: If Flask exits with error
if errorlevel 1 (
    echo.
    echo [ERROR] Flask stopped with an error.
    echo.
    echo POSSIBLE FIXES:
    echo   1. Port 5000 in use? Change PORT in backend\config.py
    echo   2. Missing packages? Run: pip install flask flask-cors PyJWT bcrypt
    echo   3. Check error messages above for details.
    echo.
    echo [NOTE] You can still open the HTML files directly in
    echo        your browser - registration will use Offline Mode.
    pause
)
