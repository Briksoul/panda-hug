import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PandaFace } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'
import { Play, Pause, RotateCcw, ChevronRight, Wind, Brain, TreePine, Sparkles } from 'lucide-react'

const TRAINING_TYPES = [
  {
    id: 'breathing_478',
    name: '4-7-8 呼吸法',
    desc: '通过调节呼吸节奏，快速平静身心',
    icon: Wind,
    color: 'from-blue-400 to-cyan-400',
    duration: 180,
    steps: [
      { phase: '准备', instruction: '找一个舒适的姿势坐好，轻轻闭上眼睛', duration: 10 },
      { phase: '吸气', instruction: '用鼻子慢慢吸气 4 秒...', duration: 4, repeat: 4 },
      { phase: '屏息', instruction: '屏住呼吸 7 秒...', duration: 7, repeat: 4 },
      { phase: '呼气', instruction: '用嘴慢慢呼气 8 秒...', duration: 8, repeat: 4 },
      { phase: '结束', instruction: '慢慢睁开眼睛，感受当下的平静', duration: 10 },
    ],
  },
  {
    id: 'breathing_box',
    name: '方块呼吸',
    desc: '军人使用的高效减压呼吸技术',
    icon: Wind,
    color: 'from-indigo-400 to-purple-400',
    duration: 120,
    steps: [
      { phase: '准备', instruction: '坐直身体，放松肩膀', duration: 5 },
      { phase: '吸气', instruction: '吸气 4 秒...', duration: 4, repeat: 6 },
      { phase: '屏息', instruction: '屏住 4 秒...', duration: 4, repeat: 6 },
      { phase: '呼气', instruction: '呼气 4 秒...', duration: 4, repeat: 6 },
      { phase: '屏息', instruction: '屏住 4 秒...', duration: 4, repeat: 6 },
    ],
  },
  {
    id: 'mindfulness',
    name: '正念冥想',
    desc: '关注当下，减少焦虑和压力',
    icon: Brain,
    color: 'from-purple-400 to-pink-400',
    duration: 300,
    steps: [
      { phase: '准备', instruction: '找一个安静的地方坐下，闭上眼睛', duration: 15 },
      { phase: '扫描', instruction: '从头顶开始，慢慢感受身体的每个部位...', duration: 60 },
      { phase: '呼吸', instruction: '关注你的呼吸，不要试图改变它...', duration: 120 },
      { phase: '观察', instruction: '如果有想法出现，像看云一样看着它飘过...', duration: 60 },
      { phase: '结束', instruction: '慢慢动动手指和脚趾，轻轻睁开眼睛', duration: 15 },
    ],
  },
  {
    id: 'nature',
    name: '自然冥想',
    desc: '想象自己在大自然中，找回内心的宁静',
    icon: TreePine,
    color: 'from-green-400 to-emerald-400',
    duration: 240,
    steps: [
      { phase: '准备', instruction: '闭上眼睛，深呼吸三次', duration: 15 },
      { phase: '想象', instruction: '你走在一条林间小路上，阳光透过树叶...', duration: 60 },
      { phase: '聆听', instruction: '你听到了鸟鸣声、溪水声...', duration: 60 },
      { phase: '感受', instruction: '微风拂过你的脸颊，带来花草的香气...', duration: 60 },
      { phase: '结束', instruction: '带着这份宁静，慢慢回到当下', duration: 15 },
    ],
  },
]

export default function TrainingPage() {
  const { addTrainingRecord } = useUser()
  const [selected, setSelected] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [feelingAfter, setFeelingAfter] = useState(null)
  const timerRef = useRef(null)

  const training = selected ? TRAINING_TYPES.find(t => t.id === selected) : null

  useEffect(() => {
    if (isPlaying && training && currentStep < training.steps.length) {
      const step = training.steps[currentStep]
      if (timeLeft <= 0) {
        setTimeLeft(step.duration)
      }
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Move to next step
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

  const handleComplete = (feeling) => {
    setFeelingAfter(feeling)
    addTrainingRecord({
      type: training.name,
      duration: training.duration,
      completed: true,
      feeling,
    })
  }

  // Training list view
  if (!selected) {
    return (
      <div className="h-full overflow-y-auto pb-20">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold mb-1">一起训练</h1>
          <p className="text-sm text-gray-500">选择适合你的放松训练</p>
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
                  <h3 className="font-bold">{t.name}</h3>
                  <p className="text-sm text-gray-500">{t.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">⏱ {Math.floor(t.duration / 60)} 分钟</p>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </motion.button>
            )
          })}
        </div>

        {/* Panda intro */}
        <div className="px-6 mt-6 mb-6">
          <div className="card bg-gradient-to-r from-panda-light to-orange-50">
            <div className="flex items-start gap-3">
                  <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full" style={{ width: 48, height: 48, objectFit: 'cover' }} />
              <div>
                <p className="text-sm text-gray-700">
                  谢谢你愿意和我分享这些。我能感受到你在异国他乡的不容易，也看到了你一直在努力适应和坚持。现在，是时候照顾一下自己了。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Training completion
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
        <h2 className="text-2xl font-bold mb-2">训练完成！🎉</h2>
        <p className="text-gray-500 mb-6">{training.name} · {Math.floor(training.duration / 60)} 分钟</p>

        <div className="card w-full mb-6">
          <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full mx-auto mb-3" style={{ width: 48, height: 48, objectFit: 'cover' }} />
          <p className="text-center text-gray-700 font-medium mb-4">现在感觉如何？</p>
          <div className="grid grid-cols-3 gap-3">
            {['好多了😊', '差不多😌', '还是不好😔'].map(label => (
              <button
                key={label}
                onClick={() => handleComplete(label)}
                className={`py-3 rounded-xl border-2 text-sm transition ${
                  feelingAfter === label
                    ? 'border-panda-primary bg-orange-50'
                    : 'border-gray-200'
                }`}
              >
                {label}
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
                感谢你的坚持！每一次训练都在帮助你变得更强。💪
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-full py-3 rounded-xl bg-panda-primary text-white font-medium"
            >
              返回训练列表
            </button>
          </motion.div>
        )}
      </div>
    )
  }

  // Training in progress
  const step = training.steps[currentStep]
  const progress = training.steps.slice(0, currentStep).reduce((acc, s) => acc + s.duration, 0) + (step.duration - timeLeft)
  const totalDuration = training.steps.reduce((acc, s) => acc + s.duration, 0)

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <h2 className="text-xl font-bold mb-2">{training.name}</h2>
      <p className="text-sm text-gray-500 mb-8">步骤 {currentStep + 1} / {training.steps.length}</p>

      {/* Breathing circle */}
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

      {/* Instruction */}
      <motion.p
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-center text-gray-700 mb-8 max-w-xs"
      >
        {step.instruction}
      </motion.p>

      {/* Progress */}
      <div className="w-full max-w-xs mb-8">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress / totalDuration * 100}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="p-4 rounded-full bg-gray-100"
        >
          <RotateCcw size={24} className="text-gray-600" />
        </button>
        <button
          onClick={handlePlay}
          className="p-6 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white shadow-lg"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button
          onClick={() => setSelected(null)}
          className="p-4 rounded-full bg-gray-100"
        >
          <span className="text-sm text-gray-600 px-2">退出</span>
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400 mt-6">说"停止训练"可随时终止</p>
    </div>
  )
}
