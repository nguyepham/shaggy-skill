@echo off
setlocal EnableExtensions

set "ADAPTER_DIR=%~dp0"
for %%I in ("%ADAPTER_DIR%..") do set "HOST_ADAPTERS_DIR=%%~fI"
for %%I in ("%HOST_ADAPTERS_DIR%\guard-core") do set "GUARD_CORE_DIR=%%~fI"
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

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing '%DEVSKILL_GUARD_URL%/health' -TimeoutSec 1; if ($r.StatusCode -ne 200) { exit 1 } } catch { exit 1 }"
if errorlevel 1 start "DevSkill Guard Core" /D "%GUARD_CORE_DIR%" cmd.exe /c "node src\http-server.mjs"

timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing '%DEVSKILL_GUARD_URL%/health' -TimeoutSec 2; if ($r.StatusCode -ne 200) { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo DevSkill Guard Core did not become available.
  exit /b 1
)

set "GUARD_CORE_JSON=%GUARD_CORE_DIR:\=/%"
set "MCP_CONFIG=%TEMP%\devskill-rebon-guard-%RANDOM%-%RANDOM%.json"
> "%MCP_CONFIG%" (
  echo {
  echo   "mcpServers": {
  echo     "devskill_guard": {
  echo       "command": "node",
  echo       "args": ["%GUARD_CORE_JSON%/src/mcp-server.mjs"],
  echo       "env": {
  echo         "DEVSKILL_GUARD_URL": "%DEVSKILL_GUARD_URL%",
  echo         "DEVSKILL_GUARD_SESSION": "%DEVSKILL_GUARD_SESSION%"
  echo       },
  echo       "timeoutMs": 5000
  echo     }
  echo   }
  echo }
)

"%REBON_BIN%" --cwd "%PROJECT_DIR%" --plugin-dir "%ADAPTER_DIR%" --mcp-config "%MCP_CONFIG%"
set "REBON_EXIT=%ERRORLEVEL%"
del /q "%MCP_CONFIG%" >nul 2>nul
exit /b %REBON_EXIT%
