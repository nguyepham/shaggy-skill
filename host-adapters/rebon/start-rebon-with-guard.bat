@echo off
setlocal EnableExtensions

set "ADAPTER_DIR=%~dp0"
if not defined DEVSKILL_GUARD_PORT set "DEVSKILL_GUARD_PORT=7636"
if not defined DEVSKILL_GUARD_URL set "DEVSKILL_GUARD_URL=http://127.0.0.1:%DEVSKILL_GUARD_PORT%"
if "%DEVSKILL_GUARD_URL:~-1%"=="/" set "DEVSKILL_GUARD_URL=%DEVSKILL_GUARD_URL:~0,-1%"
set "DEVSKILL_GUARD_SESSION=rebon-default"
set "REBON_BIN=E:\AI\RebonPC\rebon-cli.exe"
if not exist "%REBON_BIN%" set "REBON_BIN=rebon"

if /I "%~1"=="--check" (
  node "%ADAPTER_DIR%rebon-guard-hook.mjs" --check || exit /b 1
  "%REBON_BIN%" --version || exit /b 1
  exit /b 0
)

if /I "%~1"=="--stop" (
  call "%ADAPTER_DIR%stop-guard-core.bat"
  exit /b %ERRORLEVEL%
)

if "%~1"=="" (
  set "PROJECT_DIR=%CD%"
) else (
  set "PROJECT_DIR=%~f1"
)
set "DEVSKILL_GUARD_CWD=%PROJECT_DIR%"

call "%ADAPTER_DIR%start-guard-core.bat" || exit /b 1
"%REBON_BIN%" --cwd "%PROJECT_DIR%"
set "REBON_EXIT=%ERRORLEVEL%"
exit /b %REBON_EXIT%
