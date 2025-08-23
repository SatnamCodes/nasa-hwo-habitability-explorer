@echo off
echo ============================================
echo NASA HWO - Backend Server  
echo ============================================
echo.
echo Starting FastAPI backend on port 8000...
echo API docs will be available at: http://localhost:8000/docs
echo.
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
