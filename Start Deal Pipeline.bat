@echo off
REM Double-click to start the app (runs start-pc.ps1)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-pc.ps1"
pause
