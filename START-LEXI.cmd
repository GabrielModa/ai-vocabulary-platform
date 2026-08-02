@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-LEXI.ps1"
set "LEXI_EXIT=%ERRORLEVEL%"
if not "%LEXI_EXIT%"=="0" pause
exit /b %LEXI_EXIT%
