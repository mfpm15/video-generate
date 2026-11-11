@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0audit.ps1"
echo.
echo Selesai. Lihat AUDIT-REPORT.md di folder ini.
timeout /t 5 >nul
