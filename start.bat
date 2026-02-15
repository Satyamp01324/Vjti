@echo off
echo ========================================
echo Let Go 3.0 - Starting Application
echo ========================================
echo.

echo [1/3] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Starting servers...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo.

npm run dev
