# Plan family

## Lifecycle

```text
accepted Design result
  -> project and architecture facts
  -> candidate plan operation
  -> Wavefront map when current and future outcomes must be separated
  -> Review when findings are needed
  -> Decision when the output is semantic
  -> specification and tickets
  -> approved Work handoff | Design or Research return
```

Plan owns lifecycle order, module calls and returns, and terminals. It does not own architecture, specification, ticket, Research, Review, or Decision procedures.

## Runtime calls

| When | Load | Return to |
|---|---|---|
| Existing architecture or friction must be understood | [Improve Codebase Architecture](modules/improve-codebase-architecture.md) | Survey or Design return to Plan |
| A new architecture or seam is needed | [Codebase Design](modules/codebase-design.md) | Candidate architecture to Plan |
| A consequential plan spans operations, sessions, or actors | [Two-Layer Development Planning](modules/two-layer-development-planning.md) | Paired candidate view to Plan |
| Accepted decisions must be classified as current Work, triggered future Work, or no Work | [Review](modules/review.md), then [Decision](modules/decision.md) | Semantic disposition to the Plan decision-to-outcome map |
| An admitted optimized Wavefront initialization needs context fit | [Context Optimization](modules/context-optimization.md) | Bounded Plan sources or read-free synthesis to the current Plan operation |
| A requirement contract is needed | [To-Spec](modules/to-spec.md) | Candidate specification to Plan |
| Work must be decomposed | [To-Tickets](modules/to-tickets.md) | Candidate ticket set to Plan |
| Terms or source facts are missing | [Domain Modeling](modules/domain-modeling.md) or [Research](modules/research.md) | Resolved input or upstream return to Plan |
| Planning needs bounded human-experience evidence | [Prototype](modules/prototype.md) | Evidence to the current Plan operation |
| Human-owned planning meaning, priority, or authority is unresolved | [Grilling](modules/grilling.md) | Accepted rule or next human question to Plan |
| A final Grilling decision record governs planning | [Grilling](modules/grilling.md) | Exact scope and intent, accepted decisions, crosswalk, and roadmap disposition bind the plan outcome, specification, tickets, and closure-unit selection |
| A plan candidate needs findings | [Review](modules/review.md) | Findings to the current Plan operation |
| A frozen plan candidate has a semantic choice | [Review](modules/review.md), then [Decision](modules/decision.md) | Findings and semantic disposition to the current Plan operation |
| A `mutation-guarded` host enters or advances a Plan boundary | [Host Enforcement](modules/host-enforcement.md) | Exact checkpoint-scoped roadmap, ticket, or decision-record mutation; `instruction-guided` when no interception exists |

## Checkpoints

| When | Checkpoint | Allows |
|---|---|---|
| Accepted Design result and current planning obligation are present | `plan_operation` | The matching planning module operation |
| A module returns a material plan result | `plan_closure` | Determined Work handoff, declared return, or the existing gap call |

Read a final Grilling record's roadmap disposition before creating or changing a roadmap. `update current roadmap` changes only its record-declared relevant current slice or phase in place, preserving all other roadmap scope. `create new roadmap` begins a new roadmap only after Grilling's combined readiness result. If the disposition is absent, return to Grilling for one bounded choice; Plan does not infer it.

## Wavefront planning

Wavefront is a Plan operation, not a module or tracker. For a scope governed by a final Grilling record, it runs after that record and, when consequential, its Two-Layer view, but before roadmap creation and ticket compilation. It runs for an explicit Wavefront request, a selected bounded Wavefront option, an accepted planning transition with an unclassified decision, multiple eligible outcomes without a determined next outcome, or a known provisional limitation. A casual named-scope planning cue offers one bounded option before broad reading. Otherwise Plan remains ordinary planning.

| Disposition | Required Plan result |
|---|---|
| `current` | One outcome becomes a roadmap slice and candidate Work path now |
| `future` | A useful, non-blocking outcome has current outcome, remaining behavior, limitation, exact reconsideration event and evidence pointer, and final consumer |
| `no Work` | Accepted decision and scope determine that no implementation outcome is needed |

| Map field | Content |
|---|---|
| Source decision | Exact accepted decision or accepted Design rule the row consumes |
| Disposition | `current`, `future`, or `no Work` |
| Outcome | The observable behavior or scope result for the row |
| Future detail | Required only for `future`: current outcome, remaining behavior, limitation, reconsideration event, evidence pointer, and final consumer |
| No-Work basis | Required only for `no Work`: exact accepted scope or decision that excludes implementation |

At `plan_operation`, size only the named scope, active roadmap, final Grilling record, and directly linked Design, Plan, Work, or Release sources before reading. If no authoritative source set is available, ask one focused question. A structural candidate check reads current authoritative pointers only; broad initialization requires its accepted planning transition. In an admitted optimized mode, use the matching Context Optimization reference for this bounded read. A normal-mode capacity failure returns to Mode Gate with an optimized mode suggested.

Create one decision-to-outcome map before roadmap creation and ticket compilation. Map every accepted decision to `current`, `future`, or `no Work`. Use Review then Decision only when the mapping is semantic. Research and Prototype return exact readiness evidence; they never promote a future outcome. At `plan_closure`, return the map to the declared roadmap, specification, ticket, Work, or upstream consumer.

A validation gap needed to interpret an affected change is `current` before that change; it does not promote unrelated validation repair.

Future work re-enters Plan only from its linked dependency, exact Research or Prototype evidence change, changed user goal, priority, or constraint, observed workload scale, target platform condition, measured performance budget breach, named task or handoff resumption, or Plan-declared operating milestone or shipment closure. Read only linked items. At an operating milestone or shipment closure, each linked provisional resolution becomes current implementation, an already-covered exact accepted scope result, or a Grilling scope amendment; otherwise return to Plan. Passing current-slice checks never closes remaining final behavior silently.

Under `mutation-guarded` enforcement, only an exact roadmap, ticket, or decision-record state-changing action uses the matching Plan binding and exact target. Reads, source sizing, and mapping remain unguarded. This adds no Plan-specific Guard protocol.

When an accepted Design result or final Grilling decision record covers a complete planned outcome, declare its smallest closure unit from that scope and the planned tickets: one complete implementation, one phase, the roadmap, or a merge. An unresolved unit choice uses Review then Decision. A roadmap unit closes every planned phase before the full roadmap. A Work slice contributes to a closure unit; a checkbox does not create one.

Every plan candidate that selects, recommends, narrows, or records an option follows Review then Decision. After each module or meaningful internal operation return, apply bounded closure with Plan's current goal, accepted constraints, and declared consumer. A determined result follows that consumer mechanically; a factual gap returns to Research, an experience gap returns to Prototype or human, human-owned meaning returns to Grilling, and a frozen semantic candidate uses the existing Review then Decision call. A complete approved ticket set hands off to Work; missing accepted Design meaning returns to Design.

## Terminals

`plan_to_work`, `plan_to_design`, `plan_to_research`, and `plan_blocked`.
