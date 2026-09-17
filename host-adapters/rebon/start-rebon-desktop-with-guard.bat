@echo off
setlocal EnableExtensions

set "ADAPTER_DIR=%~dp0"
set "REBON_DESKTOP=E:\AI\RebonPC\Rebon.exe"

if not exist "%REBON_DESKTOP%" (
  echo Rebon Desktop was not found:
  echo %REBON_DESKTOP%
  exit /b 1
)

if /I "%~1"=="--check" (
  call "%ADAPTER_DIR%start-guard-core.bat" --check || exit /b 1
  echo Rebon Desktop is ready:
  echo %REBON_DESKTOP%
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%ADAPTER_DIR%install-rebon-adapter.ps1" || exit /b 1
call "%ADAPTER_DIR%start-guard-core.bat" || exit /b 1

tasklist /fi "imagename eq Rebon.exe" /nh | findstr /i "Rebon.exe" >nul
if not errorlevel 1 (
  echo Rebon Desktop is already running. Guard Core is ready.
  echo Restart Rebon Desktop once to load a newly installed MCP bridge.
  exit /b 0
)

start "Rebon Desktop" "%REBON_DESKTOP%"
echo Rebon Desktop started with the DevSkill Guard bootstrap.
echo At Mode Gate, choose code-level enforcement to activate the Guard.
exit /b 0
