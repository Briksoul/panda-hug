import { useState } from 'react'
import { useVoice } from '../hooks/useVoice'

/**
 * 语音对话组件
 * 
 * Props:
 *  - sessionId: 会话 ID
 *  - onTranscript: 转录回调 (role, text) => void
 */
export default function VoiceChat({ sessionId, onTranscript }) {
  const { connected, speaking, emotions, transcript, startVoice, stopVoice } = useVoice(sessionId)
  const [mode, setMode] = useState('idle') // idle | voice

  const handleToggle = () => {
    if (mode === 'idle') {
      startVoice()
      setMode('voice')
    } else {
      stopVoice()
      setMode('idle')
    }
  }

  // 取 top 3 情绪
  const topEmotions = Object.entries(emotions).slice(0, 3)

  return (
    <div className="voice-chat">
      {/* 语音按钮 */}
      <button
        onClick={handleToggle}
        className={`voice-btn ${mode === 'voice' ? 'active' : ''}`}
        title={mode === 'idle' ? '开始语音对话' : '结束语音对话'}
      >
        {mode === 'idle' ? '🎤' : '🔴'}
      </button>

      {/* 连接状态 */}
      {mode === 'voice' && (
        <div className="voice-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span>{connected ? (speaking ? 'AI 正在说话...' : '正在听...') : '连接中...'}</span>
        </div>
      )}

      {/* 情绪指示器 */}
      {topEmotions.length > 0 && mode === 'voice' && (
        <div className="emotion-bar">
          {topEmotions.map(([emotion, score]) => (
            <div key={emotion} className="emotion-item">
              <span className="emotion-name">{emotion}</span>
              <div className="emotion-bar-bg">
                <div
                  className="emotion-bar-fill"
                  style={{ width: `${Math.round(score * 100)}%` }}
                />
              </div>
              <span className="emotion-score">{(score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* 最近转录 */}
      {transcript.length > 0 && mode === 'voice' && (
        <div className="transcript-preview">
          {transcript.slice(-3).map((t, i) => (
            <div key={i} className={`transcript-line ${t.role}`}>
              <strong>{t.role === 'user' ? '你' : '咨询师'}:</strong> {t.text}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .voice-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px;
        }
        .voice-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid #e0e0e0;
          background: white;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .voice-btn:hover { border-color: #6366f1; }
        .voice-btn.active {
          border-color: #ef4444;
          background: #fef2f2;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        .voice-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #666;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.connected { background: #22c55e; }
        .status-dot.disconnected { background: #ef4444; }
        .emotion-bar {
          width: 100%;
          max-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .emotion-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .emotion-name { width: 60px; text-align: right; color: #666; }
        .emotion-bar-bg {
          flex: 1;
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
        }
        .emotion-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 3px;
          transition: width 0.3s;
        }
        .emotion-score { width: 35px; color: #999; }
        .transcript-preview {
          width: 100%;
          max-width: 320px;
          font-size: 13px;
          color: #444;
        }
        .transcript-line { padding: 2px 0; }
        .transcript-line.user { color: #6366f1; }
        .transcript-line.assistant { color: #059669; }
      `}</style>
    </div>
  )
}
