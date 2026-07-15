import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PandaFace } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'
import { Send, ArrowLeft, Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react'

const INITIAL_MESSAGES = [
  { role: 'panda', text: '小{name}，{greeting}，我是一直惦记你的 Panda。今天怎么样呀？' },
]

const MOCK_RESPONSES = [
  '我能感受到你现在的心情。能告诉我，是什么事情让你有这样的感受吗？',
  '谢谢你愿意和我分享这些。这种情况持续多久了？',
  '我理解你的感受。在异国他乡面对这些确实不容易。你觉得最困扰你的是什么？',
  '你说得很对，这些感受都是正常的。让我们一起想想，有什么可以帮助你的？',
  '我很高兴你能和我聊这些。记住，你不是一个人在面对这些。',
  '这些经历听起来确实很有挑战性。你觉得在这些困难中，你学到了什么？',
  '我注意到你提到了一些很重要的点。让我们深入聊聊其中一个方面。',
  '你的感受很重要。我在这里陪你，我们可以慢慢聊。',
]

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
  const inputRef = useRef(null)

  useEffect(() => {
    const greeting = getGreeting()
    const initMsgs = INITIAL_MESSAGES.map(m => ({
      ...m,
      text: m.text.replace('{name}', user.name || '朋友').replace('{greeting}', greeting),
    }))
    setMessages(initMsgs)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
      setMessages(prev => [...prev, { role: 'panda', text: response }])
      setIsTyping(false)
    }, 1000 + Math.random() * 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const toggleCall = () => {
    setIsCallActive(!isCallActive)
    if (!isCallActive) {
      setIsVideoOn(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-panda-bg">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <PandaFace mood="happy" size={36} />
        <div className="flex-1">
          <h2 className="font-bold text-sm">Panda 陪你倾诉</h2>
          <p className="text-xs text-green-500">在线</p>
        </div>
        {mode === 'voice' && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-2 rounded-full ${isVideoOn ? 'bg-panda-primary text-white' : 'bg-gray-100'}`}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button
              onClick={toggleCall}
              className={`p-2 rounded-full ${isCallActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
            >
              {isCallActive ? <PhoneOff size={18} /> : <Phone size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Call UI */}
      {isCallActive && (
        <div className="bg-gradient-to-b from-panda-dark to-gray-800 p-6 flex flex-col items-center">
          <PandaFace mood="happy" size={80} className="mb-3 animate-pulse-soft" />
          <p className="text-white text-sm mb-2">通话中...</p>
          {isVideoOn && (
            <div className="w-24 h-32 bg-gray-700 rounded-xl absolute bottom-32 right-4 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-white text-xs">摄像头</div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'panda' && (
              <PandaFace mood="happy" size={32} className="mr-2 mt-1 flex-shrink-0" />
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-panda'}>
              {msg.text}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start"
          >
            <PandaFace mood="thinking" size={32} className="mr-2 mt-1" />
            <div className="chat-bubble-panda">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {mode === 'voice' && (
            <button
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
              className={`p-3 rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100'}`}
            >
              {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你想说的..."
            className="flex-1 py-3 px-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-panda-primary/30 text-sm"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="p-3 rounded-full bg-panda-primary text-white disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
