export const API_BASE = import.meta.env.DEV
  ? "/api"
  : `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

const CULTURAL_IDENTITY_MAP = {
  china_in_us: "chinese_in_us",
  us_in_china: "american_in_china",
};

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

async function authRequest(path, payload) {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Authentication failed");
  return data;
}

export function registerAccount(payload) {
  return authRequest("/auth/register", payload);
}

export function loginAccount(username, password) {
  return authRequest("/auth/login", { username, password });
}

export async function getCurrentUser() {
  const res = await apiFetch("/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to restore account");
  return res.json();
}

export async function logoutAccount() {
  const res = await apiFetch("/auth/logout", { method: "POST" });
  if (!res.ok) throw new Error("Failed to log out");
  return res.json();
}

export async function updateLanguagePreference(language) {
  const res = await apiFetch("/auth/preferences", {
    method: "PATCH",
    body: JSON.stringify({ language }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to update language");
  return data;
}

export async function createSession(
  userName = "",
  culturalIdentity = "unknown",
  language = "zh",
  studyAbroadMonths = 0,
) {
  const res = await apiFetch("/session/create", {
    method: "POST",
    body: JSON.stringify({
      user_name: userName,
      cultural_identity: CULTURAL_IDENTITY_MAP[culturalIdentity] || culturalIdentity,
      language,
      study_abroad_months: studyAbroadMonths,
    }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function sendMessage(
  sessionId,
  message,
  inputMode = "text",
  voiceAnalysis = null,
) {
  const res = await apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message,
      input_mode: inputMode,
      voice_analysis: voiceAnalysis,
    }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function sendMessageStream(
  sessionId,
  message,
  inputMode = "text",
  onDelta = () => {},
  voiceAnalysis = null,
) {
  const res = await apiFetch("/chat/stream", {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      input_mode: inputMode,
      voice_analysis: voiceAnalysis,
    }),
  });
  if (!res.ok || !res.body) throw new Error("Failed to stream message");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalData = null;

  const handleBlock = (block) => {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;

    const event = JSON.parse(data);
    if (event.type === "delta") {
      onDelta(event.content || "");
    } else if (event.type === "final") {
      finalData = event.data;
    } else if (event.type === "error") {
      throw new Error(event.message || "Streaming request failed");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";
    blocks.forEach(handleBlock);
    if (done) break;
  }
  if (buffer.trim()) handleBlock(buffer);
  if (!finalData) throw new Error("Stream ended without a final response");
  return finalData;
}

export async function getSessionState(sessionId) {
  const res = await apiFetch(`/session/${sessionId}/state`);
  if (!res.ok) throw new Error("Failed to get state");
  return res.json();
}

export async function getSessionHistory(sessionId) {
  const res = await apiFetch(`/session/${sessionId}/history`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function getReportByDate(sessionId, date) {
  const res = await apiFetch(
    `/session/${sessionId}/report?date=${encodeURIComponent(date)}`,
  );
  if (!res.ok) throw new Error("Report not found for this date");
  return res.json();
}

export async function getGrowthRecord(sessionId) {
  const res = await apiFetch(`/session/${sessionId}/growth`);
  if (!res.ok) throw new Error("Failed to get growth record");
  return res.json();
}

export async function recordSelfGuidedTraining(sessionId, training) {
  const res = await apiFetch(`/session/${sessionId}/training/self-guided`, {
    method: "POST",
    body: JSON.stringify(training),
  });
  if (!res.ok) throw new Error("Failed to record training");
  return res.json();
}

export async function getHumeAccessToken() {
  const res = await apiFetch("/voice/token", {
    method: "POST",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to authenticate with Hume EVI");
  }
  const payload = await res.json();
  if (!payload.proxy_url || !payload.proxy_grant) return payload;

  const proxyResponse = await fetch(payload.proxy_url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${payload.proxy_grant}`,
      Accept: "application/json",
    },
  });
  if (!proxyResponse.ok) {
    throw new Error("Failed to authenticate with Hume EVI");
  }
  const token = await proxyResponse.json();
  return {
    ...token,
    config_id: payload.config_id,
  };
}

export async function forceTransition(sessionId, targetAgent) {
  const res = await apiFetch("/session/transition", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, target_agent: targetAgent }),
  });
  if (!res.ok) throw new Error("Failed to transition");
  return res.json();
}

export async function getLatestSession() {
  const res = await apiFetch("/session/latest");
  if (!res.ok) throw new Error("Failed to get latest session");
  return res.json();
}

export async function getAssessmentStatus() {
  const res = await apiFetch("/assessment/status");
  if (!res.ok) throw new Error("Failed to get assessment status");
  return res.json();
}

export async function saveAssessment(assessment) {
  const res = await apiFetch("/assessment", {
    method: "POST",
    body: JSON.stringify(assessment),
  });
  if (!res.ok) throw new Error("Failed to save assessment");
  return res.json();
}
