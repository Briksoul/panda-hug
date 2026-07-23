import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceProvider, useVoice } from '@humeai/voice-react'
import { Mic, Square } from 'lucide-react'
import { useBrowserVoice } from '../hooks/useBrowserVoice'
import { getHumeAccessToken } from '../utils/api'

function VoicePanelContent({
  sessionId,
  onSendMessage,
  messages,
  loading,
  preferredLanguage = 'zh',
  humeInterimText,
  clearHumeInterim,
}) {
  const browserVoice = useBrowserVoice()
  const {
    connect,
    disconnect,
    mute,
    unmute,
    muteAudio,
    pauseAssistant,
    status,
    error: humeSdkError,
    lastUserMessage,
  } = useVoice()
  const [fallbackActive, setFallbackActive] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [statusText, setStatusText] = useState('')
  const lastAssistantRef = useRef('')
  const recordedVoiceMessageRef = useRef('')
  const humeConnected = status.value === 'connected'
  const humeConnecting = status.value === 'connecting'
  const language = preferredLanguage === 'en' ? 'en-US' : 'zh-CN'
  const isListening = humeConnected || humeConnecting || browserVoice.listening

  const startBrowserFallback = useCallback(() => {
    if (!browserVoice.supported) {
      setStatusText(
        preferredLanguage === 'en'
          ? 'Voice recognition is not supported in this browser.'
          : '当前浏览器不支持语音识别。',
      )
      return
    }
    setFallbackActive(true)
    setStatusText(
      preferredLanguage === 'en'
        ? 'Listening...'
        : '正在听你说话...',
    )
    browserVoice.startListening((text) => {
      if (text.trim() && !loading) {
        onSendMessage(text.trim(), { source: 'voice' })
        setInterimText('')
      }
    }, {
      language,
      onInterim: setInterimText,
    })
  }, [browserVoice, language, loading, onSendMessage, preferredLanguage])

  useEffect(() => {
    const content = lastUserMessage?.message?.content?.trim()
    if (!sessionId || !content || lastUserMessage?.interim || loading) return
    const key = [
      lastUserMessage.time?.begin,
      lastUserMessage.time?.end,
      content,
    ].join(':')
    if (recordedVoiceMessageRef.current === key) return
    recordedVoiceMessageRef.current = key
    mute()
    Promise.resolve(onSendMessage(content, {
      source: 'voice',
      voiceAnalysis: {
        transcript: content,
        emotion_scores: lastUserMessage.models?.prosody?.scores || {},
      },
    })).catch(() => unmute())
  }, [lastUserMessage, loading, mute, onSendMessage, sessionId, unmute])

  useEffect(() => {
    if (!messages.length || loading) return
    const last = messages[messages.length - 1]
    if (last.role !== 'panda' || last.text === lastAssistantRef.current) return
    lastAssistantRef.current = last.text
    const speechText = last.text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*#>`_]/g, '')
      .trim()
    if (!speechText) return
    if (humeConnected) mute()
    browserVoice.speak(
      speechText,
      undefined,
      1,
      humeConnected ? unmute : undefined,
    )
  }, [browserVoice, humeConnected, loading, messages, mute, unmute])

  useEffect(() => {
    if (!humeSdkError || fallbackActive || browserVoice.listening) return
    void disconnect()
    clearHumeInterim()
    startBrowserFallback()
  }, [
    browserVoice.listening,
    clearHumeInterim,
    disconnect,
    fallbackActive,
    humeSdkError,
    startBrowserFallback,
  ])

  const stopListening = async () => {
    browserVoice.stopListening()
    setInterimText('')
    clearHumeInterim()
    if (humeConnected || humeConnecting) await disconnect()
    setFallbackActive(false)
    setStatusText('')
  }

  const toggleListening = async () => {
    if (isListening) {
      await stopListening()
      return
    }
    setStatusText(
      preferredLanguage === 'en' ? 'Connecting...' : '正在连接语音...',
    )
    try {
      recordedVoiceMessageRef.current = ''
      muteAudio()
      const token = await getHumeAccessToken()
      const options = {
        auth: {
          type: 'accessToken',
          value: token.access_token,
        },
        verboseTranscription: true,
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      }
      if (token.config_id) options.configId = token.config_id
      await connect(options)
      pauseAssistant()
      muteAudio()
      setFallbackActive(false)
      setStatusText(
        preferredLanguage === 'en' ? 'Listening...' : '正在听你说话...',
      )
    } catch {
      startBrowserFallback()
    }
  }

  const transcript = humeInterimText || interimText

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={toggleListening}
          disabled={loading || browserVoice.speaking}
          className={`flex h-16 w-16 items-center justify-center rounded-full border-4 transition ${
            isListening
              ? 'border-green-500 bg-green-50 text-green-600'
              : 'border-gray-200 bg-white text-panda-primary'
          } disabled:opacity-50`}
          aria-label={isListening ? '停止语音输入' : '开始语音输入'}
        >
          {isListening ? <Square size={24} fill="currentColor" /> : <Mic size={28} />}
        </button>
        <p className="text-center text-sm text-gray-500">
          {browserVoice.speaking
            ? (preferredLanguage === 'en' ? 'Panda is responding...' : 'Panda 正在回应...')
            : statusText || (preferredLanguage === 'en' ? 'Tap the microphone to start' : '点击麦克风开始')}
        </p>
        {transcript && (
          <p className="w-full break-words rounded-xl bg-gray-50 px-3 py-2 text-center text-sm text-gray-600">
            {transcript}
          </p>
        )}
        {browserVoice.error && (
          <p className="text-center text-xs text-red-600">
            {preferredLanguage === 'en' ? 'Voice recognition failed.' : '语音识别失败，请重试。'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function VoicePanel(props) {
  const [humeInterimText, setHumeInterimText] = useState('')
  const clearHumeInterim = useCallback(() => setHumeInterimText(''), [])
  const handleHumeMessage = useCallback((message) => {
    if (message?.type !== 'user_message') return
    const content = message.message?.content?.trim() || ''
    setHumeInterimText(message.interim ? content : '')
  }, [])

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
  )
}
