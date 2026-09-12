@echo off
setlocal

where opencode >nul 2>&1
if errorlevel 1 (
  echo OpenCode was not found on PATH.
  pause
  exit /b 1
)

set "DEVSKILL_GUARD_ENABLED=0"
call opencode %*
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
