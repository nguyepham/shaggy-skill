import path from "node:path";

const guardUrl = (process.env.DEVSKILL_GUARD_URL ?? "http://127.0.0.1:7636").replace(/\/$/, "");
const sessionId = process.env.DEVSKILL_GUARD_SESSION ?? "rebon-default";
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
  if (event === "session-start") {
    await request("/v1/adapter/announce", {
      session_id: sessionId,
      name: "rebon",
      capability: "mutation-guarded",
    });
  }
  if (event === "session-end") {
    await request("/v1/reset", { session_id: sessionId });
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

  if (!tool) throw new Error("missing configured Rebon tool identity");
  const input = await readInput();
  const target = targetFor(tool, input);
  if (!target) return;
  await request("/v1/authorize", { session_id: sessionId, action: "mutation", target });
}

main().catch((error) => {
  process.stderr.write(`${message(error)}\n`);
  process.exitCode = 2;
});
