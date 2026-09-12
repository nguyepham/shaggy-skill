@echo off
setlocal

set "CORE_DIR=%~dp0..\guard-core"
for %%I in ("%CORE_DIR%") do set "CORE_DIR=%%~fI"
set "GUARD_URL=%DEVSKILL_GUARD_URL%"
if not defined GUARD_URL set "GUARD_URL=http://127.0.0.1:%DEVSKILL_GUARD_PORT%"
if "%GUARD_URL%"=="http://127.0.0.1:" set "GUARD_URL=http://127.0.0.1:7634"
if "%GUARD_URL:~-1%"=="/" set "GUARD_URL=%GUARD_URL:~0,-1%"

if not exist "%CORE_DIR%\src\http-server.mjs" (
  echo DevSkill Guard Core was not found:
  echo %CORE_DIR%
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to start DevSkill Guard Core.
  pause
  exit /b 1
)

if /i "%~1"=="--check" (
  echo DevSkill Guard Core is ready:
  echo %CORE_DIR%
  exit /b 0
)

if /i "%~1"=="--stop" (
  call "%~dp0stop-guard-core.bat"
  exit /b %ERRORLEVEL%
)

powershell -NoProfile -Command "try { Invoke-RestMethod -Method Get -Uri '%GUARD_URL%/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo DevSkill Guard Core is already running at %GUARD_URL%
  exit /b 0
)

start "DevSkill Guard Core" /D "%CORE_DIR%" cmd.exe /c "node src\http-server.mjs"
endlocal
