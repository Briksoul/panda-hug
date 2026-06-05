import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 纯浏览器语音 Hook — 零外部依赖
 * 使用 Web Speech API (STT + TTS) + 文本情绪分析
 */
export function useBrowserVoice(sessionId) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const [transcript, setTranscript] = useState([])
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SpeechRecognition)
    synthRef.current = window.speechSynthesis
  }, [])

  const startListening = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += text
        } else {
          interimText += text
        }
      }
      if (finalText && onResult) {
        onResult(finalText, false)
      }
    }

    recognition.onerror = (e) => {
      console.error('[Voice] Recognition error:', e.error)
      if (e.error !== 'no-speech') setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  const speak = useCallback((text, lang = 'zh-CN') => {
    if (!synthRef.current) return

    // 停止当前播放
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.pitch = 1.0

    // 选择中文女声（如果可用）
    const voices = synthRef.current.getVoices()
    const zhVoice = voices.find(v => v.lang.startsWith('zh') && v.name.includes('Female'))
      || voices.find(v => v.lang.startsWith('zh'))
    if (zhVoice) utterance.voice = zhVoice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel()
    setSpeaking(false)
  }, [])

  return {
    supported,
    listening,
    speaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setTranscript,
  }
}
