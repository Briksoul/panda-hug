/**
 * Panda Hug V5 API 工具
 * 新增：SSE 流式报告、用户档案更新
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
  if (!res.ok) throw new Error(`Session not found: ${res.status}`);
  return res.json();
}

export async function getSessionHistory(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/history`);
  return res.json();
}

export async function generateReport(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/generate_report`, { method: "POST" });
  return res.json();
}

/**
 * V5: SSE 流式生成报告
 * 返回 EventSource，通过 onSection 回调逐段接收报告
 */
export function generateReportStream(sessionId, onSection, onComplete, onError) {
  const eventSource = new EventSource(`${API_BASE}/session/${sessionId}/generate_report_stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "section" && onSection) {
        onSection(data.name, data.data);
      } else if (data.type === "complete" && onComplete) {
        onComplete(data.report);
        eventSource.close();
      } else if (data.type === "error" && onError) {
        onError(data.message);
        eventSource.close();
      }
    } catch (e) {
      console.error("[SSE] Parse error:", e);
    }
  };

  eventSource.onerror = (err) => {
    console.error("[SSE] Connection error:", err);
    if (onError) onError("Connection failed");
    eventSource.close();
  };

  return eventSource;
}

/**
 * V5: 更新用户档案（留学时长、文化背景等）
 */
export async function updateProfile(sessionId, updates) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/update_profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, ...updates }),
  });
  return res.json();
}
