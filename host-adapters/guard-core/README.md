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

Run `../rebon/stop-guard-core.bat`, or post to `http://127.0.0.1:7634/v1/shutdown`. The Core acknowledges the request, closes the listener, and exits.

## MCP

```powershell
$env:DEVSKILL_GUARD_URL = 'http://127.0.0.1:7634'
node src/mcp-server.mjs
```

MCP tools: `devskill_guard_enable`, `devskill_guard_disable`, `devskill_guard_admit`, `devskill_guard_enter`, `devskill_guard_advance`, `devskill_guard_status`, and `devskill_guard_reset`.

`enable` requires a matching registered native hook. It activates that host adapter for one session and returns its adapter record. `disable` deactivates the adapter while retaining its dormant session hook. The host session-end hook releases the session and stops the Core when no session remains.

The core validates only explicit profile and binding state. It does not parse DevSkill prose, select a stage, interpret human intent, or grant project authority.
