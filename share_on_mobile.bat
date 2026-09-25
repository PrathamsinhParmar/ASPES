@echo off
echo =======================================================
echo     ASPES - Mobile Access (Cloudflare Tunnel)
echo =======================================================
echo.
echo This script will create a secure tunnel so you can access
echo the project from your phone using a unique URL.
echo.
echo [Prerequisite] 1. Make sure your local project is running.
echo 2. IMPORTANT: If you just applied the fix, you MUST RESTART 
echo your server (rerun start_aspes.bat) for changes to take effect.
echo.
echo Starting tunnel for Frontend (Port 3000)...
echo.
echo -------------------------------------------------------
echo Look for a line that starts with: 
echo "https://[your-unique-id].trycloudflare.com"
echo.
echo That is the URL you should open on your phone.
echo -------------------------------------------------------
echo.
cloudflared tunnel --url http://localhost:3000
pause
