@echo off
title Khoi dong Du an E-Commerce Handmade
cls

cd /d "%~dp0"

echo ==========================================================
echo    KHOI DONG HE THONG E-COMMERCE HANDMADE
echo ==========================================================
echo.

echo [*] Dang kiem tra moi truong...

java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java chua duoc cai dat.
    pause
    exit /b
)

node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js chua duoc cai dat.
    pause
    exit /b
)

echo [OK] Java va Node.js da san sang.
echo.

echo Chon che do Cache:
echo [1] Simple Cache
echo [2] Redis Cache
echo.

set CACHE_PROP=simple
set /p cache_choice=Nhap lua chon (1 hoac 2):

if "%cache_choice%"=="2" (
    set CACHE_PROP=redis
    echo Dang dung Redis Cache
) else (
    echo Dang dung Simple Cache
)

echo.
echo Dang khoi dong Backend...

start "Backend" cmd /k "cd /d backend && java -jar -Dapp.cache.type=%CACHE_PROP% target\handmade-api-0.0.1-SNAPSHOT.jar"

if not exist "frontend\node_modules" (
    echo Dang cai dat thu vien Frontend...
    cd /d frontend
    call npm install
    cd ..
)

echo Dang khoi dong Frontend...

start "Frontend" cmd /k "cd /d frontend && npm start"

echo.
echo ==========================================================
echo KHOI DONG THANH CONG
echo Backend : http://localhost:8080
echo Frontend: http://localhost:3000
echo ==========================================================
echo.

pause