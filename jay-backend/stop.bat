@echo off
echo Stopping JAY Backend...
taskkill /F /IM uvicorn.exe 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul
echo Done.
