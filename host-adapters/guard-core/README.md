# Guard core

Loopback-only deterministic state for host adapters.

```text
admit -> enter -> authorize mutation -> advance | reset
```

## Start

```powershell
npm install
node src/http-server.mjs
```

The service listens on `http://127.0.0.1:7634` unless `DEVSKILL_GUARD_PORT` sets another port.

## Stop

Run `../opencode/stop-guard-core.bat`, or post to `http://127.0.0.1:7634/v1/shutdown`. The Core acknowledges the request, closes the listener, and exits.

## MCP

```powershell
$env:DEVSKILL_GUARD_URL = 'http://127.0.0.1:7634'
node src/mcp-server.mjs
```

MCP tools: `devskill_guard_admit`, `devskill_guard_enter`, `devskill_guard_advance`, `devskill_guard_status`, and `devskill_guard_reset`.

The core validates only explicit profile and binding state. It does not parse DevSkill prose, select a stage, interpret human intent, or grant project authority.
