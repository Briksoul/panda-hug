import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUser } from '../hooks/useUser'
import { ArrowLeft, Send } from 'lucide-react'
import VoicePanel from '../components/VoicePanel'
import {
  createSession,
  sendMessage,
} from '../utils/api'

export default function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const isEnglish = user.language === 'en'
  const mode = location.state?.mode || 'text'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const initSession = async () => {
      try {
        const data = await createSession(
          user.name || user.username,
          user.cultureTag || 'unknown',
          user.language || 'zh',
          user.studyAbroadMonths || 0,
        )
        setSessionId(data.session_id)
        localStorage.setItem('panda_session_id', data.session_id)
        setMessages([{
          role: 'panda',
          text: isEnglish
            ? 'I’m here. What would you like to talk about?'
            : '我在这里。你想从哪里开始聊起？',
        }])
      } catch (err) {
        console.error('Failed to create session:', err)
        localStorage.removeItem('panda_session_id')
        setMessages([{
          role: 'panda',
          text: isEnglish
            ? 'Unable to restore the session right now. Please try again later. 💙'
            : '暂时无法恢复会话，请稍后再试。💙',
        }])
      }
    }
    initSession()
  }, [user.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessageToBackend = useCallback(async (text, options = {}) => {
    if (!text.trim() || !sessionId) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    if (!options.silent) setInput('')
    setIsTyping(true)

    try {
      const data = await sendMessage(
        sessionId,
        text.trim(),
        options.source || 'text',
        options.voiceAnalysis || null,
      )
      setMessages(prev => [...prev, {
        role: 'panda',
        text: data.content || data.response || data.message || '...',
        suggestions: data.suggestions || [],
        isCrisis: data.emotion_level === 'crisis',
      }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'panda',
        text: isEnglish
          ? 'Sorry, I can’t reply right now. Please try again later. 💙'
          : '抱歉，我暂时无法回复你。请稍后再试。💙',
      }])
    } finally {
      setIsTyping(false)
    }
  }, [sessionId, isEnglish])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessageToBackend(input)
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#FAFAF7' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={22} className="text-gray-500" />
        </button>
        <img src={`${import.meta.env.BASE_URL}panda-icon.svg`} alt="Panda" className="rounded-full" style={{ width: 40, height: 40, objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(255,140,66,0.2)' }} />
        <div className="flex-1">
          <h2 className="font-bold text-sm">
            {isEnglish ? 'Talk with Panda' : 'Panda 陪你倾诉'}
          </h2>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            {isEnglish ? 'Online' : '在线'}
          </p>
        </div>
      </div>

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
              <img src={`${import.meta.env.BASE_URL}panda-icon.svg`} alt="Panda" className="rounded-full flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'cover' }} />
            )}
            <div className={msg.role === 'user' ? '' : 'min-w-0 max-w-[82%] sm:max-w-[75%]'}>
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-panda'}>
                {msg.text}
              </div>
              {msg.suggestions?.length > 0 && (
                <div className={`mt-2 flex flex-wrap gap-2 rounded-xl p-2 ${msg.isCrisis ? 'bg-red-50' : 'bg-white'}`}>
                  {msg.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        if (
                          suggestion.includes('洞察报告')
                          || suggestion.toLowerCase().includes('insight report')
                        ) {
                          navigate('/report')
                        } else {
                          sendMessageToBackend(suggestion)
                        }
                      }}
                      className={`rounded-full border px-3 py-2 text-xs ${
                        msg.isCrisis
                          ? 'border-red-200 text-red-700'
                          : 'border-orange-200 text-panda-primary'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
            <img src={`${import.meta.env.BASE_URL}panda-icon.svg`} alt="Panda" className="rounded-full flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'cover' }} />
            <div className="chat-bubble-panda flex gap-1.5 py-4 px-5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {mode === 'voice' && (
        <VoicePanel
          sessionId={sessionId}
          onSendMessage={sendMessageToBackend}
          messages={messages}
          loading={isTyping}
          preferredLanguage={user.language || 'zh'}
        />
      )}

      {mode === 'text' && <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEnglish ? 'Type what you want to say...' : '输入你想说的...'}
            className="flex-1 py-3 px-5 rounded-full text-sm focus:outline-none"
            style={{ background: '#f5f3f0', border: '1px solid transparent', transition: 'all 0.3s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,140,66,0.3)'}
            onBlur={e => e.target.style.borderColor = 'transparent'}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessageToBackend(input)}
            disabled={!input.trim() || !sessionId || isTyping}
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
      </div>}
    </div>
  )
}
