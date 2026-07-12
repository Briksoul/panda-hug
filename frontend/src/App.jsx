import { useState, useEffect, useCallback } from "react";
import {
  createSession,
  getGrowthRecord,
  getSessionHistory,
  getSessionState,
  sendMessageStream,
} from "./utils/api";
import ChatWindow from "./components/ChatWindow";
import GrowthRecord from "./components/GrowthRecord";
import InsightReport from "./components/InsightReport";
import MobileNavigation from "./components/MobileNavigation";
import Sidebar from "./components/Sidebar";
import TrainingCenter from "./components/TrainingCenter";
import WelcomeScreen from "./components/WelcomeScreen";

const STORAGE_KEY = "panda_harmony_session_id";
const USER_STORAGE_KEY = "panda_harmony_user_id";
const EMOTION_MESSAGES = {
  zh: {
    happy: "我现在感觉充满活力",
    okay: "我现在感觉比较平静",
    anxious: "我现在感觉有些焦虑",
    sad: "我现在感觉有些低落",
    tired: "我现在感觉略显疲惫",
  },
  en: {
    happy: "I feel energetic right now.",
    okay: "I feel relatively calm right now.",
    anxious: "I feel a little anxious right now.",
    sad: "I have been feeling a little low.",
    tired: "I feel somewhat tired right now.",
  },
};

