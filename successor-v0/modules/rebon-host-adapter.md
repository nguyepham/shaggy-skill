# Rebon host adapter

## Trigger and boundary

Run when code-level enforcement is selected for `rebon`, or a selected Rebon operation needs native tools. This adapter owns Rebon-native tools, current schemas, task synchronization, dispatch, structured output, selected native display, and Guard capability classification. It does not choose mode, route, size or partition context, plan, review, decide, implement, verify, or close a DevSkill result.

## Native card structure

Use the selected strategy's current native schema. Each card must state its bounded objective, matching role, admitted inputs, allowed tools, result shape, consumer, exact persistent result target, and finite work budget. Only the current native schema or the declared one-shot contract determines field names or selectors.

## Runtime references

| When | Load | Return or use |
|---|---|---|
| A current selected Rebon parallel strategy is unavailable | Calling operation | Strategy recovery; preserve the selected mode |
| A Rebon card needs bounded source material | [Context Optimization](context-optimization.md) | Bounded fragments for the card; non-reading cards consume those fragments |
| A Rebon result needs findings | [Review](review.md) | Findings to the calling family; Workflow state never substitutes for them |
| Active `mutation-guarded` Rebon capability maps a checkpoint | [Host Enforcement](host-enforcement.md) | Exact checkpoint mapping to the calling operation |

## Checkpoints

| When | Checkpoint | Allows |
|---|---|---|
| A selected full-Rebon operation needs an unknown native tool, selector, schema, or display capability | `native_profile_ready` | ToolSearch and the matching bounded native operation |
| A one-shot Rebon fan-out is ready | `one_shot_dispatch_ready` | Independent `Agent` cards, terminal returns, and declared result targets |
| A full-Rebon parallel wave is ready | `native_dispatch_ready` | One real foreground card, then the remaining result-safe wave |
| Native task, one-shot Agent, Workflow, or structured result reaches its declared consumer | `native_result_returned` | Calling family or module consumes that result without treating native state as authority |

## Operation

1. At `native_profile_ready`, use `ToolSearch` only before a selected full-Rebon operation whose current native tool, selector, schema, or display capability is unknown. A preloaded native tool does not appear in `ToolSearch`; an in-process helper object is not a native tool schema. Configuration, agent definitions, and plugin state are not capability evidence. A `ToolSearch` miss alone never proves that a formerly usable native tool disappeared. One-shot `Agent` does not depend on `ToolSearch`: its terminal direct return is its current capability evidence. Missing Rebon-native tools never change a completed Mode Gate admission.
2. Persistent Rebon MCP and hook configuration supplies the native hook and `devskill_guard` bridge before a session begins. When Mode Gate offers code-level enforcement, call Rebon's native `Mcp` directly with `server: "devskill_guard"`, `name: "devskill_guard_probe"`, and empty arguments. The probe starts Core when needed, bootstraps the configured Rebon hook record, and returns bridge state without enabling enforcement. Do not use `ToolSearch` for `Mcp` or a Guard method.
3. If the `Mcp` facade or `devskill_guard` server is absent and this package contains `host-adapters/rebon/install-rebon-adapter.ps1`, return `adapter_setup_required` to Mode Gate. After the human selected code-level enforcement, run that installer through Rebon's native shell, return `adapter_restart_required`, and stop. The fresh Rebon session loads the new MCP bridge and resumes Mode Gate. If the installer is absent or fails, return `instruction-guided`.
4. For code-level enforcement, call `devskill_guard_enable` through `Mcp`, then call `devskill_guard_status`. Only `{ name: "rebon", capability: "mutation-guarded" }` is matching adapter evidence. For the soft choice, call `devskill_guard_disable` when the availability call succeeded. An enable or status failure returns `instruction-guided`; it never changes mode admission.
5. When code-level enforcement remains active after Mode Gate admits the base profile, call `devskill_guard_admit` through `Mcp` with its provider, host, and mode, then read `devskill_guard_status`. A failed profile write returns `instruction-guided`; Route continues without a Guard claim.
6. Under a matching capability, use the configured adapter session for every Guard call through `Mcp`. File-tool targets are normalized absolute forward-slash paths. A guarded `Bash` or `PowerShell` target is its exact command string. Do not claim third-party MCP mutation interception.
7. Use the Host Enforcement reference only when a matching native capability maps an active declared checkpoint. Do not report `enforced` without that exact native interception.
8. Select each native tool only when its calling operation needs it.

| Need | Native tool | Use | When unavailable |
|---|---|---|---|
| `one-shot` parallel card | `Agent` | One terminal independent card | Rebon strategy selection |
| `full-rebon` parallel card wave | `Workflow` | Outer dispatcher for result-safe cards | Rebon strategy selection |
| Worker inside full Rebon Workflow | `Agent` | Matching specialized role or explicit `general-purpose` | No raw outer-dispatch fallback |
| Multiple Plan or Work slices | `TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate` | Durable current waypoint | Calling-family Markdown waypoint |
| Card requires typed final data | `StructuredOutput` | Persist one valid terminal result | Calling-family recovery |
| Selected planning operation | `EnterPlanMode`, plan tools, `PlanLedger`, `ExitPlanMode` | Native planning surface | Calling-family plan procedure |
| Shared native team is selected | Current team or coordinator schema | Bounded task ownership only | Workflow or calling-family procedure |

