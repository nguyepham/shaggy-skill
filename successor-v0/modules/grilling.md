# Grilling

## Trigger and boundary

Run Grilling for an unresolved human-owned design, meaning, priority, trade-off, or authority question. A user naming Grilling is sufficient; an equivalent accepted decision is a constraint, not a new question.

Grilling owns the decision frontier, reviewed question presentation, exact human answer, and accepted-decision return. Review owns findings and Decision owns semantic disposition.

## Frontier terms

| Term | Meaning |
|---|---|
| Ready frontier | Unresolved questions whose controlling facts and accepted constraints are available |
| Independent questions | Questions whose answers do not change each other's options or authority |
| Pointy question | A question the human resolves by selecting an option or its reviewer fix without redefining it |
| Narrower question | The next question that resolves only the ambiguity left by the prior answer |

## Runtime references

| When | Load | Return or use |
|---|---|---|
| Each option needs findings before the human answers | [Review](review.md) | Standards and Specification findings for each option |
| Options, facts, and human intent are ready for semantic disposition | [Decision](decision.md) | Surviving options, invalidations, and recommendation for presentation |
| Grilling needs the Human Intent State term | [Decision](decision.md) | Current observation, desired outcome, Value Gap, protected meaning, ambiguity, and hypothesis for the question |
| A controlling fact is missing | [Research](research.md) | Evidence or factual frontier for the next question |
| Human experience or value must be observed | [Prototype](prototype.md) | Bounded evidence or a human return |
| A packet needs rendering | [Write](write.md) | Rendered packet without changed questions or options |
| A final-design crosswalk needs semantic validation | [Decision](decision.md) | One validated closure packet or one bounded Grill question for each applicable unmapped item |
| A completed Grill needs its final decision record | [Domain Modeling](domain-modeling.md) | Exact final decisions at the caller-authorized project location |
| A compatible host enters or advances a declared Grilling boundary | [Host Enforcement](host-enforcement.md) | Checkpoint-scoped entry or advance; `instruction-guided` when no interception exists |

## Checkpoints

| When | Checkpoint | Allows |
|---|---|---|
| Ready frontier, options, and reviewer findings are available | `packet_reviewed` | Advance to Decision `decision_started`; on `decision_returned`, present the packet and await an exact human answer |
| The human gives an exact answer | `answer_received` | Retained accepted rule, narrower question, or advance to `final_closure_started` |
| No current or dependent narrower question remains and the whole crosswalk candidate is prepared | `final_closure_started` | Advance to Decision `decision_started`; on `decision_returned`, advance to `final_closure_checked` or return one bounded Grill question |
| No current or dependent narrower question remains and one final-design closure packet has checked every item | `final_closure_checked` | Advance to `record_ready`, one bounded return, or new-roadmap readiness that advances to `record_ready` on acceptance |
| A completed Grill's exact final decisions and a caller-authorized project location are available | `record_ready` | Advance to Domain Modeling `exact_write` for its sole final decision-record write |

## Operation

1. Search accepted decisions for the same module and operation. Open a question only for a demonstrated conflict, missing retained behavior, or unresolved human meaning.
2. Form the ready frontier. Present independent, pointy questions together; otherwise ask one bounded question at a time.
3. Draft exactly three substantive mutually exclusive options plus a fourth option exactly: `Not sure, help me narrowing it down.`
4. Use the Review reference for Standards and Specification findings for each option. Mark them as reviewer findings.
5. At `packet_reviewed`, use the Decision reference with options, facts, Human Intent State, and findings. Present its surviving options, invalidations, and recommendation without changing their meaning.
6. At `answer_received`, preserve the exact human answer in the current Grill. Do not return it to a consuming operation before `record_ready`. Do not reopen an exact answer through Review or Decision.
7. A `Not sure, help me narrowing it down.` answer starts one narrower question with the same fourth option. It does not close the current question.
8. Return a missing controlling fact or factual fog to Research. Return an experience or value question to Prototype or the human. Multi-party participation receives a shareable packet and returns its exact answer here.
9. When no current or dependent narrower question remains, advance to `final_closure_started` with one final-closure candidate: scope and intent, every accepted decision and in-place supersession, the whole final-design crosswalk, and selected roadmap disposition or `absent`. Map an item mechanically only when exact accepted decisions and scope determine it. Use Decision once with that candidate, applicable facts, Human Intent State, and findings. Decision confirms only supported `resolved` or scope-linked `not needed` statuses. Every applicable unmapped item returns as one bounded Grill question; Grilling owns it.
10. At `final_closure_checked`, retain every accepted decision and the checked crosswalk. If roadmap disposition is absent, ask one bounded choice: `update current roadmap` or `create new roadmap`. Do not infer scope or importance. For `update current roadmap`, prepare only the affected accepted-decision entries and crosswalk-row delta; preserve every other row. Domain Modeling performs the durable in-place amendment. An uncertain affected mapping returns to one bounded Grill question.
11. For `update current roadmap`, enter `record_ready`. For `create new roadmap`, present one combined readiness result. The human responds `ready for roadmap` or names one exact crosswalk row or accepted rule to reopen; an unnamed refusal receives one clarification. `ready for roadmap` enters `record_ready`; a reopened item returns to this Grill. The readiness result does not replace normal `record_ready` or a declared next consumer.
12. At `record_ready`, advance to Domain Modeling `exact_write` to write the Final decision record before a consuming operation begins.

