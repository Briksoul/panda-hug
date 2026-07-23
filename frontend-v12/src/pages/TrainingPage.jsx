import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import {
  ChevronRight,
  Focus,
  Footprints,
  Music,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react'
import { getLatestSession, recordSelfGuidedTraining } from '../utils/api'

const TRAINING_TYPES = [
  {
    id: 'sensory_grounding',
    name: '感官着陆',
    enName: 'Sensory Grounding',
    desc: '通过视觉、触觉和听觉线索，把注意力带回当下',
    enDesc: 'Use visual, tactile, and auditory cues to bring your attention back to the present',
    icon: Focus,
    color: 'from-cyan-400 to-blue-400',
    duration: 180,
    placeholder: true,
  },
  {
    id: 'physiological_sigh',
    name: '生理叹息',
    enName: 'Physiological Sigh',
    desc: '使用双重吸气和缓慢呼气，帮助身体降低紧张感',
    enDesc: 'Use a double inhale and slow exhale to help your body release tension',
    icon: Wind,
    color: 'from-blue-400 to-indigo-400',
    duration: 120,
    placeholder: true,
  },
  {
    id: 'micro_behavioral_activation',
    name: '微行为激活',
    enName: 'Micro Behavioral Activation',
    desc: '从一个足够小的行动开始，逐步恢复动力与掌控感',
    enDesc: 'Start with one manageable action to gradually restore motivation and control',
    icon: Footprints,
    color: 'from-orange-400 to-amber-400',
    duration: 300,
    placeholder: true,
  },
  {
    id: 'connection_recall',
    name: '联结感回溯',
    enName: 'Connection Recall',
    desc: '回忆被理解和支持的时刻，重新感受人与人的联结',
    enDesc: 'Recall moments of understanding and support to reconnect with others',
    icon: Users,
    color: 'from-pink-400 to-rose-400',
    duration: 240,
    placeholder: true,
  },
  {
    id: 'body_scan',
    name: '身体扫描',
    enName: 'Body Scan',
    desc: '依次觉察身体各部位的感受，释放累积的紧绷',
    enDesc: 'Notice sensations throughout your body to release accumulated tension',
    icon: ScanLine,
    color: 'from-purple-400 to-violet-400',
    duration: 300,
    placeholder: true,
  },
  {
    id: 'music_healing',
    name: '音乐疗愈',
    enName: 'Music Therapy',
    desc: '通过舒缓音乐调节情绪，为身心留出恢复空间',
    enDesc: 'Use soothing music to regulate emotions and create space for recovery',
    icon: Music,
    color: 'from-emerald-400 to-teal-400',
    duration: 300,
    placeholder: true,
  },
]

export default function TrainingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, addTrainingRecord } = useUser()
  const isEnglish = user.language === 'en'
  const recommendedTraining = location.state?.recommendedTraining
  const [selected, setSelected] = useState(() => (
    TRAINING_TYPES.some((training) => training.id === recommendedTraining)
      ? recommendedTraining
      : null
  ))
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [feelingAfter, setFeelingAfter] = useState(null)
  const timerRef = useRef(null)

  const training = selected ? TRAINING_TYPES.find(t => t.id === selected) : null
  const trainingName = training ? (isEnglish ? training.enName : training.name) : ''
  const trainingDesc = training ? (isEnglish ? training.enDesc : training.desc) : ''
  const feelings = [
    { id: 'better', label: isEnglish ? 'Much better 😊' : '好多了😊', distress: 3 },
    { id: 'same', label: isEnglish ? 'About the same 😌' : '差不多😌', distress: 6 },
    { id: 'worse', label: isEnglish ? 'Still not well 😔' : '还是不好😔', distress: 8 },
  ]

  useEffect(() => {
    if (isPlaying && training && currentStep < training.steps.length) {
      const step = training.steps[currentStep]
      if (timeLeft <= 0) {
        setTimeLeft(step.duration)
      }
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (currentStep < training.steps.length - 1) {
              setCurrentStep(c => c + 1)
            } else {
              setIsPlaying(false)
              setCompleted(true)
              clearInterval(timerRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying, currentStep, training])

  const handleStart = (id) => {
    setSelected(id)
    setCurrentStep(0)
    setTimeLeft(0)
    setCompleted(false)
    setFeelingAfter(null)
  }

  const handlePlay = () => setIsPlaying(!isPlaying)

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
    setTimeLeft(0)
    setCompleted(false)
    clearInterval(timerRef.current)
  }

  const handleComplete = async (feeling) => {
    setFeelingAfter(feeling.id)
    addTrainingRecord({
      type: trainingName,
      duration: training.duration,
      completed: true,
      feeling: feeling.label,
    })
    try {
      const localSessionId = localStorage.getItem('panda_session_id')
      const sessionId = localSessionId || (await getLatestSession()).session_id
      if (!sessionId) return
      const afterDistress = feeling.distress
      const recommendedBaseline = Number(location.state?.beforeDistress)
      const beforeDistress = Number.isFinite(recommendedBaseline)
        ? Math.max(0, Math.min(10, Math.round(recommendedBaseline)))
        : 6
      await recordSelfGuidedTraining(sessionId, {
        technique: training.name,
        duration_seconds: training.duration,
        before_distress: beforeDistress,
        after_distress: afterDistress,
        user_feedback: feeling.label,
      })
    } catch (error) {
      console.error('Failed to save training record:', error)
    }
  }

  if (!selected) {
    return (
      <div className="h-full overflow-y-auto pb-20">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold mb-1">
            {isEnglish ? 'Train Together' : '一起训练'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEnglish ? 'Choose a relaxation exercise that suits you' : '选择适合你的放松训练'}
          </p>
        </div>

        <div className="px-6 space-y-3">
          {TRAINING_TYPES.map((t, i) => {
            const Icon = t.icon
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStart(t.id)}
                className="w-full card flex items-center gap-4 text-left"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{isEnglish ? t.enName : t.name}</h3>
                  <p className="text-sm text-gray-500">{isEnglish ? t.enDesc : t.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    ⏱ {Math.floor(t.duration / 60)} {isEnglish ? 'min' : '分钟'}
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </motion.button>
            )
          })}
        </div>

      </div>
    )
  }

  if (training?.placeholder) {
    const TrainingIcon = training.icon
    return (
      <div className="flex h-full flex-col overflow-y-auto px-6 py-8">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${training.color} text-white shadow-lg`}>
            <TrainingIcon size={36} />
          </div>
          <h1 className="text-center text-2xl font-bold">{trainingName}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
            {trainingDesc}
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            {isEnglish ? 'Estimated duration' : '预计时长'}{' '}
            {Math.ceil(training.duration / 60)} {isEnglish ? 'min' : '分钟'}
          </p>

          <div className="mt-8 rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50/60 px-6 py-12 text-center">
            <Play size={34} className="mx-auto mb-3 text-panda-primary/60" />
            <p className="font-bold text-gray-700">
              {isEnglish ? 'Exercise Content Placeholder' : '训练播放内容占位'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {isEnglish
                ? 'Audio, animation, or step-by-step voice guidance can be added here later.'
                : '后续可在这里填充音频、动画或分步骤语音引导。'}
            </p>
          </div>

          <button
            disabled
            className="mt-6 w-full rounded-full bg-gray-200 py-4 font-bold text-gray-400"
          >
            {isEnglish ? 'Content Coming Soon' : '播放内容待补充'}
          </button>
          <button
            onClick={() => {
              if (location.state?.returnTo) {
                navigate(location.state.returnTo)
              } else {
                setSelected(null)
              }
            }}
            className="mt-3 w-full py-3 text-sm text-gray-500"
          >
            {location.state?.returnTo
              ? (isEnglish ? 'Back to Conversation' : '返回对话')
              : (isEnglish ? 'Back to Exercise List' : '返回训练列表')}
          </button>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <Sparkles size={64} className="text-panda-primary mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">
          {isEnglish ? 'Exercise Complete! 🎉' : '训练完成！🎉'}
        </h2>
        <p className="text-gray-500 mb-6">
          {trainingName} · {Math.floor(training.duration / 60)} {isEnglish ? 'min' : '分钟'}
        </p>

        <div className="card w-full mb-6">
          <img src={`${import.meta.env.BASE_URL}panda-icon.svg`} alt="Panda" className="rounded-full mx-auto mb-3" style={{ width: 48, height: 48, objectFit: 'cover' }} />
          <p className="text-center text-gray-700 font-medium mb-4">
            {isEnglish ? 'How do you feel now?' : '现在感觉如何？'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {feelings.map(feeling => (
              <button
                key={feeling.id}
                onClick={() => handleComplete(feeling)}
                className={`py-3 rounded-xl border-2 text-sm transition ${
                  feelingAfter === feeling.id
                    ? 'border-panda-primary bg-orange-50'
                    : 'border-gray-200'
                }`}
              >
                {feeling.label}
              </button>
            ))}
          </div>
        </div>

        {feelingAfter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="card bg-panda-secondary/10 mb-4">
              <p className="text-sm text-gray-700 text-center">
                {isEnglish
                  ? 'Thank you for staying with it! Every exercise helps you grow stronger. 💪'
                  : '感谢你的坚持！每一次训练都在帮助你变得更强。💪'}
              </p>
            </div>
            <button
              onClick={() => {
                if (location.state?.returnTo) {
                  navigate(location.state.returnTo)
                } else {
                  setSelected(null)
                }
              }}
              className="w-full py-3 rounded-xl bg-panda-primary text-white font-medium"
            >
              {location.state?.returnTo
                ? (isEnglish ? 'Back to Conversation' : '返回对话')
                : (isEnglish ? 'Back to Exercise List' : '返回训练列表')}
            </button>
          </motion.div>
        )}
      </div>
    )
  }

  const step = training.steps[currentStep]
  const progress = training.steps.slice(0, currentStep).reduce((acc, s) => acc + s.duration, 0) + (step.duration - timeLeft)
  const totalDuration = training.steps.reduce((acc, s) => acc + s.duration, 0)

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <h2 className="text-xl font-bold mb-2">{trainingName}</h2>
      <p className="text-sm text-gray-500 mb-8">
        {isEnglish ? 'Step' : '步骤'} {currentStep + 1} / {training.steps.length}
      </p>

      <motion.div
        animate={{
          scale: isPlaying && (step.phase === '吸气') ? 1.3 :
                 isPlaying && (step.phase === '呼气') ? 0.7 : 1,
        }}
        transition={{ duration: step.duration, ease: 'easeInOut' }}
        className="w-48 h-48 rounded-full bg-gradient-to-br from-panda-secondary/30 to-panda-primary/30 flex items-center justify-center mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-panda-secondary/50 to-panda-primary/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{timeLeft}</p>
            <p className="text-sm text-white/80">{step.phase}</p>
          </div>
        </div>
      </motion.div>

      <motion.p
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-center text-gray-700 mb-8 max-w-xs"
      >
        {step.instruction}
      </motion.p>

      <div className="w-full max-w-xs mb-8">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress / totalDuration * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleReset} className="p-4 rounded-full bg-gray-100">
          <RotateCcw size={24} className="text-gray-600" />
        </button>
        <button
          onClick={handlePlay}
          className="p-6 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white shadow-lg"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button onClick={() => setSelected(null)} className="p-4 rounded-full bg-gray-100">
          <span className="text-sm text-gray-600 px-2">
            {isEnglish ? 'Exit' : '退出'}
          </span>
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        {isEnglish
          ? 'Say “stop exercise” to end at any time'
          : '说“停止训练”可随时终止'}
      </p>
    </div>
  )
}