9. Under `one-shot`, at `one_shot_dispatch_ready`, issue one direct `Agent` call per independent card in the same native tool block. Each call uses `description`, its complete `prompt`, and `subagent_type: "general-purpose"`; each prompt names one absolute, write-disjoint result target and says the worker decides independently. Do not request a follow-up turn from a one-shot worker.

   **Visibility note (rebon host).** `Agent` can be absent from the visible tool list and from `ToolSearch` results while dispatch still works. When no native `Agent` call is exposed, dispatch through `run_code` with the positional call `await tools.invoke('Agent', { prompt })` — arguments are positional, and the `{tool_name, arguments}` object shape is rejected. One worker per `run_code` program: a parallel wave inside one program is killed at the program budget and its results are unrecoverable. Treat the returned `final_text` as convenience; require the worker to write its declared target itself, because the result's `output_file` field may be null even when the worker wrote a file.
10. Consume a one-shot result only when `status` is `completed`, `error` is null, and its declared target exists. In `parallel-optimized`, that target contains the card's declared structured result. `final_text` is convenience only. Use relevant successful `subAgentToolCalls` and the declared artifact to verify a claim; when structured artifact and narrative conflict, the declared artifact is the result. A failed, absent, or nonterminal one-shot card returns its exact gap to the calling operation and never satisfies a required assignment.
11. Under `full-rebon`, at `native_dispatch_ready`, use `Workflow` for one ready real card in the foreground. Require its declared persistent target before launching remaining independent cards. Then use `Workflow` as their outer dispatcher. `Agent` is a Workflow worker, never a raw outer-dispatch fallback.
12. A `runId`, `async_launched`, UI state, `agentCount`, or Task ledger entry is not full-Rebon card evidence. After a Workflow launch, require every declared target. A registration error, a failed Workflow notification, `agentCount` different from declared cards, or an absent required target returns the exact gap to the calling operation. Do not retry the unchanged wave, claim a card ran, silently downgrade mode, or dispatch it inline.
13. A direct native-tool rejection after a current preflight returns to Rebon strategy selection without retroactively invalidating the selected execution mode. If a required one-shot `Agent` or full-Rebon tool was available earlier in the same session and then disappears, preserve completed targets and require a fresh Rebon session; do not loop strategy selection against the degraded surface.
14. DevSkill Context Optimization never invokes `/ultrawork`; its Plan family never invokes `/ultraplan`; neither strategy invokes `/ceo` by default. A directly requested Rebon feature mode requires its exact current tool and return path before activation. If activation removes a required current tool, stop that operation, preserve completed targets, and require a fresh Rebon session before resuming it.
15. In sequential modes, use the sequential runner. Never call `agent()` or `parallel()`.
16. When the selected Rebon operation needs planning or escalation and its native plan tools are exposed, use `EnterPlanMode`, plan tools, `PlanLedger`, and `ExitPlanMode`.
17. Return each declared native task, one-shot Agent, Workflow, or structured result at `native_result_returned` to its calling family or module.

## Parallel role binding

For `one-shot`, bind `subagent_type: "general-purpose"`; no specialized one-shot selector is proven.

For every `full-rebon` subagent task in either parallel mode:

1. Inspect the current role selector; use `ToolSearch` only when it is unknown.
2. Select the available specialized role that best matches the task.
3. If no specialized role fits, bind `general-purpose` explicitly.
4. If a requested role conflicts, its selector is unavailable, or the role is ambiguous, reclassify and choose the best available role; use `general-purpose` only when no specialist fits.

Apply the full-Rebon binding to Workflow cards, parallel branches, pipelines, nested delegates, recovery, review, verification, and continuation tasks. Rebon role binding never applies to non-Rebon hosts.

## Result-safe parallel dispatch

Before dispatch, every parallel card declares its card id, bounded result shape, result consumer, and exact persistent result target. A reader, planner, reviewer, verifier, or other non-mutating worker writes its completed result to that target before its final reply. An implementer persists its write-disjoint changes and concise result at its target. The parent or resumed declared consumer reads those targets; UI status, a worker id, a Task list, and an unreturned in-memory result are not result evidence.

When `mutation-guarded` enforcement is active, the current binding includes each exact worker result target before dispatch. If the operation cannot supply a target or the current host cannot return a worker result or preserve its target, do not dispatch that card in parallel; return the exact Rebon strategy gap to Mode Gate and preserve the selected execution mode.

When a one-shot, Workflow, or parent call ends before all results return, return completed targets and each absent target as missing evidence to the owning operation. A missing card never satisfies a required result or review assignment. Do not retry an unchanged lost wave or treat UI-completed workers as findings.

## Structured output

- Separate bounded evidence reading from planning, review, decision, and synthesis. Use the Context Optimization reference before a card consumes source material.
- Under `full-rebon`, require one valid `StructuredOutput` result where the Rebon operation requires it. Persist that result at the card's declared target immediately and treat it as terminal before later worker state can discard it.
- Under `one-shot` in `parallel-optimized`, require the declared structured artifact at the card's target; the worker has no follow-up output turn.
- Distinguish `structured_output_missing`, `iteration_budget_exhausted_before_output`, and `structured_output_received_but_worker_continued`.
- After an oversized evidence card fails, preserve its useful evidence and split the remaining frontier. Do not retry unchanged broad scope.
- Only `parallel-optimized` may recover with a smaller result shape: `full-rebon` uses one explicit structured-output call; `one-shot` uses its smaller declared structured artifact.

## Returns

| Result | Consumer |
|---|---|
| Selected Rebon strategy unavailable | Mode Gate strategy selection; preserve the selected execution mode |
| First-time Rebon adapter setup | Mode Gate; installer then one fresh Rebon session |
| Missing optional native task or plan tool | Calling family Markdown procedure |
| Native task, one-shot Agent, or Workflow result | Calling family or module |
| Persisted structured result | Declared consumer |
| Missing or failed native operation | Calling family recovery |

Rebon task state, display, and Workflow completion never grant human authority, replace Review, or close a roadmap item.
