import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { useBrowserVoice } from "../hooks/useBrowserVoice";
import { getHumeAccessToken } from "../utils/api";

const SPEECH_RATE_KEY = "panda_hug_speech_rate";
const speechRates = [0.9, 1.0, 1.15, 1.3, 1.4];
const emotionLabels = {
  admiration: "钦佩",
  amusement: "愉悦",
  anger: "愤怒",
  anxiety: "焦虑",
  awkwardness: "尴尬",
  boredom: "无聊",
  calmness: "平静",
  confusion: "困惑",
  contemplation: "沉思",
  disappointment: "失望",
  distress: "痛苦",
  excitement: "兴奋",
  fear: "恐惧",
  interest: "兴趣",
  joy: "喜悦",
  sadness: "悲伤",
  satisfaction: "满足",
  shame: "羞愧",
  sympathy: "同情",
  tiredness: "疲惫",
};

function formatEmotionName(name, isEnglish) {
  if (!isEnglish && emotionLabels[name]) return emotionLabels[name];
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function VoicePanelContent({
  sessionId,
  onSendMessage,
  messages,
  loading,
  preferredLanguage = "zh",
  humeInterimText = "",
  clearHumeInterim,
}) {
  const browserVoice = useBrowserVoice();
  const {
    connect,
    disconnect,
    mute,
    unmute,
    muteAudio,
    pauseAssistant,
    status,
    error: humeSdkError,
    isMuted,
    lastUserMessage,
  } = useVoice();
  const [mode, setMode] = useState("text");
  const [voiceEngine, setVoiceEngine] = useState("browser");
  const [language, setLanguage] = useState(
    preferredLanguage === "en" ? "en-US" : "zh-CN",
  );
  const [speechRate, setSpeechRate] = useState(() => {
    const savedRate = Number(localStorage.getItem(SPEECH_RATE_KEY));
    return speechRates.includes(savedRate) ? savedRate : 1.15;
  });
  const [interimText, setInterimText] = useState("");
  const [humeError, setHumeError] = useState("");
  const [voiceRecordStatus, setVoiceRecordStatus] = useState("");
  const lastAssistantRef = useRef("");
  const recordedVoiceMessageRef = useRef("");
  const isEnglish = preferredLanguage === "en";
  const humeConnected = status.value === "connected";
  const humeConnecting = status.value === "connecting";

  useEffect(() => {
    if (!humeConnected && !humeConnecting) clearHumeInterim?.();
  }, [clearHumeInterim, humeConnected, humeConnecting]);

  const topEmotions = useMemo(() => {
    const scores = lastUserMessage?.models?.prosody?.scores || {};
    return Object.entries(scores)
      .sort(([, first], [, second]) => second - first)
      .slice(0, 5);
  }, [lastUserMessage]);

  useEffect(() => {
    setLanguage(preferredLanguage === "en" ? "en-US" : "zh-CN");
  }, [preferredLanguage]);

  useEffect(() => {
    localStorage.setItem(SPEECH_RATE_KEY, String(speechRate));
  }, [speechRate]);

  useEffect(() => {
    const content = lastUserMessage?.message?.content?.trim();
    if (!sessionId || !content || lastUserMessage?.interim || loading) return;

    const key = [
      lastUserMessage.time?.begin,
      lastUserMessage.time?.end,
      content,
    ].join(":");
    if (recordedVoiceMessageRef.current === key) return;
    recordedVoiceMessageRef.current = key;
    setVoiceRecordStatus("processing");
    mute();

    Promise.resolve(onSendMessage(content, {
      source: "voice",
      voiceAnalysis: {
        transcript: content,
        emotion_scores: lastUserMessage.models?.prosody?.scores || {},
      },
    }))
      .then(() => {
        setVoiceRecordStatus("saved");
      })
      .catch(() => {
        setVoiceRecordStatus("error");
        unmute();
      });
  }, [lastUserMessage, loading, mute, onSendMessage, sessionId, unmute]);

  useEffect(() => {
    if (
      mode !== "voice"
      || !messages.length
      || loading
    ) return;

    const last = messages[messages.length - 1];
    if (last.role === "assistant" && last.content !== lastAssistantRef.current) {
      lastAssistantRef.current = last.content;
      const speechText = last.content
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[*#>`_]/g, "")
        .trim();
      if (speechText) {
        const shouldResumeHume = voiceEngine === "hume" && humeConnected;
        if (shouldResumeHume) mute();
        browserVoice.speak(
          speechText,
          undefined,
          speechRate,
          shouldResumeHume ? unmute : undefined,
        );
      }
    }
  }, [
    browserVoice,
    loading,
    messages,
    mode,
    mute,
    speechRate,
    unmute,
    voiceEngine,
    humeConnected,
  ]);

  const stopAllVoice = () => {
    browserVoice.stopListening();
    browserVoice.stopSpeaking();
    if (humeConnected || humeConnecting) void disconnect();
  };

  const handleModeSwitch = () => {
    if (mode === "voice") {
      stopAllVoice();
      setMode("text");
    } else {
      setMode("voice");
    }
  };

  const handleEngineChange = (engine) => {
    if (engine === voiceEngine) return;
    stopAllVoice();
    setHumeError("");
    setVoiceEngine(engine);
  };

  const handleBrowserVoiceToggle = () => {
    if (browserVoice.listening) {
      browserVoice.stopListening();
      return;
    }

    setInterimText("");
    browserVoice.startListening((text) => {
      if (text.trim() && !loading) {
        onSendMessage(text.trim(), { source: "voice" });
        setInterimText("");
      }
    }, {
      language,
      onInterim: setInterimText,
    });
  };

  const handleHumeToggle = async () => {
    setHumeError("");
    if (humeConnected || humeConnecting) {
      await disconnect();
      return;
    }

    try {
      recordedVoiceMessageRef.current = "";
      setVoiceRecordStatus("");
      muteAudio();
      const token = await getHumeAccessToken();
      const options = {
        auth: {
          type: "accessToken",
          value: token.access_token,
        },
        verboseTranscription: true,
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };
      if (token.config_id) options.configId = token.config_id;
      await connect(options);
      pauseAssistant();
      muteAudio();
    } catch (error) {
      setHumeError(error.message || "Unable to connect to Hume EVI");
    }
  };

  const humeStatusText = humeConnected
    ? (isEnglish ? "Connected · Hume sensing is active" : "已连接 · Hume 正在进行声学感知")
    : humeConnecting
      ? (isEnglish ? "Connecting to Hume EVI..." : "正在连接 Hume EVI...")
      : (isEnglish ? "Start emotion-aware voice chat" : "开始声学增强语音对话");

  return (
    <div className="voice-panel">
      <div className="mode-switch">
        <button
          className={`mode-btn ${mode === "text" ? "active" : ""}`}
          onClick={() => {
            stopAllVoice();
            setMode("text");
          }}
        >
          ⌨️ {isEnglish ? "Text" : "文字"}
        </button>
        <button
          className={`mode-btn ${mode === "voice" ? "active" : ""}`}
          onClick={handleModeSwitch}
        >
          🎤 {isEnglish ? "Voice" : "语音"}
        </button>
      </div>

      {mode === "voice" && (
        <div className="voice-controls">
          <div className="engine-switch">
            <button
              className={voiceEngine === "browser" ? "active" : ""}
              onClick={() => handleEngineChange("browser")}
            >
              {isEnglish ? "Browser voice" : "浏览器语音"}
            </button>
            <button
              className={voiceEngine === "hume" ? "active" : ""}
              onClick={() => handleEngineChange("hume")}
            >
              Hume EVI
            </button>
          </div>

          {voiceEngine === "browser" ? (
            browserVoice.supported ? (
              <>
                <div className="language-switch">
                  <button
                    className={language === "zh-CN" ? "active" : ""}
                    onClick={() => setLanguage("zh-CN")}
                  >
                    中文
                  </button>
                  <button
                    className={language === "en-US" ? "active" : ""}
                    onClick={() => setLanguage("en-US")}
                  >
                    English
                  </button>
                </div>
                <div className="rate-switch" aria-label="Speech rate">
                  {speechRates.map((rate) => (
                    <button
                      key={rate}
                      className={speechRate === rate ? "active" : ""}
                      onClick={() => setSpeechRate(rate)}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
                <button
                  className={`mic-btn ${browserVoice.listening ? "recording" : ""} ${browserVoice.speaking ? "ai-speaking" : ""}`}
                  onClick={handleBrowserVoiceToggle}
                  disabled={browserVoice.speaking || loading}
                >
                  {browserVoice.speaking
                    ? "🔊"
                    : browserVoice.listening
                      ? "⏹️"
                      : "🎤"}
                </button>
                <div className="voice-status">
                  {browserVoice.speaking && (
                    <span className="status-text ai">
                      {isEnglish ? "AI is speaking..." : "AI 正在说话..."}
                    </span>
                  )}
                  {browserVoice.listening && (
                    <span className="status-text user">
                      {isEnglish ? "Listening..." : "正在听你说话..."}
                    </span>
                  )}
                  {!browserVoice.speaking && !browserVoice.listening && (
                    <span className="status-text idle">
                      {isEnglish ? "Tap the microphone to start" : "点击麦克风开始"}
                    </span>
                  )}
                </div>
                {interimText && <div className="interim-text">{interimText}</div>}
                {browserVoice.error && (
                  <div className="voice-error">
                    {isEnglish ? "Speech recognition failed: " : "语音识别失败："}
                    {browserVoice.error}
                  </div>
                )}
              </>
            ) : (
              <div className="voice-error">
                {isEnglish
                  ? "Browser speech recognition is not supported."
                  : "当前浏览器不支持浏览器语音识别。"}
              </div>
            )
          ) : (
            <>
              <button
                className={`mic-btn ${humeConnected ? "recording" : ""} ${browserVoice.speaking ? "ai-speaking" : ""}`}
                onClick={handleHumeToggle}
                disabled={humeConnecting}
              >
                {humeConnecting ? "…" : humeConnected ? "⏹️" : "🎙️"}
              </button>
              <div className="voice-status">
                <span className={`status-text ${humeConnected ? "user" : "idle"}`}>
                  {browserVoice.speaking
                    ? (isEnglish ? "Panda Hug is speaking..." : "Panda Hug 正在回应...")
                    : humeStatusText}
                </span>
              </div>
              {humeConnected && (
                <button
                  className="secondary-btn"
                  onClick={isMuted ? unmute : mute}
                >
                  {isMuted
                    ? (isEnglish ? "Unmute microphone" : "打开麦克风")
                    : (isEnglish ? "Mute microphone" : "静音麦克风")}
                </button>
              )}
              {humeInterimText ? (
                <div className="hume-transcript live" aria-live="polite">
                  <strong>{isEnglish ? "Recognizing: " : "正在识别："}</strong>
                  {humeInterimText}
                  <span className="transcript-cursor" aria-hidden="true" />
                </div>
              ) : lastUserMessage?.message?.content ? (
                <div className="hume-transcript">
                  <strong>{isEnglish ? "You: " : "你："}</strong>
                  {lastUserMessage.message.content}
                </div>
              ) : null}
              {topEmotions.length > 0 && (
                <div className="emotion-panel">
                  <span>{isEnglish ? "Vocal expression" : "声学情绪"}</span>
                  <div className="emotion-list">
                    {topEmotions.map(([name, score]) => (
                      <span key={name} className="emotion-chip">
                        {formatEmotionName(name, isEnglish)} {Math.round(score * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {voiceRecordStatus === "processing" && (
                <div className="record-status">
                  {isEnglish ? "Panda Hug is processing voice and emotion..." : "Panda Hug 正在融合语音与声学情绪..."}
                </div>
              )}
              {voiceRecordStatus === "saved" && (
                <div className="record-status saved">
                  {isEnglish ? "Processed by Panda Hug and saved" : "已由 Panda Hug 处理并写入成长记录"}
                </div>
              )}
              {voiceRecordStatus === "error" && (
                <div className="voice-error">
                  {isEnglish ? "Unable to save voice analysis" : "声学情绪记录失败"}
                </div>
              )}
              {(humeError || humeSdkError) && (
                <div className="voice-error">
                  {humeError
                    || humeSdkError?.message
                    || humeSdkError?.reason
                    || "Hume EVI connection failed"}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        .voice-panel {
          border-top: 1px solid #e5e7eb;
          padding: 12px;
          background: #fafafa;
        }
        .mode-switch, .engine-switch {
          display: flex;
          gap: 4px;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 3px;
        }
        .mode-switch { margin-bottom: 12px; }
        .mode-btn, .engine-switch button {
          flex: 1;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          color: #6b7280;
          transition: all 0.2s;
        }
        .mode-btn.active, .engine-switch button.active {
          background: white;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .voice-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .engine-switch { width: min(100%, 360px); }
        .language-switch {
          display: flex;
          gap: 4px;
          padding: 3px;
          border-radius: 8px;
          background: #f3f4f6;
        }
        .language-switch button, .rate-switch button, .secondary-btn {
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 4px 10px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          font-size: 12px;
        }
        .language-switch button.active, .rate-switch button.active {
          border-color: #818cf8;
          background: #eef2ff;
          color: #4f46e5;
          font-weight: 600;
        }
        .rate-switch {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 4px;
        }
        .mic-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 3px solid #e5e7eb;
          background: white;
          font-size: 28px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mic-btn:hover { border-color: #6366f1; }
        .mic-btn.recording {
          border-color: #ef4444;
          background: #fef2f2;
          animation: voice-pulse 1.5s infinite;
        }
        .mic-btn.ai-speaking {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .mic-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        @keyframes voice-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }
        .voice-status { font-size: 13px; text-align: center; }
        .status-text.ai { color: #059669; }
        .status-text.user { color: #6366f1; }
        .status-text.idle { color: #9ca3af; }
        .interim-text, .hume-transcript {
          font-size: 13px;
          color: #6b7280;
          max-width: 520px;
          text-align: center;
        }
        .hume-transcript.live {
          color: #4f46e5;
          min-height: 20px;
        }
        .transcript-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          margin-left: 3px;
          vertical-align: -2px;
          background: currentColor;
          animation: transcript-blink 0.8s steps(2, start) infinite;
        }
        @keyframes transcript-blink {
          50% { opacity: 0; }
        }
        .hume-transcript.assistant { color: #374151; }
        .voice-error {
          color: #b91c1c;
          font-size: 12px;
          text-align: center;
        }
        .emotion-panel {
          width: min(100%, 520px);
          padding: 10px;
          border-radius: 10px;
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 12px;
          text-align: center;
        }
        .emotion-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
          margin-top: 7px;
        }
        .emotion-chip {
          padding: 3px 7px;
          border-radius: 999px;
          background: white;
          border: 1px solid #ddd6fe;
        }
        .record-status {
          color: #6b7280;
          font-size: 12px;
        }
        .record-status.saved { color: #059669; }
      `}</style>
    </div>
  );
}

export default function VoicePanel(props) {
  const [humeInterimText, setHumeInterimText] = useState("");
  const clearHumeInterim = useCallback(() => setHumeInterimText(""), []);
  const handleHumeMessage = useCallback((message) => {
    if (message?.type !== "user_message") return;
    const content = message.message?.content?.trim() || "";
    if (message.interim) {
      setHumeInterimText(content);
    } else {
      setHumeInterimText("");
    }
  }, []);

  return (
    <VoiceProvider
      clearMessagesOnDisconnect={false}
      messageHistoryLimit={50}
      onMessage={handleHumeMessage}
    >
      <VoicePanelContent
        {...props}
        humeInterimText={humeInterimText}
        clearHumeInterim={clearHumeInterim}
      />
    </VoiceProvider>
  );
}
