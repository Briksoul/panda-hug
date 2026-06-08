import { useState, useRef, useEffect, useCallback } from "react";
import { createSession, sendMessage, getSessionState, getSessionHistory, navigateToPhase } from "./utils/api";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import HomePage from "./components/HomePage";
import PhaseNavigation from "./components/PhaseNavigation";

const STORAGE_KEY = "panda_harmony_session_id";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionState, setSessionState] = useState(null);
  const [agentTrace, setAgentTrace] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [language, setLanguage] = useState("zh");
  const [currentPhase, setCurrentPhase] = useState("home");
  const [actionLinks, setActionLinks] = useState([]);

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
      setCurrentPhase(data.state?.current_phase || "home");
      setStarted(true);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setRestoring(false);
    }
  };

  // 创建新会话
  const handleStart = useCallback(async (userName, selectedLang) => {
    setLoading(true);
    const lang = selectedLang || language;
    setLanguage(lang);
    try {
      const data = await createSession(userName, lang);
      setSessionId(data.session_id);
      setMessages([
        { role: "assistant", content: data.welcome_message, agent: "cognitive_orchestrator" },
      ]);
      setStarted(true);
      setCurrentPhase("home");
      localStorage.setItem(STORAGE_KEY, data.session_id);
      const state = await getSessionState(data.session_id);
      setSessionState(state);
    } catch (err) {
      console.error("创建会话失败:", err);
    } finally {
      setLoading(false);
    }
  }, [language]);

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
          action_links: data.action_links,
        };
        setMessages((prev) => [...prev, agentMsg]);
        setAgentTrace(data.agent_trace || []);
        setActionLinks(data.action_links || []);
        const state = await getSessionState(sessionId);
        setSessionState(state);
        setCurrentPhase(state?.current_phase || "counseling");
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

  // 导航到指定阶段
  const handleNavigate = useCallback(
    async (targetPhase) => {
      if (!sessionId) return;

      setLoading(true);
      try {
        const data = await navigateToPhase(sessionId, targetPhase);
        const agentMsg = {
          role: "assistant",
          content: data.content,
          agent: data.agent,
          suggestions: data.suggestions,
          emotion_level: data.emotion_level,
          metadata: data.metadata,
          action_links: data.action_links,
        };
        setMessages((prev) => [...prev, agentMsg]);
        setActionLinks(data.action_links || []);
        const state = await getSessionState(sessionId);
        setSessionState(state);
        setCurrentPhase(targetPhase);
      } catch (err) {
        console.error("导航失败:", err);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  // 新建会话
  const handleNewSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setMessages([]);
    setSessionState(null);
    setStarted(false);
    setCurrentPhase("home");
    setActionLinks([]);
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
      <Sidebar
        state={sessionState}
        agentTrace={agentTrace}
        onNewSession={handleNewSession}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 flex flex-col">
        {/* 阶段导航栏 */}
        <PhaseNavigation
          currentPhase={currentPhase}
          onNavigate={handleNavigate}
          actionLinks={actionLinks}
          language={language}
        />
        {/* 主内容区 */}
        {currentPhase === "home" ? (
          <HomePage
            onNavigate={handleNavigate}
            state={sessionState}
            language={language}
          />
        ) : (
          <ChatWindow
            messages={messages}
            onSend={handleSend}
            loading={loading}
            insightReport={sessionState?.insight_report}
            currentPhase={currentPhase}
            onNavigate={handleNavigate}
            language={language}
          />
        )}
      </div>
    </div>
  );
}
