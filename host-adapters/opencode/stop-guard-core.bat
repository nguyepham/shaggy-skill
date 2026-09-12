@echo off
setlocal
set "GUARD_URL=%DEVSKILL_GUARD_URL%"
if not defined GUARD_URL set "GUARD_URL=http://127.0.0.1:%DEVSKILL_GUARD_PORT%"
if "%GUARD_URL%"=="http://127.0.0.1:" set "GUARD_URL=http://127.0.0.1:7634"
if "%GUARD_URL:~-1%"=="/" set "GUARD_URL=%GUARD_URL:~0,-1%"

powershell -NoProfile -Command "try { Invoke-RestMethod -Method Post -Uri '%GUARD_URL%/v1/shutdown' -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo DevSkill Guard Core is not running.
  endlocal
  exit /b 0
)

echo DevSkill Guard Core stopped.
endlocal
