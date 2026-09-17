import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { clearEnforced, coreLogPath, hasEnforcedSessions, isEnforced, markEnforced } from "./session-marker.mjs";

const baseUrl = (process.env.DEVSKILL_GUARD_URL ?? "http://127.0.0.1:7634").replace(/\/$/, "");
const configuredAdapter = String(process.env.DEVSKILL_GUARD_ADAPTER ?? "").trim();
const configuredSession = String(process.env.DEVSKILL_GUARD_SESSION ?? "").trim();
let coreChild = null;
let restartTimer = null;
let restartAttempts = 0;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(2_000) });
  return { response, result: await response.json().catch(() => ({ ok: false, code: "invalid_guard_response" })) };
}

async function health() {
  try {
    const { response, result } = await requestJson(`${baseUrl}/health`);
    return response.ok && result.ok === true;
  } catch {
    return false;
  }
}

function errorMessage(error) {
  const cause = error?.cause;
  const detail = cause?.code ?? cause?.message;
  return detail ? `${error.message} (${detail})` : error.message;
}

function logCore(message) {
  fs.appendFileSync(coreLogPath(), `${new Date().toISOString()} ${message}\n`);
}

function scheduleRestart() {
  if (restartTimer || !hasEnforcedSessions() || restartAttempts >= 4) return;
  const delay = Math.min(250 * (2 ** restartAttempts), 4_000);
  restartAttempts += 1;
  restartTimer = setTimeout(async () => {
    restartTimer = null;
    try {
      await ensureCore();
    } catch (error) {
      logCore(`restart failed: ${errorMessage(error)}`);
      scheduleRestart();
    }
  }, delay);
  restartTimer.unref();
}

async function waitForCore() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(100);
    if (await health()) return true;
  }
  return false;
}

async function ensureCore() {
  if (await health()) {
    restartAttempts = 0;
    return { restarted: false };
  }

  if (coreChild && coreChild.exitCode === null) {
    logCore("Core became unresponsive; restarting the monitored child.");
    coreChild.kill();
    if (await waitForCore()) return { restarted: false };
    coreChild = null;
  }

  const port = new URL(baseUrl).port || "7634";
  const core = fileURLToPath(new URL("./http-server.mjs", import.meta.url));
  if (!coreChild || coreChild.exitCode !== null) {
    const descriptor = fs.openSync(coreLogPath(), "a");
    let logClosed = false;
    const closeLog = () => {
      if (logClosed) return;
      logClosed = true;
      fs.closeSync(descriptor);
    };
    const child = spawn(process.execPath, [core], {
      detached: true,
      stdio: ["ignore", descriptor, descriptor],
      windowsHide: true,
      env: { ...process.env, DEVSKILL_GUARD_PORT: port },
    });
    coreChild = child;
    child.unref();
    child.once("error", (error) => {
      logCore(`spawn error: ${errorMessage(error)}`);
      closeLog();
      if (coreChild === child) coreChild = null;
      scheduleRestart();
    });
    child.once("exit", (code, signal) => {
      logCore(`Core exited: code=${code ?? "none"} signal=${signal ?? "none"}`);
      closeLog();
      if (coreChild === child) coreChild = null;
      scheduleRestart();
    });
  }
  if (await waitForCore()) return { restarted: true };
  throw new Error("Guard Core did not become available.");
}

function adapterFrom(args) {
  const adapter = text(args.adapter) || configuredAdapter;
  if (!adapter || (configuredAdapter && adapter !== configuredAdapter)) {
    throw new Error("The configured host adapter must be named exactly.");
  }
  return adapter;
}

function sessionFrom(args) {
  if (configuredSession === "rebon-default") {
    throw new Error("The installed Rebon adapter uses the legacy shared session id. Rerun the adapter installer and open one fresh Rebon session.");
  }
  const sessionId = text(args.session_id) || configuredSession;
  if (!sessionId || sessionId === "rebon-default") {
    throw new Error("A current Rebon session id is required; rerun the adapter installer and use trusted session metadata.");
  }
  return sessionId;
}

async function bootstrapHook(sessionId, adapter) {
  const { response, result } = await requestJson(`${baseUrl}/v1/adapter/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, name: adapter, capability: "mutation-guarded" }),
  });
  if (!response.ok || !result.ok) throw new Error(result.message ?? result.code ?? "Guard hook bootstrap failed.");
  return result;
}

async function enable(args) {
  const sessionId = sessionFrom(args);
  const adapter = adapterFrom(args);
  await ensureCore();
  await bootstrapHook(sessionId, adapter);
  const { response, result } = await requestJson(`${baseUrl}/v1/adapter/announce`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, name: adapter, capability: "mutation-guarded" }),
  });
  if (!response.ok || !result.ok) throw new Error(result.message ?? result.code ?? "Guard enable failed.");
  markEnforced(sessionId);
  return result;
}

async function probe(args) {
  const sessionId = sessionFrom(args);
  const adapter = adapterFrom(args);
  await ensureCore();
  const status = await bootstrapHook(sessionId, adapter);
  return { ok: true, bridge_available: true, status };
}

async function disable(args) {
  const sessionId = sessionFrom(args);
  adapterFrom(args);
  if (!await health()) {
    clearEnforced(sessionId);
    return { ok: true, session_id: sessionId, released: false, running: false };
  }
  try {
    const { response, result } = await requestJson(`${baseUrl}/v1/deactivate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (response.ok && result.ok) {
      clearEnforced(sessionId);
      return result;
    }
    if (result.code !== "session_missing") throw new Error(result.message ?? result.code ?? "Guard disable failed.");
  } finally {
    clearEnforced(sessionId);
  }
  return { ok: true, session_id: sessionId, released: false, running: true };
}

