@echo off
echo Starting JAY Backend...
echo Press Ctrl+C to stop (may need to press twice on Windows)
echo.
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
