import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BearMood } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'
import { LogOut, MessageCircle, Mic } from 'lucide-react'
import { getAssessmentStatus, saveAssessment } from '../utils/api'

const EMOTIONS = [
  { id: 'energetic', label: '充满活力', en: 'Energetic', emoji: '☀️', color: 'from-yellow-400 to-orange-400', bg: '#FFF3E0', type: 'positive' },
  { id: 'ok', label: '还可以', en: 'Doing okay', emoji: '🌤', color: 'from-blue-300 to-cyan-400', bg: '#E3F2FD', type: 'positive' },
  { id: 'tired', label: '略显疲惫', en: 'A little tired', emoji: '☁️', color: 'from-gray-400 to-slate-500', bg: '#F5F5F5', type: 'negative' },
  { id: 'anxious', label: '感到焦虑', en: 'Anxious', emoji: '🌧', color: 'from-purple-400 to-indigo-400', bg: '#F3E5F5', type: 'negative' },
  { id: 'depressed', label: '感到低落', en: 'Feeling low', emoji: '⛈', color: 'from-gray-600 to-gray-800', bg: '#ECEFF1', type: 'negative' },
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

function getBearMood(phq2Total, gad2Total, isEnglish) {
  const maxScore = Math.max(phq2Total, gad2Total)
  if (maxScore <= 1) {
    return {
      mood: 'happy',
      text: isEnglish ? 'No significant emotional health risk detected at this time 🎉' : '当前未发现明显心理情绪风险 🎉',
      level: 0,
    }
  }
  if (maxScore <= 3) {
    return {
      mood: 'calm',
      text: isEnglish ? 'You may be experiencing mild emotional distress.' : '存在轻度心理情绪困扰',
      level: 1,
    }
  }
  return {
    mood: 'tired',
    text: isEnglish ? 'Your emotional health risk may be elevated.' : '心理情绪风险较高',
    level: 2,
  }
}

export default function EmotionPage() {
  const navigate = useNavigate()
  const { user, addEmotionRecord, logout } = useUser()
  const [phase, setPhase] = useState('select')
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [answers, setAnswers] = useState({})
  const [assessmentPage, setAssessmentPage] = useState(0)
  const [bearResult, setBearResult] = useState(null)
  const [assessmentStatus, setAssessmentStatus] = useState({
    assessment_due: true,
    latest: null,
  })

  const allQuestions = useMemo(() => [...PHQ2, ...GAD2].map((q, i) => ({ ...q, id: i })), [])
  const isEnglish = user.language === 'en'
  const visibleQuestions = allQuestions.slice(
    assessmentPage * 2,
    assessmentPage * 2 + 2,
  )
  const currentPageAnswered = visibleQuestions.every(
    (question) => answers[question.id] !== undefined,
  )

  React.useEffect(() => {
    getAssessmentStatus()
      .then(setAssessmentStatus)
      .catch((error) => console.error('Failed to load assessment status:', error))
  }, [])

  const handleEmotionSelect = async (emotion) => {
    setSelectedEmotion(emotion)
    if (emotion.type === 'positive') {
      addEmotionRecord({ emotion: emotion.id, bearMood: 'happy', phq2: 0, gad2: 0 })
      setPhase('result')
      setBearResult({
        mood: 'happy',
        text: isEnglish ? 'You are doing well today! Keep up the positive mood 🌟' : '你今天状态不错！保持这份好心情 🌟',
        level: 0,
      })
      saveAssessment({
        selected_emotion: emotion.id,
        assessment_type: 'checkin',
        phq2_score: 0,
        gad2_score: 0,
      }).catch((error) => console.error('Failed to save check-in:', error))
    } else if (!assessmentStatus.assessment_due && assessmentStatus.latest) {
      const latest = assessmentStatus.latest
      addEmotionRecord({
        emotion: emotion.id,
        bearMood: latest.bear_status,
        phq2: latest.phq2_score,
        gad2: latest.gad2_score,
      })
      setPhase('result')
      setBearResult({
        mood: latest.bear_status,
        text: isEnglish
          ? 'You recently completed this short assessment, so you do not need to repeat it. We can talk about how you feel now.'
          : '近期已经完成过简短量表，本次不需要重复填写。我们可以直接聊聊现在的感受。',
        level: latest.bear_status === 'tired' ? 2 : 1,
      })
      saveAssessment({
        selected_emotion: emotion.id,
        assessment_type: 'checkin',
        phq2_score: latest.phq2_score,
        gad2_score: latest.gad2_score,
      }).catch((error) => console.error('Failed to save check-in:', error))
    } else {
      setPhase('assess')
    }
  }

  const handleAssessComplete = async () => {
    const phq2Total = (answers[0] || 0) + (answers[1] || 0)
    const gad2Total = (answers[2] || 0) + (answers[3] || 0)
    const result = getBearMood(phq2Total, gad2Total, isEnglish)
    setBearResult(result)
    addEmotionRecord({ emotion: selectedEmotion.id, bearMood: result.mood, phq2: phq2Total, gad2: gad2Total })
    setPhase('result')
    try {
      const saved = await saveAssessment({
        selected_emotion: selectedEmotion.id,
        assessment_type: 'phq_gad',
        phq2_score: phq2Total,
        gad2_score: gad2Total,
      })
      setAssessmentStatus({
        assessment_due: false,
        last_assessment_at: saved.created_at,
        latest: saved,
      })
    } catch (error) {
      console.error('Failed to save PHQ/GAD assessment:', error)
    }
  }

  return (
    <div className="h-full flex flex-col pb-20 overflow-y-auto">
      {phase === 'select' && <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <img src={`${import.meta.env.BASE_URL}panda-icon.svg`} alt="Panda" className="rounded-full" style={{ width: 52, height: 52, objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(255,140,66,0.2)' }} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500">
              {isEnglish ? `Hello, ${user.name || 'friend'}` : `${getGreeting()}，${user.name || '朋友'}`}
            </p>
          </div>
          <button
            onClick={async () => {
              await logout()
              navigate('/', { replace: true })
            }}
            className="rounded-full bg-white p-2 text-gray-400"
            aria-label={isEnglish ? 'Log out' : '退出登录'}
          >
            <LogOut size={18} />
          </button>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-800">
          {isEnglish ? 'How are you feeling right now?' : '你现在感觉怎么样？'}
        </h1>
      </div>}

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
                <span className="text-gray-700">
                  {isEnglish ? emotion.en : emotion.label}
                </span>
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
              <h2 className="text-xl font-bold text-gray-800">
                {isEnglish
                  ? 'A short emotional check-in'
                  : '为了更好地了解你的情绪状况，我们来做一个简短的情绪小测试。'}
              </h2>
              <div className="progress-bar mt-2">
                <div className="progress-bar-fill" style={{ width: `${Object.keys(answers).length / 4 * 100}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {isEnglish
                  ? `${Object.keys(answers).length}/4 completed`
                  : `${Object.keys(answers).length}/4 已完成`}
              </p>
            </div>

            <div className="space-y-4">
              {visibleQuestions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="card"
                >
                  <p className="font-medium text-base mb-3">
                    {isEnglish ? q.en : q.q}
                  </p>
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
                        <div>{isEnglish ? opt.en : opt.label}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 mb-4 flex gap-3">
              {assessmentPage > 0 && (
                <button
                  onClick={() => setAssessmentPage(0)}
                  className="btn-secondary flex-1"
                >
                  {isEnglish ? 'Back' : '上一页'}
                </button>
              )}
              <button
                onClick={() => {
                  if (assessmentPage === 0) {
                    setAssessmentPage(1)
                  } else {
                    handleAssessComplete()
                  }
                }}
                disabled={!currentPageAnswered}
                className="btn-primary flex-1"
                style={{ opacity: currentPageAnswered ? 1 : 0.5 }}
              >
                {assessmentPage === 0
                  ? (isEnglish ? 'Next' : '下一页')
                  : (isEnglish ? 'View result' : '查看结果')}
              </button>
            </div>
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
              <BearMood mood={bearResult.mood} size={140} language={user.language} />
            </motion.div>

            <div className="card text-center mb-6 w-full">
              <p className="text-gray-600 text-sm leading-relaxed">{bearResult.text}</p>
            </div>

            <div className="card w-full mb-6 text-center">
              <h2 className="text-xl font-bold text-gray-800">
                {isEnglish ? 'Would you like to talk more?' : '进一步和我聊聊吗？'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {isEnglish
                  ? 'I can listen and help you make sense of what you are feeling.'
                  : '我可以陪你一起梳理困扰、理解情绪。'}
              </p>
            </div>

            <div className="flex gap-3 w-full mb-4">
              <button
                onClick={() => navigate('/chat', { state: { mode: 'voice', newSession: true } })}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Mic size={18} /> {isEnglish ? 'Voice' : '语音倾诉'}
              </button>
              <button
                onClick={() => navigate('/chat', { state: { mode: 'text', newSession: true } })}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> {isEnglish ? 'Text' : '文字倾诉'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
