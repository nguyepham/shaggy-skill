@echo off
setlocal

echo.
echo DevSkill OpenCode adapter
echo.
echo [1] Start Guard Core
echo [2] Stop Core, then start OpenCode without guard
echo [3] Stop Guard Core and exit
echo [4] Exit
choice /C 1234 /N /M "Select"

if errorlevel 4 exit /b 0
if errorlevel 3 (
  call "%~dp0stop-guard-core.bat"
  exit /b %ERRORLEVEL%
)
if errorlevel 2 (
  call "%~dp0stop-guard-core.bat"
  call "%~dp0start-opencode-without-guard.bat"
  exit /b %ERRORLEVEL%
)
call "%~dp0start-guard-core.bat"
endlocal
