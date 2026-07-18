import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PandaFace, BearMood } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'
import { Sun, Cloud, CloudRain, CloudLightning, Phone, MessageCircle } from 'lucide-react'

const EMOTIONS = [
  { id: 'energetic', label: '充满活力', emoji: '☀️', color: 'from-yellow-400 to-orange-400', bg: '#FFF3E0', type: 'positive' },
  { id: 'ok', label: '状态不错', emoji: '🌤', color: 'from-blue-300 to-cyan-400', bg: '#E3F2FD', type: 'positive' },
  { id: 'tired', label: '略显疲惫', emoji: '☁️', color: 'from-gray-400 to-slate-500', bg: '#F5F5F5', type: 'negative' },
  { id: 'anxious', label: '感到焦虑', emoji: '🌧', color: 'from-purple-400 to-indigo-400', bg: '#F3E5F5', type: 'negative' },
  { id: 'depressed', label: '心情低落', emoji: '⛈', color: 'from-gray-600 to-gray-800', bg: '#ECEFF1', type: 'negative' },
]

const PHQ2 = [
  { q: '在过去两周里，你是否经常感到做事没有兴趣或乐趣？', en: 'Little interest or pleasure in doing things?' },
  { q: '在过去两周里，你是否经常感到心情低落、沮丧或绝望？', en: 'Feeling down, depressed, or hopeless?' },
]

const GAD2 = [
  { q: '在过去两周里，你是否经常感到紧张、焦虑或烦躁？', en: 'Feeling nervous, anxious, or on edge?' },
  { q: '在过去两周里，你是否经常无法停止或控制担忧？', en: 'Not being able to stop or control worrying?' },
]

const OPTIONS = [
  { label: '完全没有', en: 'Not at all', score: 0 },
  { label: '几天', en: 'Several days', score: 1 },
  { label: '一半以上天数', en: 'More than half the days', score: 2 },
  { label: '几乎每天', en: 'Nearly every day', score: 3 },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function getBearMood(phq2Total, gad2Total) {
  const maxScore = Math.max(phq2Total, gad2Total)
  if (maxScore <= 1) return { mood: 'happy', text: '当前未发现明显心理情绪风险 🎉', level: 0 }
  if (maxScore <= 3) return { mood: 'calm', text: '存在轻度心理情绪困扰', level: 1 }
  return { mood: 'tired', text: '心理情绪风险较高', level: 2 }
}

export default function EmotionPage() {
  const navigate = useNavigate()
  const { user, addEmotionRecord } = useUser()
  const [phase, setPhase] = useState('select')
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [answers, setAnswers] = useState({})
  const [bearResult, setBearResult] = useState(null)

  const allQuestions = useMemo(() => [...PHQ2, ...GAD2].map((q, i) => ({ ...q, id: i })), [])

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion)
    if (emotion.type === 'positive') {
      addEmotionRecord({ emotion: emotion.id, bearMood: 'happy', phq2: 0, gad2: 0 })
      setPhase('result')
      setBearResult({ mood: 'happy', text: '你今天状态不错！保持这份好心情 🌟', level: 0 })
    } else {
      setPhase('assess')
    }
  }

  const handleAssessComplete = () => {
    const phq2Total = (answers[0] || 0) + (answers[1] || 0)
    const gad2Total = (answers[2] || 0) + (answers[3] || 0)
    const result = getBearMood(phq2Total, gad2Total)
    setBearResult(result)
    addEmotionRecord({ emotion: selectedEmotion.id, bearMood: result.mood, phq2: phq2Total, gad2: gad2Total })
    setPhase('result')
  }

  const allAnswered = allQuestions.every(q => answers[q.id] !== undefined)

  return (
    <div className="h-full flex flex-col pb-20 overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full" style={{ width: 52, height: 52, objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(255,140,66,0.2)' }} />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold">{getGreeting()}，{user.name || '朋友'} 👋</h1>
            <p className="text-sm text-gray-500">你现在感觉怎么样？</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 px-6 space-y-3"
          >
            {EMOTIONS.map((emotion, i) => (
              <motion.button
                key={emotion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEmotionSelect(emotion)}
                className="w-full p-4 rounded-2xl text-left font-medium text-base flex items-center gap-4 shadow-sm transition-all"
                style={{
                  background: emotion.bg,
                  border: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <span className="text-2xl">{emotion.emoji}</span>
                <span className="text-gray-700">{emotion.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {phase === 'assess' && (
          <motion.div
            key="assess"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 px-6"
          >
            <div className="card mb-4">
              <p className="text-sm text-gray-500 mb-2">为了更好地了解您的情绪状况，我们来做一个简短的情绪小测试。</p>
              <div className="progress-bar mt-2">
                <div className="progress-bar-fill" style={{ width: `${Object.keys(answers).length / 4 * 100}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">{Object.keys(answers).length}/4 已完成</p>
            </div>

            <div className="space-y-4">
              {allQuestions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="card"
                >
                  <p className="font-medium text-sm mb-1">{q.q}</p>
                  <p className="text-xs text-gray-400 mb-3">{q.en}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OPTIONS.map(opt => (
                      <button
                        key={opt.score}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                        className="p-2.5 rounded-xl text-sm border-2 transition-all"
                        style={{
                          borderColor: answers[q.id] === opt.score ? '#FF8C42' : '#f0ebe5',
                          background: answers[q.id] === opt.score ? 'rgba(255,140,66,0.08)' : 'white',
                          color: answers[q.id] === opt.score ? '#FF8C42' : '#666',
                          fontWeight: answers[q.id] === opt.score ? 600 : 400,
                        }}
                      >
                        <div>{opt.label}</div>
                        <div className="text-xs opacity-50 mt-0.5">{opt.en}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={handleAssessComplete}
              disabled={!allAnswered}
              className="btn-primary w-full mt-6 mb-4"
              style={{ opacity: allAnswered ? 1 : 0.5 }}
            >
              查看结果
            </button>
          </motion.div>
        )}

        {phase === 'result' && bearResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 px-6 flex flex-col items-center pt-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-6"
            >
              <BearMood mood={bearResult.mood} size={140} />
            </motion.div>

            <div className="card text-center mb-6 w-full">
              <p className="text-gray-600 text-sm leading-relaxed">{bearResult.text}</p>
            </div>

            <div className="card w-full mb-6 text-center">
              <img
                src={bearResult.mood === 'happy' ? `${import.meta.env.BASE_URL}panda-happy.jpg` : bearResult.mood === 'calm' ? `${import.meta.env.BASE_URL}panda-calm.jpg` : `${import.meta.env.BASE_URL}panda-tired.jpg`}
                alt="Panda"
                className="rounded-full mx-auto mb-3"
                style={{ width: 64, height: 64, objectFit: 'cover' }}
              />
              <p className="text-gray-700 text-sm leading-relaxed">
                进一步和我聊聊吗？<br/>
                我可以陪你一起梳理困扰、理解情绪，<br/>
                并为你生成专属的心理情绪洞察报告。
              </p>
            </div>

            <div className="flex gap-3 w-full mb-4">
              <button
                onClick={() => navigate('/chat', { state: { mode: 'voice' } })}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Phone size={18} /> 语音倾诉
              </button>
              <button
                onClick={() => navigate('/chat', { state: { mode: 'text' } })}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> 文字倾诉
              </button>
            </div>

            <button onClick={() => setPhase('select')} className="text-gray-400 text-sm mt-2">
              返回重新选择
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
