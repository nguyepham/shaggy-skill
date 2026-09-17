import path from "node:path";
import { clearEnforced, hasEnforcedSessions, isEnforced } from "../guard-core/src/session-marker.mjs";

const guardUrl = (process.env.DEVSKILL_GUARD_URL ?? "http://127.0.0.1:7636").replace(/\/$/, "");
const guardEnabled = !new Set(["0", "false", "off", "disabled"]).has(
  String(process.env.DEVSKILL_GUARD_ENABLED ?? "1").trim().toLowerCase(),
);
const options = process.argv.slice(2);
const toolIndex = options.indexOf("--tool");
const tool = toolIndex >= 0 ? options[toolIndex + 1] : "";
const eventIndex = options.indexOf("--event");
const event = eventIndex >= 0 ? options[eventIndex + 1] : "";

const readOnlyShell = [
  /^(rg|grep|find|ls|dir|pwd|Get-ChildItem|Get-Content|Select-String)(\s|$)/i,
  /^git\s+(status|diff|log|show)(\s|$)/i,
  /^(node|npm)\s+--version$/i,
];

function message(error) {
  return error instanceof Error ? error.message : String(error);
}

function readInput() {
  return new Promise((resolve, reject) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { raw += chunk; });
    process.stdin.on("end", () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error(`invalid hook input: ${message(error)}`));
      }
    });
    process.stdin.on("error", reject);
  });
}

function sessionIdFor(input = {}) {
  const payload = input.payload ?? {};
  const candidates = [
    input.session_id,
    input.sessionId,
    input.session?.id,
    input.context?.session_id,
    input.context?.sessionId,
    payload.session_id,
    payload.sessionId,
    payload.session?.id,
    process.env.REBON_SESSION_ID,
    process.env.REBON_SESSION,
    process.env.DEVSKILL_GUARD_SESSION,
  ];
  const sessionId = candidates.find((value) => typeof value === "string" && value.trim());
  return sessionId && sessionId !== "rebon-default" ? sessionId.trim() : "";
}

function toolInput(input) {
  return input.tool_input ?? input.inputs ?? input.payload ?? input;
}

function normalizePath(target, input) {
  const value = String(target ?? "").trim();
  if (!value) return "";
  const cwd = String(input.cwd ?? input.payload?.cwd ?? process.env.DEVSKILL_GUARD_CWD ?? "").trim();
  const absolute = path.isAbsolute(value) ? value : (cwd ? path.resolve(cwd, value) : value);
  return absolute.replaceAll("\\", "/");
}

function shellTarget(command) {
  const value = String(command ?? "").trim();
  if (!value) return "";
  if (/[|;&]|>>?|<|\n/.test(value)) return value;
  return readOnlyShell.some((pattern) => pattern.test(value)) ? "" : value;
}

function targetFor(toolName, input) {
  const args = toolInput(input);
  if (toolName === "Bash" || toolName === "PowerShell") {
    return shellTarget(args.command);
  }

  return normalizePath(
    args.file_path
      ?? args.filePath
      ?? args.notebook_path
      ?? args.notebookPath
      ?? args.path
      ?? args.file
      ?? args.target,
    input,
  );
}

async function currentStatus(sessionId) {
  try {
    const response = await fetch(`${guardUrl}/v1/status?session_id=${encodeURIComponent(sessionId)}`, {
      signal: AbortSignal.timeout(1_000),
    });
    if (!response.ok) return { status: null, error: `HTTP ${response.status}` };
    return { status: await response.json(), error: "" };
  } catch (error) {
    return { status: null, error: message(error) };
  }
}

function matchingAdapter(status) {
  return status?.adapter?.name === "rebon" && status.adapter.capability === "mutation-guarded";
}

async function request(pathname, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(`${guardUrl}${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({ ok: false, code: "invalid_guard_response" }));
    if (!response.ok || !result.ok) {
      throw new Error(`[devskill-guard] ${result.code ?? "guard_rejected"}: ${result.message ?? "mutation rejected"}`);
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

async function lifecycle(sessionId) {
  if (!guardEnabled || event !== "session-end" || !sessionId || !isEnforced(sessionId)) return;
  try {
    await request("/v1/release", { session_id: sessionId });
  } finally {
    clearEnforced(sessionId);
  }
}

async function main() {
  if (options.includes("--check")) {
    process.stdout.write("DEVSKILL_REBON_HOOK_READY\n");
    return;
  }

  const input = await readInput();
  const sessionId = sessionIdFor(input);
  if (event) {
    await lifecycle(sessionId);
    return;
  }

  if (!guardEnabled) return;
  if (!tool) throw new Error("missing configured Rebon tool identity");
  if (!sessionId) {
    if (hasEnforcedSessions()) throw new Error("[devskill-guard] session_identity_unavailable: mutation denied while enforcement is active.");
    return;
  }
  if (!isEnforced(sessionId)) return;
  const target = targetFor(tool, input);
  if (!target) throw new Error("[devskill-guard] target_unavailable: mutation denied.");
  const current = await currentStatus(sessionId);
  if (!matchingAdapter(current.status)) {
    throw new Error(`[devskill-guard] guard_lapsed: ${current.error || "active Guard state is unavailable"}`);
  }
  await request("/v1/authorize", { session_id: sessionId, action: "mutation", target });
}

main().catch((error) => {
  process.stderr.write(`${message(error)}\n`);
  process.exitCode = 2;
});
