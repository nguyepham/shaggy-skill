import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const baseUrl = (process.env.DEVSKILL_GUARD_URL ?? "http://127.0.0.1:7634").replace(/\/$/, "");

const tools = [
  {
    name: "devskill_guard_admit",
    description: "Create an admitted profile for one host session.",
    inputSchema: {
      type: "object",
      required: ["session_id", "provider", "host", "mode"],
      properties: {
        session_id: { type: "string" },
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
    inputSchema: bindingSchema(["session_id", "owner", "checkpoint", "allowed_actions", "allowed_targets", "return_consumer"]),
    endpoint: "/v1/enter",
  },
  {
    name: "devskill_guard_advance",
    description: "Replace the active binding with its declared next binding or terminal.",
    inputSchema: {
      type: "object",
      required: ["session_id", "owner", "checkpoint"],
      properties: {
        session_id: { type: "string" },
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
      required: ["session_id"],
      properties: { session_id: { type: "string" } },
    },
    endpoint: "/v1/status",
    method: "GET",
  },
  {
    name: "devskill_guard_reset",
    description: "Remove one guard session after its host session ends.",
    inputSchema: {
      type: "object",
      required: ["session_id"],
      properties: { session_id: { type: "string" } },
    },
    endpoint: "/v1/reset",
  },
];

function bindingSchema(required) {
  return {
    type: "object",
    required,
    properties: {
      session_id: { type: "string" },
      owner: { type: "string" },
      checkpoint: { type: "string" },
      allowed_actions: { type: "array", items: { type: "string" } },
      allowed_targets: { type: "array", items: { type: "string" } },
      return_consumer: { type: "string" },
    },
  };
}

async function call(tool, args) {
  const url = tool.method === "GET"
    ? `${baseUrl}${tool.endpoint}?session_id=${encodeURIComponent(args.session_id)}`
    : `${baseUrl}${tool.endpoint}`;
  const response = await fetch(url, tool.method === "GET" ? undefined : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args ?? {}),
  });
  const result = await response.json();
  return {
    isError: !result.ok,
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}

const server = new Server(
  { name: "devskill-guard", version: "2.3.0" },
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
