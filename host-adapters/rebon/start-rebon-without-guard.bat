@echo off
setlocal EnableExtensions

set "REBON_BIN=E:\AI\RebonPC\rebon-cli.exe"
if not exist "%REBON_BIN%" set "REBON_BIN=rebon"

if /I "%~1"=="--check" (
  "%REBON_BIN%" --version
  exit /b %ERRORLEVEL%
)

if "%~1"=="" (
  set "PROJECT_DIR=%CD%"
) else (
  set "PROJECT_DIR=%~f1"
)

set "DEVSKILL_GUARD_ENABLED=0"
"%REBON_BIN%" --cwd "%PROJECT_DIR%"
set "REBON_EXIT=%ERRORLEVEL%"
endlocal & exit /b %REBON_EXIT%
