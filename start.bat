@echo off
echo ========================================
echo   A股量化系统 - 启动脚本
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [1/3] 检查依赖...
cd /d "%~dp0"

:: 检查后端依赖
if not exist "backend\node_modules" (
    echo 正在安装后端依赖...
    cd backend
    call npm install
    cd ..
)

:: 检查前端依赖
if not exist "frontend\node_modules" (
    echo 正在安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [2/3] 启动后端服务...
cd backend
start "ASTOCK-BACKEND" cmd /k "npm start"

echo.
echo [3/3] 启动前端服务...
cd ..\frontend
start "ASTOCK-FRONTEND" cmd /k "npm run dev"

echo.
echo ========================================
echo   启动完成！
echo   后端服务: http://localhost:5000
echo   前端服务: http://localhost:3000
echo ========================================
echo.
pause
