@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (echo ERRO: .venv nao encontrado.& pause & exit /b 1)
if not exist "models\lcm-dreamshaper-int8\model_index.json" (echo ERRO: modelo nao encontrado.& pause & exit /b 1)
".venv\Scripts\python.exe" -m image_worker.server
