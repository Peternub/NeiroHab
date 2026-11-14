@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Для запуска установите Node.js 20 или новее с https://nodejs.org/
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Готовая сборка не найдена. Выполните npm install и npm run build.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4173/"
node scripts/serve.mjs
pause
