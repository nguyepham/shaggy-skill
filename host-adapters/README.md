# Host adapters

Optional host integrations. Without an installed adapter, DevSkill remains `instruction-guided`.

## Release installation

The repository already contains every adapter source. Use this folder directly after a full repository install.

If you installed `DevSkill-Unslop-2.4.1-soft-guide.zip` instead, you have the full instruction-guided skill: it trusts the model to follow DevSkill without host-enforcement code. Add the shared `DevSkill-Unslop-2.4.1-guard-core-patch.zip`, then one host patch into that same skill folder only when code-level enforcement is needed.

| Host | Patch | Next step |
|---|---|---|
| Rebon | `DevSkill-Unslop-2.4.1-rebon-adapter-patch.zip` | [Rebon setup](./rebon/README.md) |

The Core patch is shared. Do not install a host patch without it.

Install the Rebon adapter once. At DevSkill admission, Rebon asks whether to use code-level enforcement or the instruction-guided skill. The first enforcement selection installs Guard Core's locked npm dependency, configures the bridge, and needs one fresh Rebon session. The host bootstrap stays dormant until code-level enforcement is selected, then starts the Core and activates the matching session. The soft choice deactivates it; host-session exit releases only that session. A smart model can use the instruction-guided skill directly.

## Boundary

| Owns | Does not own |
|---|---|
| Host interception | Mode, stage, or semantic choice |
| Guard state | Review, Decision, or completion |
| Native tool and presentation gates | Core-runtime files or manifest |

## Shared guard contract

| Value | Meaning |
|---|---|
| Admitted profile | Confirmed provider, host, mode, and capabilities |
| Current binding | Active owner, checkpoint, allowed state-changing action, exact target, return consumer |
| `enter` | Create the first owner binding selected by Route |
| `advance` | Replace one declared binding with its declared next binding |
| `reject` | Block an out-of-sequence action or presentation without changing guard state |

The adapter calls the Guard; the model never chooses whether to call it. The Guard maps only the portable Mode Gate, Route, and Host Enforcement contracts. It never creates project authority, accepts a review finding, chooses a stage, or declares completion.

## Claim levels

| Level | Required interception |
|---|---|
| `instruction-guided` | No host interception |
| `mutation-guarded` | State-changing tool interception |
| `tool-guarded` | Prompt or context re-entry and state-changing tool interception |
| `full` | Prompt admission, model-dispatch re-entry, state-changing tool interception, and verified outbound engineering-presentation interception |

An adapter may claim only the level its host integration has passed. An MCP server alone is not an interception layer.

## Layout

```text
host-adapters/
  README.md
  guard-core/
    shared guard and MCP server
  rebon/
    Rebon session plugin and launcher
```

Adapters are optional integration packages. Do not add them to `manifest.json` runtime files.
