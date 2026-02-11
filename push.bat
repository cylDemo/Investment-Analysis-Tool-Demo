@echo off
chcp 65001 >nul
cd /d D:\Users\Desktop\Trae_demo\Investment_Analysis_Tool_Demo

echo ========================================
echo    Git 一键推送工具
echo ========================================
echo.

echo [1/4] 正在检查文件变更...
D:\software\Git\cmd\git.exe status --short

echo.
echo [2/4] 正在添加文件到暂存区...
D:\software\Git\cmd\git.exe add .

echo.
echo [3/4] 正在提交更改...
set /p msg="请输入提交信息 (直接回车使用默认'更新'): "
if "%msg%"=="" set msg=更新
D:\software\Git\cmd\git.exe commit -m "%msg%"

echo.
echo [4/4] 正在推送到 GitHub...
D:\software\Git\cmd\git.exe push

echo.
echo ========================================
echo    推送完成！
echo ========================================
echo.
pause
