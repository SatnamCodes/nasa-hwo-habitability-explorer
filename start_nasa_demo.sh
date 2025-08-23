#!/bin/bash
echo "============================================"
echo "NASA HWO Habitability Explorer Launcher"
echo "============================================"
echo ""
echo "Starting backend server..."
echo "Open a new terminal and run the frontend command shown below."
echo ""
echo "============================================"
echo "FRONTEND COMMAND (run in new terminal):"
echo "cd frontend"
echo "npm start"
echo "============================================"
echo ""
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
