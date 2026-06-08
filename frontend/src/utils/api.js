/**
 * Panda Hug V4 API 工具
 */

const API_BASE = "/api";

export async function createSession(userName = "", language = "zh") {
  const res = await fetch(`${API_BASE}/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: userName, language }),
  });
  return res.json();
}

export async function sendMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  return res.json();
}

export async function navigateToPhase(sessionId, targetPhase) {
  const res = await fetch(`${API_BASE}/navigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, target_phase: targetPhase }),
  });
  return res.json();
}

export async function getSessionState(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/state`);
  return res.json();
}

export async function getSessionHistory(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/history`);
  return res.json();
}
