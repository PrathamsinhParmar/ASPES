@echo off
echo =======================================================
echo     ASPES - AI Smart Academic Project Evaluation System
echo                   STARTUP SCRIPT
echo =======================================================
echo.
echo Starting all services...
echo.

:: 1. Start the FastAPI Backend
echo [1/3] Starting Backend API Server (FastAPI on port 8000)...
start "ASPES Backend API" cmd /c "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a brief moment to let backend initialize
timeout /t 3 /nobreak >nul

:: 2. Start Celery Worker
echo [2/3] Starting Celery Background Worker...
start "ASPES Celery Worker" cmd /k "cd backend && call venv\Scripts\activate && celery -A app.tasks.celery_app worker --loglevel=info"

:: 3. Start Frontend React App
echo [3/3] Starting Frontend React Application (port 3000)...
start "ASPES Frontend React App" cmd /c "cd frontend && npm start"

echo.
echo =======================================================
echo                  ALL SERVICES LAUNCHED!
echo =======================================================
echo.
echo Three new command prompt windows should have opened for:
echo   1. Backend API Server (Runs the Python FastAPI backend)
echo   2. Celery Worker (Processes AI evaluations in background)
echo   3. Frontend Server (Runs the React UI)
echo.
echo Access the application here:
echo   User Interface : http://localhost:3000
echo   API Docs       : http://localhost:8000/api/docs
echo.
echo IMPORTANT: Make sure your Redis server is running, otherwise
echo the Celery worker will show connection errors.
echo.
echo Keep this window open or press any key to close it.
pause
