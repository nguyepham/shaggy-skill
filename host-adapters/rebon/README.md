# Rebon adapter

This is a Rebon session plugin plus the shared DevSkill Guard MCP bridge.

## Start

Double-click `rebon-adapter.bat` for one menu:

1. Start Rebon with Guard.
2. Stop Guard, then start Rebon without guard.
3. Stop Guard Core and exit.
4. Exit.

Direct launchers are also available. Run from the project directory, or pass its path:

```bat
E:\AI\Dev-Skill-Unslop\host-adapters\rebon\start-rebon-with-guard.bat E:\AI\Atomic-single-ai-workflow
```

`--check` verifies Node, the hook script, and Rebon without starting a session.

`start-rebon-without-guard.bat` starts Rebon without the plugin or Guard MCP bridge. `stop-guard-core.bat` or `start-rebon-with-guard.bat --stop` stops the local Core. After a guarded Rebon session closes, return to the menu and choose option 3 when the Core is no longer needed.

At DevSkill admission, select host-adapter use only after starting the matching guarded or no-guard session. The choice must match the live session; it does not toggle a running plugin.

The launcher starts Guard Core on `127.0.0.1:7636` if needed, loads this plugin for the current Rebon session, and connects the `devskill_guard` MCP server. It uses `E:\AI\RebonPC\rebon-cli.exe` when present, then falls back to `rebon` on `PATH`. It does not install or modify Rebon's user configuration.

## Enforced native tools

`PreToolUse` intercepts `Write`, `Edit`, `MultiEdit`, `NotebookEdit`, `Bash`, and `PowerShell`, including delegated subagent calls. A state-changing request must match the active Guard binding's `mutation` action and exact target.

- File tools use a normalized absolute forward-slash path.
- Shell tools use the exact command string.
- Simple read-only shell commands pass without a Guard request.

Other MCP servers and Rebon tools are outside this adapter's mutation scope. This is `mutation-guarded`, not route, checkpoint, or presentation enforcement.

## Native test

In the same Rebon session:

1. Call `devskill_guard_admit` with `session_id: "rebon-default"`, host `rebon`, and the selected mode.
2. Call `devskill_guard_enter` with `allowed_actions: ["mutation"]` and one exact target path.
3. Ask Rebon to write that exact path. It should be allowed.
4. Ask it to write a different path. Rebon must show a Guard rejection before the write runs.

Use `devskill_guard_status` to inspect the held profile and binding.
