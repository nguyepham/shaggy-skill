# Mode gate

## Contract

Mode Gate alone owns provider and host evidence, suggested mode and host, optional Rebon parallel strategy and host-adapter selection, human confirmation, governance, roadmap intent, capability validation, admission, and mode re-entry. Only a selected mode or Rebon parallel strategy's missing capability returns `mode_not_admitted` before task work.

## Runtime references

| When | Load | Return or use |
|---|---|---|
| Rebon may offer code-level enforcement | [Rebon host adapter](successor-v0/modules/rebon-host-adapter.md) | Optional `mutation-guarded` capability or `instruction-guided` to Mode Gate |
| Code-level enforcement is active at an owner checkpoint | [Host Enforcement](successor-v0/modules/host-enforcement.md) | Exact guarded checkpoint result to its caller |
| Admission confirms an optimized mode | [Context Optimization](successor-v0/modules/context-optimization.md) | Context-fit operation after admission; it never decides the mode |
| Admission completes | [Route](successor-v0/stage-0-route.md) | One family, overlay, or Route terminal from the admitted profile |
| An admitted governance problem changes design meaning, authority, or scope | [Grilling](successor-v0/modules/grilling.md) | Accepted rule or next question under the selected governance profile |

## Inputs

Read trusted provider and host capability metadata without asking a provider question. A host adapter is optional enforcement evidence; it does not prove a mode or host identity. Do not use model names or installed commands as host identity.

## Evidence-based suggestion

Use trusted host or session metadata, then the named adapter configuration and documented environment variables. Establish provider, host, usable subagents, context capacity, workload, and display support without exposing secret values.

### Evidence precedence and operation

1. Trust runtime host/session metadata first.
2. If a field remains unresolved, inspect only the named adapter's documented environment-variable names and host configuration or adapter probe. Do not enumerate arbitrary environment variables or infer locality from a model name, URL shape, or speed.
3. Normalize evidence into provider kind, host kind, usable subagents, context capacity, workload request, and display support. Keep only the current sources and classifications; never expose secret contents.
4. Compile at most one suggested mode and one suggested host with the supporting capability evidence. Conflicting evidence fails closed; do not merge profiles.
5. Present one evidence-supported host and mode suggestion for human confirmation before mode selection. After a supported host resolves, offer its host-adapter selection only when its nonblocking probe succeeds. Governance never bypasses these confirmations.
6. Missing capability evidence, unresolved provider/session identity, or a conflicting suggestion returns the existing typed unresolved/admission failure. Never invent a suggestion or capability proof.

Provider discovery authorizes DevSkill routing only; it does not grant project-runtime authority, approval, publication, or human decision power.

## Delegated profile

A delegated task inherits its parent's admitted host, mode, Rebon parallel strategy, host-adapter selection, and relevant task boundary. It does not rerun mode selection or prove nested subagent capacity. A changed host, mode, Rebon parallel strategy, host-adapter selection, scope, or consumer returns to Mode Gate.

## Admission order

1. Validate trusted provider/host capability evidence in a supplied inherited profile; when its delegated-task bindings match, reuse it and emit the admitted profile.
2. Without a valid inherited profile, read provider metadata and capability evidence before asking for mode, host, or roadmap intent.
3. Normalize the evidence and compile one suggested host and mode.
4. Ask the human to confirm the suggestion. If the human declines or evidence is unresolved, ask mode first from the four choices, then host. Do not inspect provider evidence again.
5. When the selected host is `rebon` and the selected mode is parallel, resolve the Rebon parallel strategy.
6. When the selected host has an adapter, use its matching Runtime reference to probe the current native bridge before presenting a host-adapter choice. A missing Rebon bridge with a package installer returns `adapter_setup_required`. After the human selected code-level enforcement, the adapter runs that installer and returns `adapter_restart_required`; tell the human to open one fresh Rebon session, then stop this admission. A failed probe without an installer retains `instruction-guided` and never changes mode admission. For a code-level choice with a live bridge, enable and read matching status. An enable, status, or profile-write failure retains `instruction-guided`, reports unavailable enforcement once, and continues admission. For the soft choice, disable a present bridge.
7. Resolve `roadmap_checkbox_update` after host-adapter selection and before implementation only when the task uses a roadmap checkbox. It records a later checklist update; it does not choose a review route or axis. Resolve governance only when the user names or accepts roadmap or session-goal continuation.
8. At `admission_evaluated`, validate the selected mode and Rebon parallel strategy against their capability: usable parallel execution for parallel modes, current direct one-shot `Agent` handle for `one-shot`, result-safe `Workflow` for `full-rebon`, structured persisted result plus bounded recovery for `parallel-optimized`, and planning tools plus durable handoff for `sequential-optimized`.
9. At `admission_returned`, write the profile to Guard only when code-level enforcement remains `mutation-guarded`. Then announce the admitted host, provider, mode, Rebon parallel strategy when selected, host-adapter result, subagent use, Context Optimization use, and roadmap intent once. Admission is capability only: it does not begin an operation or authorize a state change.

