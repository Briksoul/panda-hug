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
    if (!messages.length || loading) return;

    const last = messages[messages.length - 1];
    if (last.role === "panda" && last.text !== lastAssistantRef.current) {
      lastAssistantRef.current = last.text;
      const speechText = last.text
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
    <div style={{
      borderTop: '1px solid #e5e7eb',
      padding: '12px',
      background: '#fafafa',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Engine switch */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: '#f3f4f6',
        borderRadius: '8px',
        padding: '3px',
        marginBottom: '10px',
      }}>
        <button
          onClick={() => handleEngineChange("browser")}
          style={{
            flex: 1,
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            background: voiceEngine === "browser" ? 'white' : 'transparent',
            color: voiceEngine === "browser" ? '#FF8C42' : '#6b7280',
            boxShadow: voiceEngine === "browser" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: voiceEngine === "browser" ? 600 : 400,
            transition: 'all 0.2s',
          }}
        >
          🎤 浏览器语音
        </button>
        <button
          onClick={() => handleEngineChange("hume")}
          style={{
            flex: 1,
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            background: voiceEngine === "hume" ? 'white' : 'transparent',
            color: voiceEngine === "hume" ? '#FF8C42' : '#6b7280',
            boxShadow: voiceEngine === "hume" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: voiceEngine === "hume" ? 600 : 400,
            transition: 'all 0.2s',
          }}
        >
          🧠 Hume EVI
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        gap: '10px',
      }}>
        {voiceEngine === "browser" ? (
          browserVoice.supported ? (
            <>
              {/* Language switch */}
              <div style={{ display: 'flex', gap: '4px', padding: '3px', borderRadius: '8px', background: '#f3f4f6' }}>
                <button
                  onClick={() => setLanguage("zh-CN")}
                  style={{
                    border: language === "zh-CN" ? '1px solid #FF8C42' : '1px solid #e5e7eb',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    background: language === "zh-CN" ? 'rgba(255,140,66,0.08)' : 'white',
                    color: language === "zh-CN" ? '#FF8C42' : '#6b7280',
                    fontWeight: language === "zh-CN" ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  中文
                </button>
                <button
                  onClick={() => setLanguage("en-US")}
                  style={{
                    border: language === "en-US" ? '1px solid #FF8C42' : '1px solid #e5e7eb',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    background: language === "en-US" ? 'rgba(255,140,66,0.08)' : 'white',
                    color: language === "en-US" ? '#FF8C42' : '#6b7280',
                    fontWeight: language === "en-US" ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  English
                </button>
              </div>

              {/* Speech rate */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' }}>
                {speechRates.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    style={{
                      border: speechRate === rate ? '1px solid #FF8C42' : '1px solid #e5e7eb',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      background: speechRate === rate ? 'rgba(255,140,66,0.08)' : 'white',
                      color: speechRate === rate ? '#FF8C42' : '#6b7280',
                      fontWeight: speechRate === rate ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {rate}×
                  </button>
                ))}
              </div>

              {/* Mic button */}
              <button
                onClick={handleBrowserVoiceToggle}
                disabled={browserVoice.speaking || loading}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: `3px solid ${browserVoice.listening ? '#ef4444' : browserVoice.speaking ? '#22c55e' : '#e5e7eb'}`,
                  background: browserVoice.listening ? '#fef2f2' : browserVoice.speaking ? '#f0fdf4' : 'white',
                  fontSize: '28px',
                  cursor: browserVoice.speaking || loading ? 'not-allowed' : 'pointer',
                  opacity: browserVoice.speaking || loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: browserVoice.listening ? 'voice-pulse 1.5s infinite' : 'none',
                }}
              >
                {browserVoice.speaking ? "🔊" : browserVoice.listening ? "⏹️" : "🎤"}
              </button>

              {/* Status */}
              <div style={{ fontSize: '13px', textAlign: 'center' }}>
                {browserVoice.speaking && (
                  <span style={{ color: '#059669' }}>AI 正在说话...</span>
                )}
                {browserVoice.listening && (
                  <span style={{ color: '#FF8C42' }}>正在听你说话...</span>
                )}
                {!browserVoice.speaking && !browserVoice.listening && (
                  <span style={{ color: '#9ca3af' }}>点击麦克风开始</span>
                )}
              </div>

              {interimText && (
                <div style={{ width: '100%', fontSize: '13px', color: '#6b7280', textAlign: 'center', overflowWrap: 'anywhere' }}>
                  {interimText}
                </div>
              )}
              {browserVoice.error && (
                <div style={{ color: '#b91c1c', fontSize: '12px', textAlign: 'center' }}>
                  语音识别失败：{browserVoice.error}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#b91c1c', fontSize: '12px', textAlign: 'center' }}>
              当前浏览器不支持浏览器语音识别。
            </div>
          )
        ) : (
          <>
            <button
              onClick={handleHumeToggle}
              disabled={humeConnecting}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: `3px solid ${humeConnected ? '#ef4444' : '#e5e7eb'}`,
                background: humeConnected ? '#fef2f2' : 'white',
                fontSize: '28px',
                cursor: humeConnecting ? 'not-allowed' : 'pointer',
                opacity: humeConnecting ? 0.7 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: humeConnected ? 'voice-pulse 1.5s infinite' : 'none',
              }}
            >
              {humeConnecting ? "…" : humeConnected ? "⏹️" : "🎙️"}
            </button>

            <div style={{ fontSize: '13px', textAlign: 'center' }}>
              <span style={{ color: humeConnected ? '#FF8C42' : '#9ca3af' }}>
                {browserVoice.speaking ? "Panda Hug 正在回应..." : humeStatusText}
              </span>
            </div>

            {humeConnected && (
              <button
                onClick={isMuted ? unmute : mute}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  background: 'white',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {isMuted ? "打开麦克风" : "静音麦克风"}
              </button>
            )}

            {humeInterimText ? (
              <div style={{ width: '100%', fontSize: '13px', color: '#4f46e5', textAlign: 'center', overflowWrap: 'anywhere' }}>
                <strong>正在识别：</strong>{humeInterimText}
              </div>
            ) : lastUserMessage?.message?.content ? (
              <div style={{ width: '100%', fontSize: '13px', color: '#6b7280', textAlign: 'center', overflowWrap: 'anywhere' }}>
                <strong>你：</strong>{lastUserMessage.message.content}
              </div>
            ) : null}

            {topEmotions.length > 0 && (
              <div style={{
                width: '100%',
                maxWidth: '520px',
                padding: '10px',
                borderRadius: '10px',
                background: '#f5f3ff',
                color: '#6d28d9',
                fontSize: '12px',
                textAlign: 'center',
              }}>
                <span>声学情绪</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px', marginTop: '7px' }}>
                  {topEmotions.map(([name, score]) => (
                    <span key={name} style={{
                      padding: '3px 7px',
                      borderRadius: '999px',
                      background: 'white',
                      border: '1px solid #ddd6fe',
                    }}>
                      {formatEmotionName(name, isEnglish)} {Math.round(score * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {voiceRecordStatus === "processing" && (
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                Panda Hug 正在融合语音与声学情绪...
              </div>
            )}
            {voiceRecordStatus === "saved" && (
              <div style={{ color: '#059669', fontSize: '12px' }}>
                已由 Panda Hug 处理并写入成长记录
              </div>
            )}
            {voiceRecordStatus === "error" && (
              <div style={{ color: '#b91c1c', fontSize: '12px' }}>
                声学情绪记录失败
              </div>
            )}

            {(humeError || humeSdkError) && (
              <div style={{ color: '#b91c1c', fontSize: '12px', textAlign: 'center', overflowWrap: 'anywhere', padding: '8px', background: '#fef2f2', borderRadius: '8px' }}>
                <div>{humeError === 'Failed to fetch' ? 'Hume EVI 服务暂不可用（网络受限）' : humeError || humeSdkError?.message || humeSdkError?.reason || 'Hume EVI 连接失败'}</div>
                <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>请切换到「浏览器语音」使用语音功能</div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes voice-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }
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
