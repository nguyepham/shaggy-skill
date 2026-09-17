# Guard core

Loopback-only deterministic state for host adapters.

```text
admit -> enter -> authorize mutation -> advance | reset
```

## Start

The Rebon installer runs `npm ci` automatically. For a manual Core start:

```powershell
npm ci
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

`enable` requires a matching registered native hook and one trusted host session id. It activates that adapter for that session and returns its adapter record. `disable` deactivates it while retaining its dormant session hook. Session end releases only that session; the Core stays host-scoped. Core output is written to `%LOCALAPPDATA%\DevSkill\rebon-guard\core.log` unless `DEVSKILL_GUARD_STATE_DIR` selects another state folder.

If the Core restarts after enforcement is active, the next Guard call returns `guard_lapsed`. The host hook rejects the state-changing action; Mode Gate must re-enable, admit, and enter a new binding before resuming.

The core validates only explicit profile and binding state. It does not parse DevSkill prose, select a stage, interpret human intent, or grant project authority.
