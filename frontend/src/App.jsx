import { useState, useEffect } from "react";
import { createSession, sendMessage, getSessionState, navigateToPhase } from "./utils/api";
import HomePage from "./components/HomePage";
import EmotionCheck from "./components/EmotionCheck";
import Counseling from "./components/Counseling";
import InsightReport from "./components/InsightReport";
import Training from "./components/Training";
import Navbar from "./components/Navbar";

const STORAGE_KEY = "panda_…n_id";

// 流程顺序（用于超链接跳转）
const FLOW_ORDER = ["home", "emotion", "counseling", "insight", "training"];

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [currentPage, setCurrentPage] = useState("home");
  const [sessionState, setSessionState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("zh");
  const [messages, setMessages] = useState([]);
  const [insightReport, setInsightReport] = useState(null);

  // 启动时恢复会话
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      restoreSession(saved);
    }
  }, []);

  const restoreSession = async (sid) => {
    try {
      const state = await getSessionState(sid);
      setSessionId(sid);
      setSessionState(state);
      setLanguage(state?.profile?.language || "zh");
      setCurrentPage(state?.current_phase || "home");
      if (state?.insight_report) setInsightReport(state.insight_report);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // 创建新会话
  const handleStart = async (lang) => {
    setLanguage(lang);
    setLoading(true);
    try {
      const data = await createSession("", lang);
      setSessionId(data.session_id);
      localStorage.setItem(STORAGE_KEY, data.session_id);
      const state = await getSessionState(data.session_id);
      setSessionState(state);
      setCurrentPage("emotion");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 导航到页面
  const navigate = async (page) => {
    if (!sessionId && page !== "home") {
      // 需要先创建会话
      return;
    }
    setCurrentPage(page);
    if (sessionId) {
      try {
        const data = await navigateToPhase(sessionId, page);
        const state = await getSessionState(sessionId);
        setSessionState(state);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 发送消息（倾诉陪伴用）
  const handleSend = async (text) => {
    if (!sessionId || !text.trim()) {
      console.log('[onSend] blocked:', { sessionId, text: text.trim() });
      return;
    }
    console.log('[onSend] sending:', text, 'sessionId:', sessionId);
    setLoading(true);
    try {
      const data = await sendMessage(sessionId, text);
      const newMessages = [
        { role: "user", content: text },
        { role: "assistant", content: data.content, agent: data.agent, suggestions: data.suggestions, action_links: data.action_links },
      ];
      setMessages((prev) => [...prev, ...newMessages]);
      const state = await getSessionState(sessionId);
      setSessionState(state);
      if (state?.insight_report) setInsightReport(state.insight_report);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 进入下一阶段（超链接用）
  const goNext = (from) => {
    const idx = FLOW_ORDER.indexOf(from);
    if (idx >= 0 && idx < FLOW_ORDER.length - 1) {
      navigate(FLOW_ORDER[idx + 1]);
    }
  };

  // 新建会话
  const handleNewSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setSessionState(null);
    setCurrentPage("home");
    setMessages([]);
    setInsightReport(null);
  };

  const t = (zh, en) => (language === "zh" ? zh : en);

  return (
    <div className="min-h-screen bg-[#faf6f0]">
      <Navbar
        currentPage={currentPage}
        onNavigate={navigate}
        onNewSession={handleNewSession}
        language={language}
        sessionId={sessionId}
      />
      <main>
        {currentPage === "home" && (
          <HomePage onStart={handleStart} onNavigate={navigate} language={language} loading={loading} sessionId={sessionId} />
        )}
        {currentPage === "emotion" && (
          <EmotionCheck
            sessionId={sessionId}
            state={sessionState}
            onNavigate={navigate}
            onGoNext={() => goNext("emotion")}
            language={language}
            onSend={handleSend}
          />
        )}
        {currentPage === "counseling" && (
          <Counseling
            sessionId={sessionId}
            messages={messages}
            onSend={handleSend}
            loading={loading}
            state={sessionState}
            onNavigate={navigate}
            onGoNext={() => goNext("counseling")}
            language={language}
          />
        )}
        {currentPage === "insight" && (
          <InsightReport
            report={insightReport}
            state={sessionState}
            onNavigate={navigate}
            onGoNext={() => goNext("insight")}
            language={language}
          />
        )}
        {currentPage === "training" && (
          <Training
            sessionId={sessionId}
            state={sessionState}
            onNavigate={navigate}
            onGoNext={() => goNext("training")}
            language={language}
            onSend={handleSend}
          />
        )}

      </main>
    </div>
  );
}
