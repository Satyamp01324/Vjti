@echo off
echo ========================================
echo NeuroPilot - Complete Startup
echo ========================================
echo.

REM Set UTF-8 encoding to prevent Unicode errors on Windows
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

echo [STEP 1/3] Checking if backend is already running...
curl -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend is already running on port 8000
    set BACKEND_RUNNING=1
) else (
    echo ✗ Backend not running, will start it
    set BACKEND_RUNNING=0
)

echo.
echo [STEP 2/3] Checking if frontend is already running...
curl -s http://localhost:5174 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend is already running on port 5174
    set FRONTEND_RUNNING=1
) else (
    echo ✗ Frontend not running, will start it
    set FRONTEND_RUNNING=0
)

echo.
echo [STEP 3/3] Starting servers...
echo.

REM Start backend if not running
if %BACKEND_RUNNING%==0 (
    echo Starting Backend Server...
    start "NeuroPilot Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"
    echo Waiting 5 seconds for backend to initialize...
    timeout /t 5 /nobreak >nul
) else (
    echo Backend already running, skipping...
)

REM Start frontend if not running
if %FRONTEND_RUNNING%==0 (
    echo Starting Frontend Server...
    start "NeuroPilot Frontend" cmd /k "cd frontend && npm run dev"
    echo Waiting 3 seconds for frontend to initialize...
    timeout /t 3 /nobreak >nul
) else (
    echo Frontend already running, skipping...
)

echo.
echo ========================================
echo ✓ NeuroPilot is Running!
echo ========================================
echo.
echo Access your application at:
echo   Frontend:  http://localhost:5174
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo TIP: To use this script next time, just run:
echo   .\run.bat
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:5174

echo.
echo Application opened! Keep this window open or close it.
echo The servers are running in separate windows.
echo.
pause
