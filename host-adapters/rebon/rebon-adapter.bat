@echo off
setlocal EnableExtensions

:menu
cls
echo DevSkill Rebon adapter
echo.
echo [1] Start Rebon Desktop with DevSkill bootstrap
echo [2] Start Guard Core only
echo [3] Start Rebon CLI with DevSkill bootstrap
echo [4] Start Rebon CLI without the bootstrap
echo [5] Install or update the persistent Rebon bootstrap
echo [6] Stop Guard Core and exit
echo [7] Exit
echo.
set /p "CHOICE=Select an option: "

if "%CHOICE%"=="1" (
  call "%~dp0start-rebon-desktop-with-guard.bat" %*
  goto menu
)
if "%CHOICE%"=="2" (
  call "%~dp0start-guard-core.bat"
  goto menu
)
if "%CHOICE%"=="3" (
  call "%~dp0start-rebon-with-guard.bat" %*
  goto menu
)
if "%CHOICE%"=="4" (
  call "%~dp0start-rebon-without-guard.bat" %*
  goto menu
)
if "%CHOICE%"=="5" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-rebon-adapter.ps1"
  pause
  goto menu
)
if "%CHOICE%"=="6" (
  call "%~dp0stop-guard-core.bat"
  exit /b %ERRORLEVEL%
)
if "%CHOICE%"=="7" exit /b 0

echo Invalid option.
timeout /t 2 /nobreak >nul
goto menu
