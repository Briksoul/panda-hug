import { useState, useEffect, useCallback, useRef } from "react";
import { createSession, sendMessage, getSessionState, navigateToPhase, updateProfile } from "./utils/api";
import HomePage from "./components/HomePage";
import EmotionCheck from "./components/EmotionCheck";
import Counseling from "./components/Counseling";
import InsightReport from "./components/InsightReport";
import Training from "./components/Training";
import Navbar from "./components/Navbar";

const STORAGE_KEY = "panda_hug_session_id";

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
  // V5 新增
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const reconnectTimer = useRef(null);

  // V5: 断线重连 — 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 重连后静默拉取状态
      if (sessionId) {
        restoreSession(sessionId);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sessionId]);

  // V5: WebSocket 心跳检测（简化版 — 定期检查会话状态）
  useEffect(() => {
    if (!sessionId) return;

    const heartbeat = setInterval(async () => {
      try {
        const state = await getSessionState(sessionId);
        setSessionState(state);
      } catch {
        // 会话可能已过期
        console.warn("[Heartbeat] Session check failed");
      }
    }, 60000); // 每 60 秒检查一次

    return () => clearInterval(heartbeat);
  }, [sessionId]);

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
  const handleStart = async (lang, studyAbroadMonths) => {
    setLanguage(lang);
    setLoading(true);
    try {
      const data = await createSession("", lang);
      setSessionId(data.session_id);
      localStorage.setItem(STORAGE_KEY, data.session_id);
      // V5: 更新留学时长
      if (studyAbroadMonths !== undefined) {
        await updateProfile(data.session_id, { study_abroad_months: studyAbroadMonths });
      }
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
      return;
    }
    // 进入倾诉陪伴时清空消息，显示欢迎语
    if (page === "counseling") {
      setMessages([]);
    }
    setCurrentPage(page);
    if (sessionId) {
      try {
        await navigateToPhase(sessionId, page);
        const state = await getSessionState(sessionId);
        setSessionState(state);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 情绪识别专用：只通知后端，不污染聊天记录
  const handleEmotionSend = async (text) => {
    if (!sessionId || !text.trim()) return;
    try {
      await sendMessage(sessionId, text);
      const state = await getSessionState(sessionId);
      setSessionState(state);
    } catch (e) {
      console.error(e);
    }
  };

  // 发送消息（倾诉陪伴用）
  const handleSend = async (text) => {
    if (!sessionId || !text.trim()) return;
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

  // V5: 语言切换（不刷新页面，保留状态，通知后端）
  const handleLanguageSwitch = useCallback(async () => {
    const newLang = language === "zh" ? "en" : "zh";
    setLanguage(newLang);
    // 通知后端更新语言
    if (sessionId) {
      try {
        await sendMessage(sessionId, newLang === "zh" ? "切换到中文" : "Switch to English");
      } catch (e) {
        console.error("[Language] Failed to notify backend:", e);
      }
    }
  }, [language, sessionId]);

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
      {/* V5: 离线提示 */}
      {!isOnline && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
          {language === "zh" ? "📡 网络已断开，重连中..." : "📡 Network disconnected, reconnecting..."}
        </div>
      )}

      <Navbar
        currentPage={currentPage}
        onNavigate={navigate}
        onNewSession={handleNewSession}
        language={language}
        sessionId={sessionId}
        onLanguageSwitch={handleLanguageSwitch}
      />
      <main>
        {currentPage === "home" && (
          <HomePage onStart={handleStart} onNavigate={navigate} language={language} loading={loading} sessionId={sessionId} onNewSession={handleNewSession} />
        )}
        {currentPage === "emotion" && (
          <EmotionCheck
            sessionId={sessionId}
            state={sessionState}
            onNavigate={navigate}
            onGoNext={() => goNext("emotion")}
            language={language}
            onSend={handleEmotionSend}
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
            sessionId={sessionId}
            onReportGenerated={(r) => setInsightReport(r)}
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
