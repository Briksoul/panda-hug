import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { useBrowserVoice } from '../hooks/useBrowserVoice'
import { analyzeTextEmotion, recordTextEmotionAnalysis } from '../utils/api'

export default function VoicePanel({
  sessionId,
  onSendMessage,
  messages,
  loading,
  preferredLanguage = 'zh',
}) {
  const browserVoice = useBrowserVoice()
  const [interimText, setInterimText] = useState('')
  const [statusText, setStatusText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const lastAssistantRef = useRef('')
  const language = preferredLanguage === 'en' ? 'en-US' : 'zh-CN'
  const isEnglish = preferredLanguage === 'en'

  const analyzeAndSend = useCallback(async (text) => {
    const transcript = text.trim()
    if (!transcript || loading || !sessionId) return

    setInterimText('')
    setAnalyzing(true)
    setStatusText(
      isEnglish
        ? 'Understanding and responding...'
        : '正在理解并回复...',
    )

    const history = messages
      .slice(-6)
      .map((message) => `${message.role === 'panda' ? 'Panda' : 'User'}: ${message.text}`)
    const analysisTask = analyzeTextEmotion(transcript, history)
      .then((analysis) => {
        if (!Object.keys(analysis.emotions || {}).length) return null
        return recordTextEmotionAnalysis(
          sessionId,
          transcript,
          analysis.emotions,
        )
      })
      .catch((error) => {
        console.warn('[Voice] Text emotion analysis unavailable:', error)
        return null
      })
    void analysisTask

    try {
      await onSendMessage(transcript, { source: 'voice' })
    } finally {
      setAnalyzing(false)
      setStatusText('')
    }
  }, [isEnglish, loading, messages, onSendMessage, sessionId])

  const startListening = useCallback(() => {
    if (!browserVoice.supported) {
      setStatusText(
        isEnglish
          ? 'Voice recognition is not supported in this browser.'
          : '当前浏览器不支持语音识别。',
      )
      return
    }

    setStatusText(isEnglish ? 'Listening...' : '正在听你说话...')
    browserVoice.startListening(analyzeAndSend, {
      language,
      onInterim: setInterimText,
    })
  }, [analyzeAndSend, browserVoice, isEnglish, language])

  const stopListening = useCallback(() => {
    browserVoice.stopListening()
    setInterimText('')
    setStatusText('')
  }, [browserVoice])

  const toggleListening = () => {
    if (browserVoice.listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  useEffect(() => {
    if (!messages.length || loading) return
    const last = messages[messages.length - 1]
    if (last.role !== 'panda' || last.text === lastAssistantRef.current) return
    lastAssistantRef.current = last.text
    const speechText = last.text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*#>`_]/g, '')
      .trim()
    if (speechText) browserVoice.speak(speechText, language, 0.92)
  }, [browserVoice, language, loading, messages])

  useEffect(() => {
    if (!browserVoice.listening && !analyzing && !loading) {
      setStatusText((current) => (
        current === '正在听你说话...' || current === 'Listening...'
          ? ''
          : current
      ))
    }
  }, [analyzing, browserVoice.listening, loading])

  const busy = analyzing || loading
  const active = browserVoice.listening

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={toggleListening}
          disabled={busy || browserVoice.speaking}
          className={`flex h-16 w-16 items-center justify-center rounded-full border-4 transition ${
            active
              ? 'border-green-500 bg-green-50 text-green-600'
              : 'border-gray-200 bg-white text-panda-primary'
          } disabled:opacity-50`}
          aria-label={active ? '停止语音输入' : '开始语音输入'}
        >
          {active ? <Square size={24} fill="currentColor" /> : <Mic size={28} />}
        </button>
        <p className="text-center text-sm text-gray-500">
          {browserVoice.speaking
            ? (isEnglish ? 'Panda is responding...' : 'Panda 正在回应...')
            : statusText || (isEnglish ? 'Tap the microphone to start' : '点击麦克风开始')}
        </p>
        {interimText && (
          <p className="w-full break-words rounded-xl bg-gray-50 px-3 py-2 text-center text-sm text-gray-600">
            {interimText}
          </p>
        )}
        {browserVoice.error && (
          <p className="text-center text-xs text-red-600">
            {isEnglish ? 'Voice recognition failed.' : '语音识别失败，请重试。'}
          </p>
        )}
      </div>
    </div>
  )
}
