import { useState, useRef, useEffect, useCallback } from "react";
import { createSession, sendMessage, getSessionState, getSessionHistory } from "./utils/api";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";

const STORAGE_KEY = "panda_harmony_session_id";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionState, setSessionState] = useState(null);
  const [agentTrace, setAgentTrace] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [restoring, setRestoring] = useState(true);

  // 启动时检查是否有未完成的会话
  useEffect(() => {
    const savedSessionId = localStorage.getItem(STORAGE_KEY);
    if (savedSessionId) {
      restoreSession(savedSessionId);
    } else {
      setRestoring(false);
    }
  }, []);

  // 恢复已有会话
  const restoreSession = async (sid) => {
    try {
      const data = await getSessionHistory(sid);
      const restoredMessages = data.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        agent: msg.agent || undefined,
      }));
      setMessages(restoredMessages);
      setSessionId(sid);
      setSessionState(data.state);
      setStarted(true);
    } catch {
      // 会话已过期或不存在，清除本地存储
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setRestoring(false);
    }
  };

  // 创建新会话
  const handleStart = useCallback(async (userName, emotion) => {
    setLoading(true);
    try {
      const data = await createSession(userName);
      setSessionId(data.session_id);
      // 如果选择了情绪，自动发送给 Triage Agent
      const firstMessage = emotion
        ? `我现在感觉${emotion === 'positive' ? '充满活力' : emotion === 'mild' ? '还可以' : emotion === 'tired' ? '略显疲惫' : emotion === 'anxious' ? '有些焦虑' : '有些低落'}`
        : "";
      setMessages([
        { role: "assistant", content: data.welcome_message, agent: "triage" },
      ]);
      setStarted(true);
      localStorage.setItem(STORAGE_KEY, data.session_id);
      const state = await getSessionState(data.session_id);
      setSessionState(state);
      // 自动发送情绪选择
      if (firstMessage) {
        setTimeout(() => handleSend(firstMessage), 500);
      }
    } catch (err) {
      console.error("创建会话失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 发送消息
  const handleSend = useCallback(
    async (text) => {
      if (!sessionId || !text.trim()) return;

      const userMsg = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const data = await sendMessage(sessionId, text);
        const agentMsg = {
          role: "assistant",
          content: data.content,
          agent: data.agent,
          suggestions: data.suggestions,
          emotion_level: data.emotion_level,
          metadata: data.metadata,
        };
        setMessages((prev) => [...prev, agentMsg]);
        setAgentTrace(data.agent_trace || []);
        const state = await getSessionState(sessionId);
        setSessionState(state);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，网络出了点问题，请再试一次。", agent: "system" },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  // 新建会话（清除旧的）
  const handleNewSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setMessages([]);
    setSessionState(null);
    setStarted(false);
  }, []);

  // 加载中
  if (restoring) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="text-6xl mb-4 breathe-animation">🐼</div>
          <p className="text-gray-500">正在恢复会话...</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return <WelcomeScreen onStart={handleStart} loading={loading} />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Sidebar state={sessionState} agentTrace={agentTrace} onNewSession={handleNewSession} />
      <ChatWindow
        messages={messages}
        onSend={handleSend}
        loading={loading}
        insightReport={sessionState?.insight_report}
      />
    </div>
  );
}
