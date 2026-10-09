@echo off
where php >nul 2>nul
if %errorlevel% equ 0 (
    php artisan serve
) else (
    "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" artisan serve
)
