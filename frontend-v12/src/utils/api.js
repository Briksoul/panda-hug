const API_BASE = "/api";

export async function createSession(
  userName = "",
  userId = "",
  culturalIdentity = "unknown",
  language = "zh",
  studyAbroadMonths = 0,
) {
  const res = await fetch(`${API_BASE}/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_name: userName,
      user_id: userId,
      cultural_identity: culturalIdentity,
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
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  const res = await fetch(`${API_BASE}/session/${sessionId}/state`);
  if (!res.ok) throw new Error("Failed to get state");
  return res.json();
}

export async function getSessionHistory(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/history`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function getGrowthRecord(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/growth`);
  if (!res.ok) throw new Error("Failed to get growth record");
  return res.json();
}

export async function recordSelfGuidedTraining(sessionId, training) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/training/self-guided`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(training),
  });
  if (!res.ok) throw new Error("Failed to record training");
  return res.json();
}

export async function getHumeAccessToken() {
  const res = await fetch(`${API_BASE}/voice/token`, {
    method: "POST",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to authenticate with Hume EVI");
  }
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
