const MODES = new Set([
  "parallel-normal",
  "parallel-optimized",
  "sequential-normal",
  "sequential-optimized",
]);
const ADAPTER_CAPABILITIES = new Map([
  ["rebon", new Set(["mutation-guarded"])],
]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function failure(code, message) {
  return { ok: false, code, message };
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function exactStrings(values, field) {
  if (!Array.isArray(values) || values.length === 0) {
    return { error: failure("invalid_input", `${field} must contain one or more exact strings.`) };
  }

  const normalized = [...new Set(values.map(text).filter(Boolean))];
  if (normalized.length !== values.length || normalized.some((value) => value.includes("*"))) {
    return { error: failure("invalid_input", `${field} must contain unique non-wildcard strings.`) };
  }

  return { value: normalized };
}

function bindingFrom(input) {
  const owner = text(input.owner);
  const checkpoint = text(input.checkpoint);
  const returnConsumer = text(input.return_consumer);
  const actions = exactStrings(input.allowed_actions, "allowed_actions");
  const targets = exactStrings(input.allowed_targets, "allowed_targets");

  if (!owner || !checkpoint || !returnConsumer) {
    return { error: failure("invalid_input", "owner, checkpoint, and return_consumer are required.") };
  }
  if (actions.error) return actions;
  if (targets.error) return targets;

  return {
    value: {
      owner,
      checkpoint,
      allowed_actions: actions.value,
      allowed_targets: targets.value,
      return_consumer: returnConsumer,
    },
  };
}

function newSession() {
  return {
    profile: null,
    binding: null,
    adapter: null,
    hook: null,
    revision: 0,
  };
}

export class Guard {
  #sessions = new Map();

  admit(input) {
    const sessionId = text(input.session_id);
    const provider = text(input.provider);
    const host = text(input.host);
    const mode = text(input.mode);

    if (!sessionId || !provider || !host || !MODES.has(mode)) {
      return failure("invalid_input", "session_id, provider, host, and a valid mode are required.");
    }

    const session = this.#sessions.get(sessionId) ?? newSession();
    if (!session.adapter) {
      return failure("adapter_missing", "Enable a matching native adapter before admitting a guarded session.");
    }
    if (host !== session.adapter.name) {
      return failure("host_adapter_mismatch", "The admitted host must match the enabled native adapter exactly.");
    }
    session.profile = { provider, host, mode, route_status: "admitted" };
    session.binding = null;
    session.revision += 1;
    this.#sessions.set(sessionId, session);
    return { ok: true, session_id: sessionId, ...copy(session) };
  }

  announceAdapter(input) {
    const sessionId = text(input.session_id);
    const name = text(input.name);
    const capability = text(input.capability);
    if (!sessionId || !ADAPTER_CAPABILITIES.get(name)?.has(capability)) {
      return failure("invalid_input", "session_id and a supported adapter capability are required.");
    }

    const session = this.#sessions.get(sessionId) ?? newSession();
    if (session.hook?.name !== name || session.hook?.capability !== capability) {
      return failure("hook_unavailable", "The matching native host hook is not registered for this session.");
    }
    session.adapter = { name, capability };
    session.revision += 1;
    this.#sessions.set(sessionId, session);
    return { ok: true, session_id: sessionId, ...copy(session) };
  }

  registerHook(input) {
    const sessionId = text(input.session_id);
    const name = text(input.name);
    const capability = text(input.capability);
    if (!sessionId || !ADAPTER_CAPABILITIES.get(name)?.has(capability)) {
      return failure("invalid_input", "session_id and a supported hook capability are required.");
    }

    const session = this.#sessions.get(sessionId) ?? newSession();
    session.hook = { name, capability };
    session.revision += 1;
    this.#sessions.set(sessionId, session);
    return { ok: true, session_id: sessionId, ...copy(session) };
  }

  status(input) {
    const sessionId = text(input.session_id);
    const session = this.#sessions.get(sessionId);
    if (!session) return failure("session_missing", "No admitted session exists for session_id.");
    return { ok: true, session_id: sessionId, ...copy(session) };
  }

  enter(input) {
    const sessionId = text(input.session_id);
    const session = this.#sessions.get(sessionId);
    if (!session) return failure("session_missing", "Admit the session before entering an owner checkpoint.");
    if (session.binding) return failure("binding_active", "Advance or reset the active binding before entering another owner.");

    const binding = bindingFrom(input);
    if (binding.error) return binding.error;
    session.binding = binding.value;
    session.revision += 1;
    return { ok: true, session_id: sessionId, ...copy(session) };
  }

  authorize(input) {
    const sessionId = text(input.session_id);
    const action = text(input.action);
    const target = text(input.target);
    const session = this.#sessions.get(sessionId);

    if (!session) return failure("session_missing", "Admit the session before a state-changing action.");
    if (!session.binding) return failure("binding_missing", "Enter an owner checkpoint before a state-changing action.");
    if (!action || !target) return failure("invalid_input", "action and target are required.");
    if (!session.binding.allowed_actions.includes(action)) {
      return failure("action_not_allowed", `The active binding does not allow action '${action}'.`);
    }
    if (!session.binding.allowed_targets.includes(target)) {
      return failure("target_not_allowed", "The active binding does not allow this exact target.");
    }

    return { ok: true, session_id: sessionId, binding: copy(session.binding) };
  }

  advance(input) {
    const sessionId = text(input.session_id);
    const session = this.#sessions.get(sessionId);
    if (!session) return failure("session_missing", "Admit the session before advancing.");
    if (!session.binding) return failure("binding_missing", "Enter an owner checkpoint before advancing.");

    if (text(input.owner) !== session.binding.owner || text(input.checkpoint) !== session.binding.checkpoint) {
      return failure("binding_mismatch", "Advance must name the active owner and checkpoint exactly.");
    }

    const terminal = input.terminal === true;
    if (terminal) {
      session.binding = null;
      session.revision += 1;
      return { ok: true, session_id: sessionId, terminal: true, ...copy(session) };
    }

    const next = bindingFrom({
      owner: input.next_owner,
      checkpoint: input.next_checkpoint,
      allowed_actions: input.next_allowed_actions,
      allowed_targets: input.next_allowed_targets,
      return_consumer: input.next_return_consumer,
    });
    if (next.error) return next.error;

    session.binding = next.value;
    session.revision += 1;
    return { ok: true, session_id: sessionId, ...copy(session) };
  }

  reset(input) {
    const sessionId = text(input.session_id);
    if (!this.#sessions.delete(sessionId)) return failure("session_missing", "No session exists for session_id.");
    return { ok: true, session_id: sessionId, reset: true };
  }

  deactivate(input) {
    const sessionId = text(input.session_id);
    const session = this.#sessions.get(sessionId);
    if (!session) return failure("session_missing", "No session exists for session_id.");
    session.profile = null;
    session.binding = null;
    session.adapter = null;
    session.revision += 1;
    return { ok: true, session_id: sessionId, ...copy(session) };
  }

  release(input) {
    const sessionId = text(input.session_id);
    if (!sessionId) return failure("invalid_input", "session_id is required.");
    const released = this.#sessions.delete(sessionId);
    return {
      ok: true,
      session_id: sessionId,
      released,
      remaining_sessions: this.#sessions.size,
    };
  }
}
