import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 纯浏览器语音 Hook — 零外部依赖
 * 使用 Web Speech API (STT + TTS) + 文本情绪分析
 */
export function useBrowserVoice() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [error, setError] = useState("")
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)
  const speechDoneRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SpeechRecognition)
    synthRef.current = window.speechSynthesis
  }, [])

  const startListening = useCallback((onResult, options = {}) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    setError("")
    const recognition = new SpeechRecognition()
    recognition.lang = options.language || 'zh-CN'
    recognition.continuous = false
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
      if (interimText && options.onInterim) {
        options.onInterim(interimText)
      }
      if (finalText && onResult) {
        const cleanText = finalText.trim()
        setTranscript(prev => [...prev.slice(-19), cleanText])
        onResult(cleanText)
      }
    }

    recognition.onerror = (e) => {
      console.error('[Voice] Recognition error:', e.error)
      if (e.error !== 'no-speech') setError(e.error)
      if (e.error !== 'no-speech') setListening(false)
    }

    recognition.onend = () => {
      recognitionRef.current = null
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

  const speak = useCallback((text, lang, rate = 1.15, onDone) => {
    if (!synthRef.current) return

    synthRef.current.cancel()
    speechDoneRef.current?.()
    speechDoneRef.current = onDone || null

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang || (/[\u4e00-\u9fff]/.test(text) ? 'zh-CN' : 'en-US')
    utterance.rate = Math.max(0.5, Math.min(2, Number(rate) || 1.15))
    utterance.pitch = 1.0

    const voices = synthRef.current.getVoices()
    const languageCode = utterance.lang.split('-')[0]
    const matchingVoices = voices.filter(v => v.lang.startsWith(languageCode))
    const preferredVoice = matchingVoices.find(v => (
      /premium|enhanced|natural|samantha|ting[- ]?ting|meijia/i.test(v.name)
    )) || matchingVoices.find(v => v.localService) || matchingVoices[0]
    if (preferredVoice) utterance.voice = preferredVoice

    const finish = () => {
      setSpeaking(false)
      const callback = speechDoneRef.current
      speechDoneRef.current = null
      callback?.()
    }
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = finish
    utterance.onerror = finish

    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel()
    setSpeaking(false)
    const callback = speechDoneRef.current
    speechDoneRef.current = null
    callback?.()
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      synthRef.current?.cancel()
    }
  }, [])

  return {
    supported,
    listening,
    speaking,
    error,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setTranscript,
  }
}
