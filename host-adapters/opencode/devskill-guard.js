import path from "node:path";

const guardUrl = (process.env.DEVSKILL_GUARD_URL ?? "http://127.0.0.1:7634").replace(/\/$/, "");
const configuredSession = process.env.DEVSKILL_GUARD_SESSION ?? "opencode-default";
const guardEnabled = !new Set(["0", "false", "off", "disabled"]).has(
  String(process.env.DEVSKILL_GUARD_ENABLED ?? "1").trim().toLowerCase(),
);
const mutationTools = new Set(["edit", "write", "patch", "apply_patch", "delete", "move", "rename"]);
const readOnlyShell = [
  /^(rg|grep|find|ls|dir|pwd|Get-ChildItem|Get-Content|Select-String)(\s|$)/i,
  /^git\s+(status|diff|log|show)(\s|$)/i,
  /^(node|npm)\s+--version$/i,
];

let adapterAnnounced = false;

function sessionId() {
  return configuredSession;
}

function nativeTool(input) {
  return String(input?.tool ?? "").trim().split(/[./:]/).at(-1).toLowerCase();
}

function toolArguments(input, output) {
  const candidates = [
    output?.args,
    input?.args,
    output?.input?.args,
    input?.input?.args,
    output?.input,
    input?.input,
  ];
  return candidates.find((candidate) => (
    candidate
    && typeof candidate === "object"
    && !Array.isArray(candidate)
    && Object.keys(candidate).length > 0
  )) ?? {};
}

function shellMutates(command) {
  const value = String(command ?? "").trim();
  if (!value) return true;
  if (/[|;&]|>>?|<|\n/.test(value)) return true;
  return !readOnlyShell.some((pattern) => pattern.test(value));
}

function workingDirectory(input, output) {
  return String(
    input?.cwd
      ?? input?.directory
      ?? output?.cwd
      ?? output?.directory
      ?? process.env.DEVSKILL_GUARD_CWD
      ?? process.cwd(),
  ).trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function forward(value) {
  return String(value ?? "").replaceAll("\\", "/");
}

function pathSpellings(value) {
  const normalized = forward(value);
  const drives = [normalized];
  if (/^[A-Za-z]:/.test(normalized)) {
    drives.push(`${normalized[0].toUpperCase()}${normalized.slice(1)}`);
    drives.push(`${normalized[0].toLowerCase()}${normalized.slice(1)}`);
  }
  return unique(drives.flatMap((candidate) => [candidate, candidate.replaceAll("/", "\\")]));
}

function fileTargets(target, cwd) {
  const value = String(target ?? "").trim();
  if (!value) return [];
  const root = cwd || process.cwd();
  const absolute = path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
  const relative = path.relative(root, absolute);
  return unique([
    ...pathSpellings(value),
    ...pathSpellings(path.posix.normalize(forward(relative)).replace(/^\.\//, "")),
    ...pathSpellings(absolute),
  ]);
}

function patchTargetGroups(patchText, cwd) {
  if (typeof patchText !== "string" || !patchText.trim()) return [];
  const groups = [];
  for (const line of patchText.split(/\r?\n/)) {
    if (!line.startsWith("*** ")) continue;
    const file = line.match(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$/);
    const move = line.match(/^\*\*\* Move to:\s*(.+?)\s*$/);
    if (file || move) {
      const targets = fileTargets((file ?? move)[1], cwd);
      if (!targets.length) return [];
      groups.push(targets);
      continue;
    }
    if (line !== "*** Begin Patch" && line !== "*** End Patch") return [];
  }
  return groups;
}

function mutation(input, output) {
  const tool = nativeTool(input);
  const args = toolArguments(input, output);
  const cwd = workingDirectory(input, output);

  if (tool === "bash") {
    const target = shellMutates(args.command) ? String(args.command ?? "").trim() : "";
    return target ? { action: tool, targetGroups: [[target]] } : null;
  }
  if (!mutationTools.has(tool)) return null;

  if (tool === "patch" || tool === "apply_patch") {
    return {
      action: tool,
      targetGroups: patchTargetGroups(args.patchText ?? args.patch_text ?? args.patch, cwd),
    };
  }

  const target = args.filePath ?? args.file_path ?? args.path ?? args.file ?? args.target;
  return { action: tool, targetGroups: [fileTargets(target, cwd)] };
}

function guardFailure(result) {
  return new Error(`[devskill-guard] ${result.code ?? "guard_rejected"}: ${result.message ?? "mutation rejected"}`);
}

function unavailableFailure() {
  return new Error("[devskill-guard] guard_unavailable: Guard Core is unreachable. Start it, or restart OpenCode with DEVSKILL_GUARD_ENABLED=0.");
}

async function guardRequest(pathname, payload) {
  let response;
  try {
    response = await fetch(`${guardUrl}${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2_000),
    });
  } catch {
    throw unavailableFailure();
  }
  return {
    response,
    result: await response.json().catch(() => ({ ok: false, code: "invalid_guard_response" })),
  };
}

async function authorizeTarget(action, targets) {
  const actions = unique([action, action === "mutation" ? "" : "mutation"]);
  let lastFailure;
  let targetFailure;

  for (const candidateAction of actions) {
    for (const target of targets) {
      const { result } = await guardRequest("/v1/authorize", { session_id: sessionId(), action: candidateAction, target });
      if (result.ok) return;
      lastFailure = result;
      if (result.code === "target_not_allowed") targetFailure = result;
      if (result.code !== "target_not_allowed" && result.code !== "action_not_allowed") {
        throw guardFailure(result);
      }
    }
  }

  throw guardFailure(targetFailure ?? lastFailure ?? { code: "mutation_target_unavailable" });
}

async function authorize(request) {
  for (const targets of request.targetGroups) {
    if (!targets.length) throw new Error("[devskill-guard] mutation target is unavailable; mutation denied.");
    await authorizeTarget(request.action, targets);
  }
}

async function announce() {
  const { response, result } = await guardRequest("/v1/adapter/announce", {
    session_id: configuredSession,
    name: "opencode",
    capability: "mutation-guarded",
  });
  if (!response.ok || !result.ok) throw guardFailure(result);
  adapterAnnounced = true;
}

async function resetSession() {
  const { response, result } = await guardRequest("/v1/reset", { session_id: configuredSession });
  if (result.code === "session_missing") return;
  if (!response.ok || !result.ok) throw guardFailure(result);
}

export const DevSkillGuard = async () => {
  if (!guardEnabled) return {};
  await resetSession().catch(() => undefined);
  await announce().catch(() => undefined);
  return {
    "tool.execute.before": async (input, output) => {
      if (!adapterAnnounced) await announce();
      const request = mutation(input, output);
      if (!request) return;
      await authorize(request);
    },
    event: async ({ event }) => {
      if (event.type !== "session.deleted") return;
      adapterAnnounced = false;
      await resetSession().catch(() => undefined);
    },
  };
};
