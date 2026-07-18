import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hume EVI 语音 WebSocket Hook
 *
 * 返回:
 *  - connected: WebSocket 是否已连接
 *  - speaking: AI 是否在说话
 *  - emotions: 当前检测到的情绪分数
 *  - transcript: 最近的转录文本
 *  - startVoice(): 开始语音对话
 *  - stopVoice(): 结束语音对话
 *  - sendText(text): 发送文本消息（备用）
 */
export function useVoice(sessionId) {
  const wsRef = useRef(null)
  const audioCtxRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const processorRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [emotions, setEmotions] = useState({})
  const [transcript, setTranscript] = useState([])

  const startVoice = useCallback(async () => {
    if (wsRef.current) return

    // 连接 WebSocket
    const wsUrl = `ws://${window.location.hostname}:8000/api/ws/voice/${sessionId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('[Voice] Connected')
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      switch (msg.type) {
        case 'audio':
          playAudio(msg.data)
          setSpeaking(true)
          break

        case 'transcript':
          setTranscript(prev => [...prev.slice(-20), { role: msg.role, text: msg.text }])
          if (msg.role === 'assistant') setSpeaking(false)
          break

        case 'emotion':
          setEmotions(msg.scores)
          break

        case 'error':
          console.error('[Voice] Error:', msg.message)
          break

        default:
          break
      }
    }

    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      console.log('[Voice] Disconnected')
    }

    ws.onerror = (err) => {
      console.error('[Voice] WebSocket error:', err)
    }

    // 开始录音
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const audioCtx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return
        const float32 = e.inputBuffer.getChannelData(0)
        // Float32 → Int16 PCM
        const int16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
        }
        // 发送 base64 编码的 PCM
        const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)))
        ws.send(JSON.stringify({ type: 'audio', data: base64 }))
      }

      source.connect(processor)
      processor.connect(audioCtx.destination)
    } catch (err) {
      console.error('[Voice] Microphone error:', err)
    }
  }, [sessionId])

  const stopVoice = useCallback(() => {
    // 停止录音
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
    // 关闭 WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
    setSpeaking(false)
  }, [])

  const sendText = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text }))
    }
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => stopVoice()
  }, [stopVoice])

  return { connected, speaking, emotions, transcript, startVoice, stopVoice, sendText }
}

/**
 * 播放 base64 编码的音频
 */
function playAudio(base64Data) {
  const audio = new Audio(`data:audio/wav;base64,${base64Data}`)
  audio.play().catch(err => console.error('[Voice] Playback error:', err))
}
