import { useState, useRef, useEffect } from 'react'
import { useBrowserVoice } from '../hooks/useBrowserVoice'

/**
 * 纯浏览器语音面板 — 替代 Hume EVI
 * 
 * Props:
 *  - onSendMessage: 发送文本消息回调 (text) => void
 *  - messages: 对话消息列表
 */
export default function VoicePanel({ onSendMessage, messages }) {
  const {
    supported, listening, speaking,
    startListening, stopListening, speak, stopSpeaking
  } = useBrowserVoice()
  const [mode, setMode] = useState('text') // text | voice
  const [interimText, setInterimText] = useState('')
  const lastAssistantRef = useRef('')

  // 自动朗读 AI 回复
  useEffect(() => {
    if (mode !== 'voice' || !messages.length) return
    const last = messages[messages.length - 1]
    if (last.role === 'assistant' && last.content !== lastAssistantRef.current) {
      lastAssistantRef.current = last.content
      speak(last.content)
    }
  }, [messages, mode, speak])

  const handleVoiceToggle = () => {
    if (listening) {
      stopListening()
    } else {
      setInterimText('')
      startListening((text, isFinal) => {
        if (text.trim()) {
          onSendMessage(text.trim())
          setInterimText('')
        }
      })
    }
  }

  const handleModeSwitch = () => {
    if (mode === 'voice') {
      stopListening()
      stopSpeaking()
      setMode('text')
    } else {
      setMode('voice')
    }
  }

  if (!supported) {
    return (
      <div className="voice-panel-unsupported">
        ⚠️ 浏览器不支持语音功能，请使用 Chrome 或 Edge
      </div>
    )
  }

  return (
    <div className="voice-panel">
      {/* 模式切换 */}
      <div className="mode-switch">
        <button
          className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
          onClick={() => { setMode('text'); stopListening(); stopSpeaking() }}
        >
          ⌨️ 文字
        </button>
        <button
          className={`mode-btn ${mode === 'voice' ? 'active' : ''}`}
          onClick={handleModeSwitch}
        >
          🎤 语音
        </button>
      </div>

      {/* 语音模式控制 */}
      {mode === 'voice' && (
        <div className="voice-controls">
          <button
            className={`mic-btn ${listening ? 'recording' : ''} ${speaking ? 'ai-speaking' : ''}`}
            onClick={handleVoiceToggle}
            disabled={speaking}
          >
            {speaking ? '🔊' : listening ? '⏹️' : '🎤'}
          </button>

          <div className="voice-status">
            {speaking && <span className="status-text ai">AI 正在说话...</span>}
            {listening && <span className="status-text user">正在听你说话...</span>}
            {!speaking && !listening && <span className="status-text idle">点击麦克风开始</span>}
          </div>

          {interimText && (
            <div className="interim-text">{interimText}</div>
          )}

          {speaking && (
            <button className="stop-btn" onClick={stopSpeaking}>
              停止播放
            </button>
          )}
        </div>
      )}

      <style>{`
        .voice-panel {
          border-top: 1px solid #e5e7eb;
          padding: 12px;
          background: #fafafa;
        }
        .voice-panel-unsupported {
          padding: 12px;
          text-align: center;
          color: #92400e;
          background: #fef3c7;
          border-radius: 8px;
          font-size: 13px;
        }
        .mode-switch {
          display: flex;
          gap: 4px;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 3px;
          margin-bottom: 12px;
        }
        .mode-btn {
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
        .mode-btn.active {
          background: white;
          color: #111;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .voice-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
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
          animation: pulse 1.5s infinite;
        }
        .mic-btn.ai-speaking {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .mic-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }
        .voice-status { font-size: 13px; }
        .status-text.ai { color: #059669; }
        .status-text.user { color: #6366f1; }
        .status-text.idle { color: #9ca3af; }
        .interim-text {
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
          max-width: 280px;
          text-align: center;
        }
        .stop-btn {
          padding: 4px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          color: #ef4444;
        }
      `}</style>
    </div>
  )
}
