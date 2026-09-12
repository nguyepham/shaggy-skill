@echo off
setlocal EnableExtensions

:menu
cls
echo DevSkill Rebon adapter
echo.
echo [1] Start Rebon with Guard
echo [2] Stop Guard, then start Rebon without guard
echo [3] Stop Guard Core and exit
echo [4] Exit
echo.
set /p "CHOICE=Select an option: "

if "%CHOICE%"=="1" (
  call "%~dp0start-rebon-with-guard.bat" %*
  goto menu
)
if "%CHOICE%"=="2" (
  call "%~dp0stop-guard-core.bat"
  call "%~dp0start-rebon-without-guard.bat" %*
  goto menu
)
if "%CHOICE%"=="3" (
  call "%~dp0stop-guard-core.bat"
  exit /b %ERRORLEVEL%
)
if "%CHOICE%"=="4" exit /b 0

echo Invalid option.
timeout /t 2 /nobreak >nul
goto menu
