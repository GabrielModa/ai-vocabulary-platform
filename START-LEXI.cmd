@echo off
setlocal
cd /d "%~dp0"
if not exist "services\image-worker\.venv\Scripts\python.exe" (
  echo ERRO: ambiente de imagens nao encontrado.
  pause
  exit /b 1
)
start "Lexi - imagens locais" cmd /k "services\image-worker\start-worker.cmd"
start "Lexi - site" cmd /k "pnpm --filter @vocabulary/web dev"
timeout /t 5 /nobreak >nul
start "" http://localhost:3000
