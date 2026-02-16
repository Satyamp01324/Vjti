@echo off
echo ========================================
echo NeuroPilot - Complete Test ^& Start
echo ========================================
echo.

REM Set UTF-8 encoding
chcp 65001 >nul
set PYTHONIOENCODING=utf-8

echo [STEP 1/5] Activating virtual environment...
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
    echo ✓ Virtual environment activated
) else (
    echo ⚠ No .venv found, using system Python
)

echo.
echo [STEP 2/5] Starting Backend Server...
start "NeuroPilot Backend" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate.bat && cd backend && uvicorn main:app --reload --port 8000"
echo Waiting 10 seconds for backend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo [STEP 3/5] Starting Frontend Server...
start "NeuroPilot Frontend" cmd /k "cd /d %~dp0 && cd frontend && npm run dev"
echo Waiting 5 seconds for frontend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [STEP 4/5] Running Comprehensive Tests...
echo.
python test_all_features.py
set TEST_RESULT=%errorlevel%

echo.
echo [STEP 5/5] Opening Application...
if %TEST_RESULT% equ 0 (
    echo ✓ All tests passed! Opening browser...
    timeout /t 2 /nobreak >nul
    start http://localhost:5174
) else (
    echo ⚠ Some tests failed. Check output above.
    echo Opening browser anyway...
    start http://localhost:5174
)

echo.
echo ========================================
echo NeuroPilot is Running!
echo ========================================
echo.
echo Access Points:
echo   Frontend:  http://localhost:5174
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
pause
