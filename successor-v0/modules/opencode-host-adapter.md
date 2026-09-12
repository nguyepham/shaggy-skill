# OpenCode host adapter

## Trigger and boundary

Use only when [Mode Gate](../../mode-gate.md) resolves `opencode` and its host-adapter selection. It classifies the installed OpenCode adapter's session capability. It does not admit a profile, route, enter, advance, authorize, select, or complete work.

## Runtime input

Read `devskill_guard_status` for the current adapter session.

| Status field | Required value |
|---|---|
| `adapter.name` | `opencode` |
| `adapter.capability` | `mutation-guarded` |

## Operation

1. When `DEVSKILL_GUARD_ENABLED` disables the plugin, do not read adapter status. Return unavailable interception to Mode Gate.
2. Otherwise read the current adapter status.
3. Return `mutation-guarded` only when both required status fields match.
4. Otherwise return unavailable interception to Mode Gate.
5. A probe runs only on an explicit adapter-test request. With an active binding, run native `bash` with `echo DEVSKILL_GUARD_NATIVE_PROBE`. A Guard rejection proves the pre-tool boundary; echoed output means the native hook did not run.

## Return

Return `mutation-guarded` or unavailable interception to Mode Gate. Mode Gate matches that result with the user's adapter choice and selects `instruction-guided` only for a matching soft-guide choice. `mutation-guarded` applies only to matching state-changing tool actions. It never claims Route entry, checkpoint advance, review, Decision, or presentation enforcement.
