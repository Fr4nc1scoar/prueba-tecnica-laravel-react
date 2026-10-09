@echo off
title Pruebas Automatizadas Laravel
echo ================================================================
echo   EJECUTANDO PRUEBAS AUTOMATIZADAS (PHPUnit / Laravel)
echo ================================================================
echo.
cd /d "%~dp0backend"
where php >nul 2>nul
if %errorlevel% equ 0 (
    php vendor/phpunit/phpunit/phpunit --testdox tests/Feature/OrderAndWebhookTest.php
) else (
    if exist "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" (
        "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" vendor/phpunit/phpunit/phpunit --testdox tests/Feature/OrderAndWebhookTest.php
    ) else (
        echo Error: PHP no encontrado en PATH ni en Laragon.
    )
)
echo.
echo ================================================================
echo   Verificacion completada.
echo ================================================================
echo.
pause