## Admission representation

```text
trusted evidence
  -> suggested host and mode
  -> confirmed suggestion | explicit mode choice
  -> host choice when required
  -> Rebon parallel strategy when applicable
  -> optional host-adapter overlay
  -> roadmap or governance choice when relevant
  -> capability validation
  -> admitted | mode_not_admitted
```

No state silently advances. Conflicting evidence, unresolved identity, a missing selected-mode capability, or an invalid host-mode pairing returns `mode_not_admitted` and asks only for the missing decision. Missing enforcement retains `instruction-guided`.

## Checkpoints

| When | Checkpoint | Allows |
|---|---|---|
| Trusted evidence and required human confirmations are available | `admission_evaluated` | Capability validation and one admitted profile or `mode_not_admitted` result |
| Profile fields and capability validation pass, or a required field fails | `admission_returned` | Route receives the admitted profile or stops at `mode_not_admitted` |

## Mode selection

Show exactly these four choices:

| Choice | Delegation | Context handling | Required capability |
|---|---|---|---|
| `parallel-normal` | parallel bounded tasks | normal context | parallel task execution and usable subagents |
| `parallel-optimized` | parallel bounded tasks | optimized context | parallel task execution, usable subagents, structured output, bounded recovery |
| `sequential-normal` | one task at a time | normal context | sequential execution |
| `sequential-optimized` | one task at a time | optimized context and handoff | planning tools and durable handoff |

The selected value is the execution mode. Provider evidence may suggest one, but it is not admitted until confirmed or selected. `Not sure, help me narrowing it down.` is a decision-support choice, not a fifth mode: ask one mode-fitting question at a time and retain the same choice until a mode is selected.

Context Optimization runs only in the two optimized modes through the Runtime reference. A normal-mode context failure returns here with an optimized mode suggested; it never silently becomes an optimized run.

If a trusted user-authored mode preference exists in agent memory, announce it and present the same four choices for confirmation or override. DevSkill stores no preference. On a persistence request, direct the host to save the confirmed mode outside this package.

## Capability validation

| Mode | Required capability |
|---|---|
| `parallel-normal` | parallel task execution and usable subagents |
| `parallel-optimized` | parallel task execution, usable subagents, structured output, and bounded recovery |
| `sequential-normal` | sequential execution |
| `sequential-optimized` | sequential execution, planning tools, and durable handoff |

Use current host capability evidence for the selected mode only. Host adapters, Guard status, task ledgers, and host-specific operation tools never participate in mode admission.

On missing capability, return `mode_not_admitted`, identify the missing capability, and show the four choices again. Do not silently change the mode.

After admission, a selected operation can lose a host-native tool without changing the admitted profile. Its owning adapter returns current-operation recovery; it never retroactively returns `mode_not_admitted` or silently changes mode.

`sequential-optimized` requires a usable continuation location. Missing continuation capability returns `mode_not_admitted`; it does not permit an oversized direct read.

## Rebon parallel strategy

Resolve only when host is `rebon` and mode is `parallel-normal` or `parallel-optimized`. Ask exactly:

> For Rebon parallel work, use one-shot subagents only or the full Rebon toolset?

| Choice | Native path | Required capability |
|---|---|---|
| `one-shot` | Direct `Agent` fan-out, collection, fan-in, and verification | Current direct `Agent` handle; terminal return with a declared result target for each card |
| `full-rebon` | Current Rebon Workflow, task, planning, team, and structured-output operations when selected | Result-safe current `Workflow`; plus structured persisted result for optimized mode |

`Not sure, help me narrowing it down.` is decision support, not a third strategy: ask one question about whether the work needs only independent one-shot cards or Rebon-native Workflow coordination. A missing selected strategy capability returns `mode_not_admitted` and shows these two choices again. Task or planning tools absent from an operation that does not need them never reject either strategy.

## Host

| Evidence | Host |
|---|---|
| Trusted Rebon runtime metadata | `rebon` |
| Rebon's native MCP bridge is available | `rebon` |
| Trusted non-Rebon runtime metadata | `non-rebon` |
| No trusted host identity | ask one host question; remain non-admitted until answered |

## Host-adapter selection

Only a supported host with a current native bridge has a host-adapter choice. The agent runs the matching adapter availability operation before asking. Ask exactly:

> Use code-level host enforcement for this session, or use the instruction-guided skill?

| Choice | Choose when | Required live state | Result |
|---|---|---|
| Use code-level enforcement | A weaker model needs host-side behavior enforcement | Matching bootstrap enables and then reports `mutation-guarded` | Retain `mutation-guarded` for Host Enforcement classification |
| Use instruction-guided skill | A smart model can follow the runtime instructions directly | Deactivate a matching bootstrap when present; no bootstrap is required | Retain `instruction-guided` |

