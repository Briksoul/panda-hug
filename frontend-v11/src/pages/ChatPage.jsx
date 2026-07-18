import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../hooks/useUser'
import { Send, ArrowLeft, Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export default function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mode, setMode] = useState(location.state?.mode || 'text')
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const greeting = getGreeting()
    setMessages([{
      role: 'panda',
      text: `小${user.name || '朋友'}，${greeting}，我是一直惦记你的 Panda 🐼 今天怎么样呀？`,
    }])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/pandahug/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id || 'anonymous',
          message: text.trim(),
          mode,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'panda', text: data.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'panda',
        text: '抱歉，我暂时无法回复你。请稍后再试。💙',
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const toggleCall = () => {
    setIsCallActive(!isCallActive)
    if (!isCallActive) setIsVideoOn(false)
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#FAFAF7' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={22} className="text-gray-500" />
        </button>
        <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full" style={{ width: 40, height: 40, objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(255,140,66,0.2)' }} />
        <div className="flex-1">
          <h2 className="font-bold text-sm">Panda 陪你倾诉</h2>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> 在线
          </p>
        </div>
        {mode === 'voice' && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="p-2 rounded-full transition"
              style={{ background: isVideoOn ? '#FF8C42' : '#f5f5f5', color: isVideoOn ? 'white' : '#999' }}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button
              onClick={toggleCall}
              className="p-2 rounded-full transition"
              style={{ background: isCallActive ? '#EF4444' : '#22C55E', color: 'white' }}
            >
              {isCallActive ? <PhoneOff size={18} /> : <Phone size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Call UI */}
      {isCallActive && (
        <div className="p-6 flex flex-col items-center" style={{ background: 'linear-gradient(180deg, #2D3436, #4a5568)' }}>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full" style={{ width: 80, height: 80, objectFit: 'cover' }} />
          </motion.div>
          <p className="text-white text-sm mt-3">通话中...</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'panda' && (
              <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'cover' }} />
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-panda'}>
              {msg.text}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
            <img src={`${import.meta.env.BASE_URL}panda-calm.jpg`} alt="Panda" className="rounded-full flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'cover' }} />
            <div className="chat-bubble-panda flex gap-1.5 py-4 px-5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2">
          {mode === 'voice' && (
            <button
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
              className="p-3 rounded-full transition-all"
              style={{
                background: isRecording ? '#EF4444' : '#f5f5f5',
                color: isRecording ? 'white' : '#999',
              }}
            >
              {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你想说的..."
            className="flex-1 py-3 px-5 rounded-full text-sm focus:outline-none"
            style={{ background: '#f5f3f0', border: '1px solid transparent', transition: 'all 0.3s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,140,66,0.3)'}
            onBlur={e => e.target.style.borderColor = 'transparent'}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="p-3 rounded-full transition"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #FF8C42, #FFB347)' : '#e0e0e0',
              color: 'white',
              boxShadow: input.trim() ? '0 4px 12px rgba(255,140,66,0.3)' : 'none',
            }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
