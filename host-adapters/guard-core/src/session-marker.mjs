import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function stateDirectory() {
  return text(process.env.DEVSKILL_GUARD_STATE_DIR)
    || path.join(process.env.LOCALAPPDATA || os.tmpdir(), "DevSkill", "rebon-guard");
}

function markerPath(sessionId) {
  const id = text(sessionId);
  if (!id) throw new Error("A Rebon session id is required.");
  return path.join(stateDirectory(), `session-${encodeURIComponent(id).replaceAll("%", "_")}.json`);
}

function read(pathname) {
  try {
    return JSON.parse(fs.readFileSync(pathname, "utf8"));
  } catch {
    return null;
  }
}

export function markEnforced(sessionId) {
  fs.mkdirSync(stateDirectory(), { recursive: true });
  fs.writeFileSync(markerPath(sessionId), JSON.stringify({ session_id: text(sessionId), enforcement: "mutation-guarded" }));
}

export function clearEnforced(sessionId) {
  try {
    fs.unlinkSync(markerPath(sessionId));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export function isEnforced(sessionId) {
  const marker = read(markerPath(sessionId));
  return marker?.session_id === text(sessionId) && marker.enforcement === "mutation-guarded";
}

export function hasEnforcedSessions() {
  try {
    return fs.readdirSync(stateDirectory()).some((name) => {
      if (!name.startsWith("session-") || !name.endsWith(".json")) return false;
      return read(path.join(stateDirectory(), name))?.enforcement === "mutation-guarded";
    });
  } catch {
    return false;
  }
}

export function coreLogPath() {
  fs.mkdirSync(stateDirectory(), { recursive: true });
  return path.join(stateDirectory(), "core.log");
}
