@echo off
echo ============================================
echo NASA HWO Habitability Explorer Launcher
echo ============================================
echo.
echo Checking for existing servers...

REM Check if ports are in use
netstat -ano | findstr ":8000" >nul
if %ERRORLEVEL% == 0 (
    echo WARNING: Port 8000 is already in use!
    echo Please stop existing server or use different port.
    echo.
)

netstat -ano | findstr ":3000" >nul  
if %ERRORLEVEL% == 0 (
    echo WARNING: Port 3000 is already in use!
    echo Please stop existing server or use different port.
    echo.
)

echo ============================================
echo OPTION 1: Start Backend (this window)
echo ============================================
echo.
echo OPTION 2: Start Frontend (open new terminal and run):
echo cd C:\Programming\hwo-habitability-explorer\frontend
echo npm start
echo.
echo ============================================
echo.
echo Starting backend server...
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
