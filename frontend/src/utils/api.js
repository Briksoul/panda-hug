const API_BASE = "/api";

export async function createSession(userName = "") {
  const res = await fetch(`${API_BASE}/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: userName }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function sendMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function getSessionState(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/state`);
  if (!res.ok) throw new Error("Failed to get state");
  return res.json();
}

export async function getSessionHistory(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/history`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function forceTransition(sessionId, targetAgent) {
  const res = await fetch(`${API_BASE}/session/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, target_agent: targetAgent }),
  });
  if (!res.ok) throw new Error("Failed to transition");
  return res.json();
}
