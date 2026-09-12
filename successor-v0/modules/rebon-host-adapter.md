# Rebon host adapter

## Trigger and boundary

Run when [Mode Gate](../../mode-gate.md) resolves `rebon` host-adapter selection, and after admission when a Rebon operation needs native tools. This adapter owns Rebon-native tools, current schemas, task synchronization, dispatch, structured output, selected native display, and Guard capability classification. It does not choose mode, route, size or partition context, plan, review, decide, implement, verify, or close a DevSkill result.

## Workflow card structure

Use the current schema discovered through `ToolSearch`. Each card must state its bounded objective, matching role, admitted inputs, allowed tools, result shape, consumer, and finite work budget. Only the discovered Rebon schema determines field names or selectors.

## Runtime references

| When | Load | Return or use |
|---|---|---|
| Rebon host admission or its native profile is unresolved | [Mode Gate](../../mode-gate.md) | Admitted Rebon profile or `mode_not_admitted` |
| A Rebon card needs bounded source material | [Context Optimization](context-optimization.md) | Bounded fragments for the card; non-reading cards consume those fragments |
| A Rebon result needs findings | [Review](review.md) | Findings to the calling family; Workflow state never substitutes for them |
| A Rebon-native capability can map an exact declared checkpoint | [Host Enforcement](host-enforcement.md) | Capability-scoped native mapping or `instruction-guided`; no new Rebon schema or authority |
| The Rebon DevSkill Guard MCP server is configured | [Host Enforcement](host-enforcement.md) | Exact `rebon` adapter capability or `instruction-guided` to Mode Gate |

## Checkpoints

| When | Checkpoint | Allows |
|---|---|---|
| Rebon operation needs an unknown native tool, selector, schema, or display capability | `native_profile_ready` | ToolSearch and the matching bounded native operation |
| Native task, Workflow, or structured result reaches its declared consumer | `native_result_returned` | Calling family or module consumes that result without treating native state as authority |

## Operation

1. At `native_profile_ready`, use `ToolSearch` before a Rebon operation whose current tool, selector, schema, or display capability is unknown.
2. When Mode Gate resolves host-adapter selection, inspect `devskill_guard_status` when available. Only `{ name: "rebon", capability: "mutation-guarded" }` is matching adapter evidence. Return it or unavailable interception to Mode Gate; Mode Gate matches the user choice and determines whether admission may continue.
3. Under an admitted matching capability, use the adapter session id for every Guard call. File-tool targets are normalized absolute forward-slash paths. A guarded `Bash` or `PowerShell` target is its exact command string. Do not claim third-party MCP mutation interception.
4. Use the Host Enforcement reference only to map a native capability to an active declared checkpoint. Do not report `enforced` without that exact native interception.
5. Use `TaskCreate`, `TaskGet`, `TaskList`, and `TaskUpdate` for every admitted Rebon operation. Create task entries for explicit plan units; otherwise create one for the operation. Update them as the current situation changes. Task state is a waypoint, never DevSkill authority or completion.
6. In both parallel modes, use `Workflow` as the outer dispatcher. Keep `parallel()`, `pipeline()`, `agent()`, Workflow scripts, escalation tools, and selected native display inside the Workflow.
7. In sequential modes, use the sequential runner. Never call `agent()` or `parallel()`.
8. Use `EnterPlanMode`, plan tools, `PlanLedger`, and `ExitPlanMode` whenever the selected Rebon mode and task call for planning or escalation.
9. Return each declared native task, Workflow, or structured result at `native_result_returned` to its calling family or module.

## Parallel role binding

For every Rebon subagent task in either parallel mode:

1. Inspect available roles with `ToolSearch`.
2. Select the available specialized role that best matches the task.
3. If no specialized role fits, bind `general-purpose` explicitly.
4. If a requested role conflicts, its selector is unavailable, or the role is ambiguous, reclassify and choose the best available role; use `general-purpose` only when no specialist fits.

Apply the binding to Workflow cards, parallel branches, pipelines, nested delegates, recovery, review, verification, and continuation tasks. Rebon role binding never applies to non-Rebon hosts.

## Structured output

- Separate bounded evidence reading from planning, review, decision, and synthesis. Use the Context Optimization reference before a card consumes source material.
- Require one valid structured result where the Rebon operation requires it. Persist that result immediately and treat it as terminal before later worker state can discard it.
- Distinguish `structured_output_missing`, `iteration_budget_exhausted_before_output`, and `structured_output_received_but_worker_continued`.
- After an oversized evidence card fails, preserve its useful evidence and split the remaining frontier. Do not retry unchanged broad scope.
- Only `parallel-optimized` may recover with a smaller result shape and an explicit single structured-output call.

## Returns

| Result | Consumer |
|---|---|
| Current native tool profile unavailable | [Mode Gate](../../mode-gate.md) |
| Native task or Workflow result | Calling family or module |
| Persisted structured result | Declared consumer |
| Missing or failed native operation | Calling family recovery |

Rebon task state, display, and Workflow completion never grant human authority, replace Review, or close a roadmap item.
