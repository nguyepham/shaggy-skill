# Rebon adapter

This is a Rebon bootstrap plus the shared DevSkill Guard MCP bridge.

## Start

Run the installer once. It installs Guard Core's locked npm dependency, then writes Rebon's persistent MCP and hook configuration to Rebon's active configuration home, targeting the installed DevSkill package when present. After that, open Rebon Desktop normally; a fresh session materializes the bridge.

The configuration uses the installed Node executable directly, independent of Desktop's `PATH`.

At Mode Gate, choosing code-level enforcement starts the Core, activates `rebon`, and writes the admitted profile; choosing the instruction-guided skill deactivates it but retains the dormant hook for same-session re-entry. Session end releases the Guard and stops its Core when no Rebon session remains.

`rebon-adapter.bat` is a launcher and installer menu.

| Launcher | Result |
|---|---|
| `start-rebon-desktop-with-guard.bat` | One-time install, start Core, open Rebon Desktop |
| `start-guard-core.bat` | Start Guard Core only |
| `start-rebon-with-guard.bat` | Start guarded Rebon CLI |

The CLI launcher runs from the project directory, or accepts its path:

```bat
E:\AI\Dev-Skill-Unslop\host-adapters\rebon\start-rebon-with-guard.bat E:\AI\Atomic-single-ai-workflow
```

`--check` verifies Node, the hook script, and Rebon without starting a session.

`start-rebon-without-guard.bat` disables the bootstrap for that process. `stop-guard-core.bat` remains a manual cleanup fallback.

The direct launcher uses `E:\AI\RebonPC\rebon-cli.exe` when present, then falls back to `rebon` on `PATH`.

## Desktop session

After Desktop opens a new agent session, Mode Gate probes `devskill_guard` through Rebon's native `Mcp` facade and controls the Guard itself. The user does not run a launcher, MCP method, or slash command for admission. A missing native bridge keeps the session instruction-guided and hides code-level enforcement.

## Enforced native tools

`PreToolUse` intercepts `Write`, `Edit`, `MultiEdit`, `NotebookEdit`, `Bash`, and `PowerShell`, including delegated subagent calls. A state-changing request must match the active Guard binding's `mutation` action and exact target.

- File tools use a normalized absolute forward-slash path.
- Shell tools use the exact command string.
- Simple read-only shell commands pass without a Guard request.

Other MCP servers and Rebon tools are outside this adapter's mutation scope. This is `mutation-guarded`, not route, checkpoint, or presentation enforcement.

## Native test

In the same Rebon session:

1. Use Rebon's native `Mcp` tool with `server: "devskill_guard"` and `name: "devskill_guard_enable"`. Do not search individual Guard method names with `ToolSearch`.
2. Call `devskill_guard_admit` with host `rebon` and the selected mode. The configured bridge supplies `session_id: "rebon-default"`.
3. Call `devskill_guard_enter` with `allowed_actions: ["mutation"]` and one exact target path.
4. Ask Rebon to write that exact path. It should be allowed.
5. Ask it to write a different path. Rebon must show a Guard rejection before the write runs.

Use `devskill_guard_status` through Rebon's `Mcp` tool to inspect the held profile and binding.