function getOrCreateUserId() {
  const storedUserId = localStorage.getItem(USER_STORAGE_KEY);
  if (storedUserId) return storedUserId;

  const userId = globalThis.crypto?.randomUUID?.()
    || `panda-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(USER_STORAGE_KEY, userId);
  return userId;
}

function createStreamMessageId() {
  return `stream-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionState, setSessionState] = useState(null);
  const [agentTrace, setAgentTrace] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [growthRecord, setGrowthRecord] = useState(null);
  const [growthLoading, setGrowthLoading] = useState(false);
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

  useEffect(() => {
    if (!sessionId || sessionState?.report_status !== "generating") return;

    let cancelled = false;
    const pollReport = async () => {
      try {
        const state = await getSessionState(sessionId);
        if (!cancelled) setSessionState(state);
      } catch {
        // Keep the current session state and retry on the next interval.
      }
    };
    const intervalId = window.setInterval(pollReport, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [sessionId, sessionState?.report_status]);

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
      setActiveView("chat");
      setStarted(true);
    } catch {
      // 会话已过期或不存在，清除本地存储
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setRestoring(false);
    }
  };

  // 创建新会话
  const handleStart = useCallback(async (
    userName,
    emotion,
    culturalIdentity,
    language,
    studyAbroadMonths,
  ) => {
    setLoading(true);
    let activeStreamId = null;
    try {
      const session = await createSession(
        userName,
        getOrCreateUserId(),
        culturalIdentity,
        language,
        studyAbroadMonths,
      );
      const welcomeMessage = {
        role: "assistant",
        content: session.welcome_message,
        agent: "triage",
      };
      const firstMessage = EMOTION_MESSAGES[language]?.[emotion] || "";

      setSessionId(session.session_id);
      setMessages([welcomeMessage]);
      setActiveView("chat");
      setStarted(true);
      localStorage.setItem(STORAGE_KEY, session.session_id);

      if (firstMessage) {
        const userMessage = { role: "user", content: firstMessage };
        const streamId = createStreamMessageId();
        activeStreamId = streamId;
        setMessages([
          welcomeMessage,
          userMessage,
          {
            id: streamId,
            role: "assistant",
            content: "",
            agent: "triage",
            streaming: true,
          },
        ]);
        const response = await sendMessageStream(
          session.session_id,
          firstMessage,
          "text",
          (delta) => {
            setMessages((prev) => prev.map((message) => (
              message.id === streamId
                ? { ...message, content: message.content + delta }
                : message
            )));
          },
          options.voiceAnalysis || null,
        );
        setMessages((prev) => prev.map((message) => (
          message.id === streamId
            ? {
                ...message,
                content: response.content,
                agent: response.agent,
                suggestions: response.suggestions,
                emotion_level: response.emotion_level,
                metadata: response.metadata,
                streaming: false,
              }
            : message
        )));
        setAgentTrace(response.agent_trace || []);
      }

      const state = await getSessionState(session.session_id);
      setSessionState(state);
    } catch (err) {
      console.error("创建会话失败:", err);
      if (activeStreamId) {
        setMessages((prev) => prev.map((message) => (
          message.id === activeStreamId
            ? {
                ...message,
                content: "抱歉，网络出了点问题，请再试一次。",
                agent: "system",
                streaming: false,
              }
            : message
        )));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 发送消息
  const handleSend = useCallback(
    async (text, options = {}) => {
      if (!sessionId || !text.trim()) return;

      const userMsg = { role: "user", content: text };
      const streamId = createStreamMessageId();
      const streamMsg = {
        id: streamId,
        role: "assistant",
        content: "",
        agent: sessionState?.current_agent,
        streaming: true,
      };
      setMessages((prev) => [...prev, userMsg, streamMsg]);
      setLoading(true);

      try {
        const data = await sendMessageStream(
          sessionId,
          text,
          options.source || "text",
          (delta) => {
            setMessages((prev) => prev.map((message) => (
              message.id === streamId
                ? { ...message, content: message.content + delta }
                : message
            )));
          },
        );
        setMessages((prev) => prev.map((message) => (
          message.id === streamId
            ? {
                ...message,
                content: data.content,
                agent: data.agent,
                suggestions: data.suggestions,
                emotion_level: data.emotion_level,
                metadata: data.metadata,
                streaming: false,
              }
            : message
        )));
        setAgentTrace(data.agent_trace || []);
        const state = await getSessionState(sessionId);
        setSessionState(state);
      } catch (err) {
        setMessages((prev) => prev.map((message) => (
          message.id === streamId
            ? {
                ...message,
                content: "抱歉，网络出了点问题，请再试一次。",
                agent: "system",
                streaming: false,
              }
            : message
        )));
      } finally {
        setLoading(false);
      }
    },
    [sessionId, sessionState?.current_agent]
  );

  const handleOpenGrowth = useCallback(async () => {
    if (!sessionId) return;
    setActiveView("growth");
    setGrowthLoading(true);
    try {
      const data = await getGrowthRecord(sessionId);
      setGrowthRecord(data);
    } catch (error) {
      console.error("加载成长记录失败:", error);
      setGrowthRecord(null);
    } finally {
      setGrowthLoading(false);
    }
  }, [sessionId]);

  const handleTrainingRecorded = useCallback(async () => {
    setGrowthRecord(null);
    if (!sessionId) return;
    try {
      const state = await getSessionState(sessionId);
      setSessionState(state);
    } catch {
      // The saved training will be restored on the next state refresh.
    }
  }, [sessionId]);

  // 新建会话（清除旧的）
  const handleNewSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setMessages([]);
    setSessionState(null);
    setGrowthRecord(null);
    setActiveView("chat");
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
      <div className="hidden lg:block">
        <Sidebar
          state={sessionState}
          agentTrace={agentTrace}
          activeView={activeView}
          onShowChat={() => setActiveView("chat")}
          onShowReport={() => setActiveView("report")}
          onShowTraining={() => setActiveView("training")}
          onOpenGrowth={handleOpenGrowth}
          onNewSession={handleNewSession}
          language={sessionState?.profile?.language || "zh"}
        />
      </div>
      <div className="min-w-0 flex-1">
        {activeView === "growth" ? (
          <GrowthRecord
            data={growthRecord}
            loading={growthLoading}
            onRefresh={handleOpenGrowth}
          />
        ) : activeView === "training" ? (
          <TrainingCenter
            sessionId={sessionId}
            language={sessionState?.profile?.language || "zh"}
            onRecorded={handleTrainingRecorded}
            onGoChat={() => setActiveView("chat")}
          />
        ) : activeView === "report" ? (
          <div className="h-screen overflow-y-auto px-4 py-8 pb-24 lg:px-8 lg:pb-8">
            <div className="mx-auto max-w-3xl">
              <InsightReport report={sessionState?.insight_report} />
            </div>
          </div>
        ) : (
          <ChatWindow
            sessionId={sessionId}
            messages={messages}
            onSend={handleSend}
            loading={loading}
            insightReport={null}
            language={sessionState?.profile?.language || "zh"}
          />
        )}
      </div>
      <MobileNavigation
        activeView={activeView}
        language={sessionState?.profile?.language || "zh"}
        reportReady={Boolean(
          sessionState?.insight_report
          && Object.keys(sessionState.insight_report).length > 0
        )}
        onNavigate={(view) => {
          if (view === "growth") {
            handleOpenGrowth();
          } else {
            setActiveView(view);
          }
        }}
      />
    </div>
  );
}
