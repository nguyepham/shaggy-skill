# OpenCode adapter

Target claim: `full`. Current claim: `mutation-guarded`.

## Required host bindings

| Host boundary | Guard operation |
|---|---|
| Incoming engineering prompt | Start or resume Mode Gate and Route before model work |
| Every model dispatch | Re-enter the active owner boundary; withhold unavailable actions |
| Permission evaluation | Deny a state-changing action without its current binding |
| Tool execution before action | Match the exact action and target, then `advance` before execution |
| Outbound engineering presentation | Allow only the active owner's declared presentation or terminal |

## Guard requirements

1. Hold guard state outside model context for each host session.
2. Preserve the admitted profile and current binding across tool-driven model turns.
3. Reject a state-changing action, lifecycle advance, or engineering presentation with no matching binding.
4. Treat a rejected action as a return to the active owner; never synthesize a new route or approval.
5. Do not claim `full` until the outbound-presentation boundary is verified on the installed OpenCode version.

`apply_patch` parses every `Add File`, `Update File`, `Delete File`, and `Move to` target before the patch parser runs. Every target must match the binding; repository-relative and absolute Windows spellings are matched equivalently. A binding may name the native action, such as `apply_patch`, or the generic `mutation` action.

## Integration boundary

OpenCode-specific hooks translate native prompt, context, permission, tool, and presentation events to the shared guard contract. The guard contract remains portable so later host adapters can use the same semantics.

OpenCode's documented local-plugin API can block tools through `tool.execute.before`. It does not document a pre-dispatch prompt gate or a pre-display assistant-message gate. This adapter therefore enforces mutation bindings only. A wrapper or verified future hook is required for `full`.

## Test install

1. Run `npm install` in `../guard-core`.
2. Double-click `opencode-adapter.bat` in this folder and select guarded, no-guard, or clean-stop operation.
3. Run `./install.ps1` to install the global plugin, or copy `devskill-guard.js` to a project `.opencode/plugins/` directory.
4. Add `opencode.mcp.jsonc` to the active OpenCode configuration.
5. Restart OpenCode. `devskill_guard_status` now returns `adapter.name: opencode` and `adapter.capability: mutation-guarded` after plugin load.
6. Use the MCP tools to admit and enter a binding for the configured session. A mutation with no exact binding is rejected by the plugin.

## Enable and disable

Guard is enabled unless OpenCode starts with `DEVSKILL_GUARD_ENABLED=0`. Disabled mode returns no interception hook and does not contact Guard Core. Double-click `start-opencode-without-guard.bat` to launch that mode, or choose option 2 from `opencode-adapter.bat` to stop the local Core first and then launch without guard.

Choose option 3 from `opencode-adapter.bat`, run `stop-guard-core.bat`, or use `start-guard-core.bat --stop` for a clean Core exit. Stopping Core alone does not unload an already-loaded OpenCode plugin. While enabled, an unreachable Core fails closed as `guard_unavailable`; restart with the disabled setting for an intentional bypass.

The start and stop scripts use `DEVSKILL_GUARD_URL` when set; otherwise they use `DEVSKILL_GUARD_PORT` or port `7634`.

On host start, the plugin resets its configured test session before announcing the adapter. This clears a stale profile or binding left by an earlier OpenCode process.

## Native probe

With an active binding, run native `bash` with `echo DEVSKILL_GUARD_NATIVE_PROBE`. The command does not mutate the project. A `target_not_allowed` Guard error proves the OpenCode pre-tool hook ran; echoed output means it did not.

`DEVSKILL_GUARD_SESSION` is the shared MCP and native-hook session key. Without it, the adapter uses `opencode-default` for one-session testing.
