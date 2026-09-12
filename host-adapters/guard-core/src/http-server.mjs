import http from "node:http";
import { Guard } from "./guard-state.mjs";

const host = "127.0.0.1";
const port = Number(process.env.DEVSKILL_GUARD_PORT ?? 7634);
const guard = new Guard();
let shuttingDown = false;

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function bodyOf(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 65536) throw new Error("request_too_large");
  }
  return raw ? JSON.parse(raw) : {};
}

function dispatch(pathname, body) {
  switch (pathname) {
    case "/v1/admit": return guard.admit(body);
    case "/v1/adapter/announce": return guard.announceAdapter(body);
    case "/v1/enter": return guard.enter(body);
    case "/v1/authorize": return guard.authorize(body);
    case "/v1/advance": return guard.advance(body);
    case "/v1/reset": return guard.reset(body);
    default: return { ok: false, code: "not_found", message: "Unknown guard operation." };
  }
}

function shutdown(response) {
  if (shuttingDown) return send(response, 200, { ok: true, shutdown: true });
  shuttingDown = true;
  send(response, 200, { ok: true, shutdown: true });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2_000).unref();
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  if (request.method === "GET" && url.pathname === "/health") {
    return send(response, 200, { ok: true, service: "devskill-guard" });
  }
  if (request.method === "GET" && url.pathname === "/v1/status") {
    const result = guard.status({ session_id: url.searchParams.get("session_id") });
    return send(response, result.ok ? 200 : 409, result);
  }
  if (request.method !== "POST") return send(response, 405, { ok: false, code: "method_not_allowed" });
  if (url.pathname === "/v1/shutdown") return shutdown(response);

  try {
    const result = dispatch(url.pathname, await bodyOf(request));
    return send(response, result.ok ? 200 : 409, result);
  } catch (error) {
    return send(response, 400, { ok: false, code: "invalid_request", message: error.message });
  }
});

server.listen(port, host, () => {
  process.stdout.write(`DEVSKILL_GUARD_LISTENING=http://${host}:${port}\n`);
});