## Presentation

Every question uses these sections in order:

| Section | Content |
|---|---|
| What it decides | The exact rule or boundary the answer will settle |
| Background | Only accepted facts and source pointers needed to choose |
| Question | One bounded unresolved choice and its four options |
| Reviewer findings | Per-option findings from Standards and Specification review |
| After choice | Decision invalidations, surviving options, recommendation or `No recommendation; human choice.`, return effect, and remaining ready frontier with dependencies or `None; final record / declared consumer follows.` |
| Exact answer and accepted rule | Unchanged human answer and the rule it accepts |

The Reviewer findings options table has exactly: Option, What's wrong, Why it matters, Failure scenario, Bottom-line fix. Use `Failure scenario`, never `Example scenario`. Link the relevant current source material when it supports an option. Use the Write reference when packet rendering is needed.

## Final decision record

Product, Architecture, and Program Design are final-record categories, not Review assignments.

| Part | Content |
|---|---|
| Scope and intent | Resolved question set; current observation, desired outcome, success measure, and Value Gap |
| Accepted decisions | Every question, exact human answer, accepted rule, declared next consumer, and only current in-place supersession |
| Final design crosswalk | Every fixed item with `resolved` plus exact decision sources, or `not needed` plus its scope reason |
| Roadmap disposition | `update current roadmap` or `create new roadmap`; new-roadmap readiness result when applicable |

| Group | Item | Include |
|---|---|---|
| Product | Problem to solve | The Value Gap this scope closes |
| Product | Success measure | The observable result that closes it |
| Product | Desired behavior | The required behavior or outcome |
| Product | Visual behavior or mockup | A user-facing surface, or `not needed` |
| Architecture | System design | The system boundary and flow |
| Architecture | Component contracts | Inputs, outputs, and ownership between components |
| Architecture | Data models | Terms, data, and relations that the scope changes |
| Architecture | Constraints | Accepted limits the solution must preserve |
| Program Design | Types and method signatures | Public program interfaces when code shape is in scope |
| Program Design | Test approaches and seams | Validation boundary and observable seam |
| Program Design | Program layout and call stacks | Runtime call flow when execution layout is in scope |
| Program Design | Component trees and dependency injection | Composition boundary when components or injection are in scope |

## Record reminder

After five accepted but unrecorded rounds, ask once whether to create or update one working grilling record. If yes, update that same record after each later group of five unrecorded rounds. If no, do not ask again in that grilling session. This optional live record preserves the current packet through compaction; it is not a history copy. At session end, `final_closure_checked` then `record_ready` writes the final decision record. Remove a working record only when it duplicates that final record. Domain Modeling performs any durable write without changing the reviewed question, options, findings, or answer.

## Returns

| Condition | Consumer |
|---|---|
| Accepted rule while the Grill remains open | This Grilling session |
| Final-design item needs an exact human rule | Next Grilling question |
| Final decision record | Declared consuming operation |
| Invalidated option or unresolved priority | Next Grilling question |
| Missing controlling fact | Research |
| Human experience needed | Prototype or human |
| Multi-party answer | This Grilling session |
