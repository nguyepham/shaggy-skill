@echo off
setlocal EnableExtensions

set "CORE_DIR=%~dp0..\guard-core"
for %%I in ("%CORE_DIR%") do set "CORE_DIR=%%~fI"
set "GUARD_PORT=%DEVSKILL_GUARD_PORT%"
if not defined GUARD_PORT set "GUARD_PORT=7636"
set "GUARD_URL=%DEVSKILL_GUARD_URL%"
if not defined GUARD_URL set "GUARD_URL=http://127.0.0.1:%GUARD_PORT%"
if "%GUARD_URL:~-1%"=="/" set "GUARD_URL=%GUARD_URL:~0,-1%"

if not exist "%CORE_DIR%\src\http-server.mjs" (
  echo DevSkill Guard Core was not found:
  echo %CORE_DIR%
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to start DevSkill Guard Core.
  exit /b 1
)

if /I "%~1"=="--check" (
  echo DevSkill Guard Core is ready:
  echo %CORE_DIR%
  exit /b 0
)

if /I "%~1"=="--stop" (
  call "%~dp0stop-guard-core.bat"
  exit /b %ERRORLEVEL%
)

powershell -NoProfile -Command "try { Invoke-RestMethod -Method Get -Uri '%GUARD_URL%/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo DevSkill Guard Core is already running at %GUARD_URL%
  exit /b 0
)

start "DevSkill Guard Core" /D "%CORE_DIR%" cmd.exe /c "set DEVSKILL_GUARD_PORT=%GUARD_PORT%&& node src\http-server.mjs"
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { Invoke-RestMethod -Method Get -Uri '%GUARD_URL%/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo DevSkill Guard Core did not become available.
  exit /b 1
)

echo DevSkill Guard Core started at %GUARD_URL%
exit /b 0