function lapsedResult(sessionId) {
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify({
      ok: false,
      code: "guard_lapsed",
      session_id: sessionId,
      message: "Guard Core restarted or became unavailable. Re-enter the current owner through Mode Gate before another state-changing action.",
    }) }],
  };
}

function resetResult(sessionId) {
  clearEnforced(sessionId);
  return {
    isError: false,
    content: [{ type: "text", text: JSON.stringify({
      ok: true,
      session_id: sessionId,
      reset: true,
    }) }],
  };
}

function lostCoreState(result, sessionId) {
  return isEnforced(sessionId) && new Set([
    "session_missing",
    "adapter_missing",
    "hook_unavailable",
  ]).has(result.code);
}

const tools = [
  {
    name: "devskill_guard_probe",
    description: "Start the Guard Core if needed and read the configured native host bridge state without enabling enforcement.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", default: configuredSession },
        adapter: { type: "string", enum: ["rebon"], default: configuredAdapter },
      },
    },
    operation: "probe",
  },
  {
    name: "devskill_guard_enable",
    description: "Start the Guard Core and enable the configured native host adapter for this session.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", default: configuredSession },
        adapter: { type: "string", enum: ["rebon"], default: configuredAdapter },
      },
    },
    operation: "enable",
  },
  {
    name: "devskill_guard_disable",
    description: "Deactivate the configured host adapter while retaining its dormant session hook.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", default: configuredSession },
        adapter: { type: "string", enum: ["rebon"], default: configuredAdapter },
      },
    },
    operation: "disable",
  },
  {
    name: "devskill_guard_admit",
    description: "Create an admitted profile for one host session.",
    inputSchema: {
      type: "object",
      required: ["provider", "host", "mode"],
      properties: {
        session_id: { type: "string", default: configuredSession },
        provider: { type: "string" },
        host: { type: "string" },
        mode: { type: "string", enum: ["parallel-normal", "parallel-optimized", "sequential-normal", "sequential-optimized"] },
      },
    },
    endpoint: "/v1/admit",
  },
  {
    name: "devskill_guard_enter",
    description: "Enter one declared owner checkpoint and bind exact mutation targets.",
    inputSchema: bindingSchema(["owner", "checkpoint", "allowed_actions", "allowed_targets", "return_consumer"]),
    endpoint: "/v1/enter",
  },
  {
    name: "devskill_guard_advance",
    description: "Replace the active binding with its declared next binding or terminal.",
    inputSchema: {
      type: "object",
      required: ["owner", "checkpoint"],
      properties: {
        session_id: { type: "string", default: configuredSession },
        owner: { type: "string" },
        checkpoint: { type: "string" },
        terminal: { type: "boolean" },
        next_owner: { type: "string" },
        next_checkpoint: { type: "string" },
        next_allowed_actions: { type: "array", items: { type: "string" } },
        next_allowed_targets: { type: "array", items: { type: "string" } },
        next_return_consumer: { type: "string" },
      },
    },
    endpoint: "/v1/advance",
  },
  {
    name: "devskill_guard_status",
    description: "Read the current admitted profile and active binding.",
    inputSchema: {
      type: "object",
      properties: { session_id: { type: "string", default: configuredSession } },
    },
    endpoint: "/v1/status",
    method: "GET",
  },
  {
    name: "devskill_guard_reset",
    description: "Remove one guard session after its host session ends.",
    inputSchema: {
      type: "object",
      properties: { session_id: { type: "string", default: configuredSession } },
    },
    endpoint: "/v1/reset",
  },
];

function bindingSchema(required) {
  return {
    type: "object",
    required,
    properties: {
      session_id: { type: "string", default: configuredSession },
      owner: { type: "string" },
      checkpoint: { type: "string" },
      allowed_actions: { type: "array", items: { type: "string" } },
      allowed_targets: { type: "array", items: { type: "string" } },
      return_consumer: { type: "string" },
    },
  };
}

async function call(tool, args) {
  if (tool.operation === "probe") return { isError: false, content: [{ type: "text", text: JSON.stringify(await probe(args)) }] };
  if (tool.operation === "enable") return { isError: false, content: [{ type: "text", text: JSON.stringify(await enable(args)) }] };
  if (tool.operation === "disable") return { isError: false, content: [{ type: "text", text: JSON.stringify(await disable(args)) }] };
  const input = { ...args, session_id: sessionFrom(args) };
  if ((await ensureCore()).restarted) {
    return tool.name === "devskill_guard_reset" ? resetResult(input.session_id) : lapsedResult(input.session_id);
  }
  const url = tool.method === "GET"
    ? `${baseUrl}${tool.endpoint}?session_id=${encodeURIComponent(input.session_id)}`
    : `${baseUrl}${tool.endpoint}`;
  let response;
  try {
    response = await fetch(url, tool.method === "GET" ? undefined : {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(4_000),
    });
  } catch (error) {
    if ((await ensureCore()).restarted) {
      return tool.name === "devskill_guard_reset" ? resetResult(input.session_id) : lapsedResult(input.session_id);
    }
    throw error;
  }
  const result = await response.json();
  if (tool.name === "devskill_guard_reset" && (result.ok || result.code === "session_missing")) {
    return resetResult(input.session_id);
  }
  if (lostCoreState(result, input.session_id)) return lapsedResult(input.session_id);
  return {
    isError: !result.ok,
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}

const server = new Server(
  { name: "devskill-guard", version: "2.4.2" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((candidate) => candidate.name === request.params.name);
  if (!tool) {
    return { isError: true, content: [{ type: "text", text: "Unknown DevSkill Guard tool." }] };
  }
  try {
    return await call(tool, request.params.arguments ?? {});
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ ok: false, code: "guard_unavailable", message: errorMessage(error) }) }] };
  }
});

await server.connect(new StdioServerTransport());