The matching adapter owns first-time setup, bootstrap, native status, bounded recovery, and session lifecycle. On `adapter_setup_required`, it runs its package installer after the human selected code-level enforcement; `adapter_restart_required` asks the human only to open one fresh host session. Otherwise the agent invokes its native bridge directly and never tells the user to run a slash command or launcher. Call `devskill_guard_enable`, then require matching status; after base admission completes, write the profile with `devskill_guard_admit` and reread status. The configured bridge supplies its exact host adapter and session. On any adapter failure, retain `instruction-guided` and continue the admitted Markdown runtime without an enforcement claim. On the soft choice, deactivate a present bridge; otherwise remain `instruction-guided`. The native hook remains dormant and session end releases it and stops the Core. A host without a current bridge or installer has no host-adapter choice and remains `instruction-guided`.

An installed command, provider, model, endpoint, or Agent capability does not establish host identity.

## Roadmap checkbox

Resolve `roadmap_checkbox_update` as `yes` or `no` before implementation only when the task uses a roadmap checkbox. Ask one question only when the task does not resolve it. `yes` permits a matching Plan-declared closure unit to update that checkbox after its required review passes. It never selects a review route or axis: every implementation slice uses separate Standards and Specification findings, and only the matching accepted Design result or final Grilling record plus Plan may use three axes. `no` leaves no checkbox update to perform.

Resolve `merge_pr_review` as `yes` or `no` before a merge-PR review. `yes` permits its matching Plan-declared merge closure after required review passes; it does not select the review axes.

## Governance profile

Resolve the governance profile only when the user names or accepts roadmap or session-goal continuation; never on internal re-entry or checkpoints. Ask exactly:

> Are you the project tech lead and do you know the project design well enough to guide the junior developer?

| Answer | Profile | Continuation | Problem handling |
|---|---|---|---|
| Yes | `lead_ungoverned` | Continue until every goal explicitly set by the user in the current session is complete; a goal the user sets mid-session enters the scope as it is set | Use the Grilling reference with the reviewer, apply the recommended solution automatically, and do not add a user-confirmation stop |
| No | `pair` | Do not enable ungoverned continuation | Use the Grilling reference with the reviewer and user; a blocker that changes design meaning, authority, or scope, or crosses a permission boundary, pauses for the user's decision; a mechanical blocker is fixed and reported without stopping |
| Unclear | `governance_unresolved` | Do not enable ungoverned continuation; the session proceeds governed | Ask one bounded follow-up that restates that lead applies recommended fixes without stopping and pair pauses for decisions, and request an explicit lead or pair; never infer a profile |

Under `pair`, classify each blocker by its nature as it arises; never defer classification or batch decisions.

When the last in-scope goal completes, `lead_ungoverned` terminates: announce completion and stop. The agent never adds goals and never rolls into roadmap items from earlier sessions.

The governance question re-fires only at the user's next explicit continuation selection — after a `lead_ungoverned` termination, from the `governance_unresolved` state, or on the user's explicit profile change.

Permission and authority enforcement belongs to the agent setting, not this skill; it fires regardless of profile, and `pair`'s pause never overrides it. The skill never grants authority and adds no gate-checking rules. Continued execution, a reviewer recommendation, or a Rebon task status is never permission.

Announce the selected profile once — with the admitted profile when governance resolves during admission, and at the moment of resolution when it resolves after admission; internal re-entry stays silent.

## Admission result

Admission requires resolved host, provider, mode, applicable Rebon parallel strategy, and selected capability fit. It also requires a roadmap answer only when the task uses a roadmap checkbox and a governance answer only for session or roadmap continuation. Host-adapter selection changes only the enforcement overlay. Plan selects any later closure unit from the final Grilling record and matching plan. `route_status=admitted` is required before repository work, but it is not a current operation, mutation authority, or generic activation marker.

## Recovery

- Missing provider/session identity or conflicting evidence returns the typed unresolved/admission failure; it cannot produce an admitted profile or invented suggestion.
- Missing host identity returns one host question and remains non-admitted.
- Missing mode or Rebon parallel strategy capability returns `mode_not_admitted` without changing the selected value.
- A selected Rebon code-level adapter with no current bridge but a package installer returns `adapter_setup_required`; after the installer runs, `adapter_restart_required` stops admission until one fresh Rebon session exists.
- A selected code-level host adapter bootstrap, matching status, or profile write is missing retains `instruction-guided`; it never changes mode admission.
- Conflicting or insufficient provider evidence returns the typed unresolved/admission failure; it never produces an invented suggestion or silently changes the selected mode.
- Changed host, provider, mode, Rebon parallel strategy, roadmap-checkbox intent, or governance profile invalidates the profile and reruns admission order. A host-adapter change reclassifies the enforcement overlay only.

## Completion

Complete only when the profile fields are present, selected-mode capability validation passes, and `route_status=admitted`.
