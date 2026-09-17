import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const guardUrl = (process.env.DEVSKILL_GUARD_URL ?? "http://127.0.0.1:7636").replace(/\/$/, "");
const sessionId = process.env.DEVSKILL_GUARD_SESSION ?? "rebon-default";
const guardEnabled = !new Set(["0", "false", "off", "disabled"]).has(
  String(process.env.DEVSKILL_GUARD_ENABLED ?? "1").trim().toLowerCase(),
);
const adapterDir = path.dirname(fileURLToPath(import.meta.url));
const coreServer = path.resolve(adapterDir, "..", "guard-core", "src", "http-server.mjs");
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

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

async function currentStatus() {
  try {
    const response = await fetch(`${guardUrl}/v1/status?session_id=${encodeURIComponent(sessionId)}`, {
      signal: AbortSignal.timeout(1_000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function coreRunning() {
  try {
    const response = await fetch(`${guardUrl}/health`, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureCore() {
  if (!guardEnabled || await coreRunning()) return guardEnabled;
  const port = new URL(guardUrl).port || "7636";
  const child = spawn(process.execPath, [coreServer], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, DEVSKILL_GUARD_PORT: port },
  });
  child.unref();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(100);
    if (await coreRunning()) return true;
  }
  return false;
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

async function lifecycle() {
  if (!guardEnabled) return;
  if (event === "session-start") {
    if (!await ensureCore()) throw new Error("DevSkill Guard Core did not become available.");
    if (await currentStatus()) {
      await request("/v1/reset", { session_id: sessionId });
    }
    await request("/v1/adapter/register", {
      session_id: sessionId,
      name: "rebon",
      capability: "mutation-guarded",
    });
  }
  if (event === "session-end") {
    const status = await currentStatus();
    if (!status) return;
    const result = await request("/v1/release", { session_id: sessionId });
    if (result.remaining_sessions === 0) {
      await fetch(`${guardUrl}/v1/shutdown`, { method: "POST", signal: AbortSignal.timeout(1_000) }).catch(() => undefined);
    }
  }
}

async function main() {
  if (options.includes("--check")) {
    process.stdout.write("DEVSKILL_REBON_HOOK_READY\n");
    return;
  }

  if (event) {
    await lifecycle();
    return;
  }

  if (!guardEnabled) return;
  if (!tool) throw new Error("missing configured Rebon tool identity");
  const input = await readInput();
  const target = targetFor(tool, input);
  if (!target) return;
  if (!matchingAdapter(await currentStatus())) return;
  await request("/v1/authorize", { session_id: sessionId, action: "mutation", target });
}

main().catch((error) => {
  process.stderr.write(`${message(error)}\n`);
  process.exitCode = 2;
});
