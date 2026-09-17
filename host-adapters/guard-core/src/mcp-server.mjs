import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const baseUrl = (process.env.DEVSKILL_GUARD_URL ?? "http://127.0.0.1:7634").replace(/\/$/, "");
const configuredAdapter = String(process.env.DEVSKILL_GUARD_ADAPTER ?? "").trim();
const configuredSession = String(process.env.DEVSKILL_GUARD_SESSION ?? "").trim();

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

async function ensureCore() {
  if (await health()) return;
  const port = new URL(baseUrl).port || "7634";
  const core = fileURLToPath(new URL("./http-server.mjs", import.meta.url));
  const child = spawn(process.execPath, [core], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, DEVSKILL_GUARD_PORT: port },
  });
  child.unref();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(100);
    if (await health()) return;
  }
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
  const sessionId = text(args.session_id) || configuredSession;
  if (!sessionId) throw new Error("The configured host session must be named exactly.");
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
  if (!await health()) return { ok: true, session_id: sessionId, released: false, running: false };
  const { response, result } = await requestJson(`${baseUrl}/v1/deactivate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok || !result.ok) throw new Error(result.message ?? result.code ?? "Guard disable failed.");
  return result;
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
  const url = tool.method === "GET"
    ? `${baseUrl}${tool.endpoint}?session_id=${encodeURIComponent(input.session_id)}`
    : `${baseUrl}${tool.endpoint}`;
  const response = await fetch(url, tool.method === "GET" ? undefined : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  return {
    isError: !result.ok,
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}

const server = new Server(
  { name: "devskill-guard", version: "2.4.1" },
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
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ ok: false, code: "guard_unavailable", message: error.message }) }] };
  }
});

await server.connect(new StdioServerTransport());
