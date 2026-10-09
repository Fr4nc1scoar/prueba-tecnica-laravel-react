@echo off
where npm >nul 2>nul
if %errorlevel% neq 0 (
    set PATH=C:\laragon\bin\nodejs\node-v22;%PATH%
)
npm run dev
