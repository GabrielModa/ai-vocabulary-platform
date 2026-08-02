@echo off
setlocal
cd /d "%~dp0"

if not exist package.json (
  echo ERRO: extraia estes arquivos na raiz de ai-vocabulary-platform.
  echo A pasta correta precisa conter package.json.
  pause
  exit /b 1
)

echo Verificando se modelo e ambiente Python estao protegidos...
git check-ignore -q services/image-worker/models
if errorlevel 1 goto ignore_error
git check-ignore -q services/image-worker/.venv
if errorlevel 1 goto ignore_error

echo OK: models e .venv nao serao enviados.
git add .

git diff --cached --quiet
if not errorlevel 1 goto nothing_to_commit

git commit -m "feat: add local AI vocabulary learning experience"
if errorlevel 1 goto command_error

git push origin main
if errorlevel 1 goto command_error

echo.
echo PRONTO: codigo enviado ao GitHub sem modelo e sem .venv.
pause
exit /b 0

:ignore_error
echo ERRO: o .gitignore ainda nao protege models ou .venv.
echo Confirme que este pacote foi extraido na raiz do projeto.
pause
exit /b 1

:nothing_to_commit
echo Nada novo para enviar. Confira git status.
pause
exit /b 0

:command_error
echo O Git encontrou um erro. Copie a mensagem exibida acima.
pause
exit /b 1
