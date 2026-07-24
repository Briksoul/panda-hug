import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import PandaTrainingIcon from '../components/PandaTrainingIcon'
import {
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { getLatestSession, recordSelfGuidedTraining } from '../utils/api'

const GUIDES = {
  physiological_sigh: {
    zh: [
      '我们一起做一次生理叹息。请找一个舒服的坐姿或站姿，轻轻放松肩膀。',
      '请用鼻子缓慢地吸一口气。现在先不要呼气，再轻轻地用鼻子补吸一小口，让肺部再充满一点。',
      '接下来，请用嘴巴慢慢地、长长地呼出去。让呼气比吸气更久一些。',
      '再来一次：鼻子缓慢吸气，再轻轻补吸一小口；现在慢慢、长长地呼出去。',
      '最后一次。鼻子吸气，再补吸一小口，慢慢呼气，直到肺里的空气都慢慢排出去。注意此刻身体是否有一点松开。'
    ],
    en: [
      'Let us try a physiological sigh together. Find a comfortable seated or standing position and let your shoulders soften.',
      'Breathe in slowly through your nose. Before breathing out, take one small second inhale through your nose.',
      'Now exhale slowly and fully through your mouth. Let the exhale be longer than the inhale.',
      'Try it once more: inhale through your nose, take a small top-up inhale, then breathe out slowly and fully.',
      'For the final round, inhale, add a small second inhale, and release the air gradually. Notice whether your body feels even a little more settled.'
    ],
  },
  sensory_grounding: {
    zh: [
      '现在，我会陪你做一个简单的感官着陆练习，帮助注意力重新回到此时此刻。先轻轻吸气，再缓缓呼气。',
      '第一步，请在周围找到五样你能看到的东西。不用找特别的东西：一盏灯、一本书、桌子的纹路，或窗外的一棵树都可以。',
      '第二步，找到四样你能触摸到的东西。感受双脚踩在地面的感觉、衣服贴在皮肤上的感觉，或手指触碰桌面的温度。',
      '第三步，找到三种你能听见的声音。先不评价声音好坏，只是静静地听：空调、远处的人声、鸟叫，或自己的呼吸。',
      '第四步，找到两种你能闻到的气味。即使闻不到明显气味，也可以感受空气进入鼻子的感觉。',
      '最后，找到一种你能尝到的味道，可以是嘴里的薄荷味、刚喝过饮料的味道，或口腔本来的味道。不用做到完美；把注意力一点一点带回当下，就已经很好了。'
    ],
    en: [
      'I will guide you through a grounding exercise to bring your attention back to this moment. Take a gentle breath in, then breathe out slowly.',
      'First, name five things you can see around you. They do not need to be special: a lamp, a book, the texture of a desk, or a tree outside.',
      'Next, notice four things you can touch. Feel your feet on the floor, your clothing on your skin, or the temperature of a surface under your hand.',
      'Now listen for three sounds. There is no need to judge them: perhaps an air conditioner, a distant voice, birds, or your own breathing.',
      'Find two things you can smell. If no clear scent is present, simply notice the feeling of air entering your nose.',
      'Finally, notice one thing you can taste: a drink, mint, or the natural taste in your mouth. You do not have to do this perfectly; returning attention to the present is enough.'
    ],
  },
  micro_behavioral_activation: {
    zh: [
      '今天，我们不要求自己解决所有问题，也不需要立刻变得积极。我们只做一件很小很小的事情。轻轻吸气，再慢慢呼出去。',
      '问问自己：如果接下来的两分钟，我只能完成一件最简单、最容易开始的小事，它会是什么？不用选最重要的，只选最容易开始的。',
      '它可以是喝一口水、从床上坐起来、打开电脑、拿起书、给朋友发一句问候，或打开窗户让空气流进来。',
      '现在，把目标再缩小一点。不要想着完成它，只想着开始它。写作时写第一句话；学习时打开课本；运动时站起来，穿上运动鞋。',
      '请给自己一个小承诺：训练结束后的两分钟内，去开始刚才选择的微行动。开始比完成更重要，每一次小行动都在帮助你重新获得掌控感。'
    ],
    en: [
      'Today, you do not need to solve every problem or force yourself to feel positive. We will only choose one very small action. Take a gentle breath in and out.',
      'Ask yourself: if I could do only one simple thing in the next two minutes, what would be easiest to begin? Choose the easiest action, not the most important one.',
      'It might be taking a sip of water, sitting up, opening your computer, picking up a book, sending a short message, or opening a window.',
      'Make the goal even smaller. Do not focus on finishing it; focus only on starting. Write one sentence, open the textbook, or simply put on your shoes.',
      'Make a small commitment to begin that action within two minutes of finishing this exercise. Starting matters more than finishing, and each small action rebuilds a sense of control.'
    ],
  },
  connection_recall: {
    zh: [
      '欢迎来到联结感回溯练习。当感到孤独、压力很大，或觉得没有人理解自己时，我们只花几分钟回忆曾经的支持和连接。找一个舒服的位置，放松肩膀，慢慢呼吸。',
      '请想起一个曾让你感到被关心、被支持或被接纳的人。可以是家人、朋友、老师、同学，或任何给过你温暖体验的人；他或她不需要完美。',
      '现在回忆一个具体的瞬间：也许你困难时有人认真听你说话，孤单时有人说你可以随时找他，或来到陌生环境时有人帮助你适应。',
      '慢慢回到那个画面。你在哪里？周围有什么？那个人说了什么？你的身体有什么感觉？注意那一刻带来的一点安心、温暖或被理解的感觉。',
      '把手轻轻放在胸口，感受呼吸。对自己说：我曾经被支持过；我曾经与别人建立过连接；即使现在遇到困难，我仍然有能力建立新的连接。',
      '距离、时差或语言不同，并不意味着失去连接。过去温暖的关系已经成为你内在的一部分。当你准备好时，慢慢睁开眼睛，带着这份联结回到此刻。'
    ],
    en: [
      'Welcome to this connection recall exercise. When you feel lonely, stressed, or misunderstood, we can spend a few minutes remembering moments of support. Get comfortable, soften your shoulders, and breathe slowly.',
      'Think of someone who once made you feel cared for, supported, or accepted. This can be family, a friend, a teacher, a classmate, or anyone who gave you warmth. They do not need to be perfect.',
      'Recall one specific moment. Perhaps someone listened carefully when life was hard, said you could reach out, or helped you settle into an unfamiliar place.',
      'Return gently to that scene. Where were you? What was around you? What did they say? What do you notice in your body? Allow even a small feeling of safety, warmth, or understanding.',
      'Place a hand on your chest and notice your breathing. Tell yourself: I have been supported. I have formed connections. Even when life is hard, I can build new connections.',
      'Distance, time differences, or language differences do not erase connection. Past warm relationships are part of you. When you are ready, open your eyes and bring that sense of connection back to the present.'
    ],
  },
  body_scan: {
    zh: [
      '找一个可以安稳坐下或躺下的位置。轻轻闭眼或把视线放低，先感受身体被椅子、床或地面承托着。',
      '把注意力带到双脚。留意温度、压力、麻、松或没有特别感觉；不需要改变，只要觉察。',
      '让注意力缓慢经过小腿、膝盖和大腿。每次呼气时，允许这些部位比刚才松开一点点。',
      '继续觉察腹部、胸口、肩膀和双手。若发现紧绷，先承认它，再把呼气轻轻送到那里。',
      '最后觉察颈部、下颌、眼周和额头。感受整个身体一起呼吸，准备好后活动手指，慢慢睁开眼睛。',
    ],
    en: [
      'Find a steady seated or lying position. Close your eyes or lower your gaze and notice how the chair, bed, or floor supports you.',
      'Bring attention to both feet. Notice temperature, pressure, tingling, ease, or no particular sensation. Nothing needs to change.',
      'Move slowly through your calves, knees, and thighs. With each exhale, allow these areas to soften just a little.',
      'Notice your abdomen, chest, shoulders, and hands. If tension is present, acknowledge it and gently breathe toward that area.',
      'Finally notice your neck, jaw, eyes, and forehead. Feel the whole body breathing, then move your fingers and open your eyes when ready.',
    ],
  },
  music_healing: {
    zh: [
      '请选择一段让你感到安全、平静的纯音乐，音量以能听清又不刺激为宜。坐好后，让肩膀自然下沉。',
      '先听音乐里最明显的一种声音：旋律、节奏或某件乐器。无需分析，只跟随它十几秒。',
      '接着留意较远、较轻的声音层次。走神时不用责备自己，只要把注意力轻轻带回音乐。',
      '观察音乐经过身体时的感觉：呼吸是否变化，胸口或肩颈是否有一点松动。任何反应都可以。',
      '音乐结束前，选一个你想保留的声音或感受。慢慢做一次完整呼吸，再带着这份平静回到当下。',
    ],
    en: [
      'Choose a piece of instrumental music that feels safe and calming. Keep the volume clear but gentle, settle in, and let your shoulders drop.',
      'Listen first for the most noticeable element: a melody, rhythm, or instrument. There is no need to analyze it; simply follow it for a few moments.',
      'Now notice quieter layers farther in the background. If your mind wanders, return to the music without criticizing yourself.',
      'Observe how the music moves through your body. Has your breathing shifted? Is there even a little more ease in your chest, shoulders, or neck?',
      'Before the music ends, choose one sound or feeling you want to keep. Take one complete breath and carry that calm back into the present.',
    ],
  },
}

const TRAINING_TYPES = [
  {
    id: 'sensory_grounding',
    name: '感官着陆',
    enName: 'Sensory Grounding',
    desc: '通过视觉、触觉和听觉线索，把注意力带回当下',
    enDesc: 'Use visual, tactile, and auditory cues to bring your attention back to the present',
    color: 'from-cyan-100 to-blue-100',
    duration: 180,
  },
  {
    id: 'physiological_sigh',
    name: '生理叹息',
    enName: 'Physiological Sigh',
    desc: '使用双重吸气和缓慢呼气，帮助身体降低紧张感',
    enDesc: 'Use a double inhale and slow exhale to help your body release tension',
    color: 'from-blue-100 to-indigo-100',
    duration: 120,
  },
  {
    id: 'micro_behavioral_activation',
    name: '微行为激活',
    enName: 'Micro Behavioral Activation',
    desc: '从一个足够小的行动开始，逐步恢复动力与掌控感',
    enDesc: 'Start with one manageable action to gradually restore motivation and control',
    color: 'from-orange-100 to-amber-100',
    duration: 300,
  },
  {
    id: 'connection_recall',
    name: '联结感回溯',
    enName: 'Connection Recall',
    desc: '回忆被理解和支持的时刻，重新感受人与人的联结',
    enDesc: 'Recall moments of understanding and support to reconnect with others',
    color: 'from-pink-100 to-rose-100',
    duration: 240,
  },
  {
    id: 'body_scan',
    name: '身体扫描',
    enName: 'Body Scan',
    desc: '依次觉察身体各部位的感受，释放累积的紧绷',
    enDesc: 'Notice sensations throughout your body to release accumulated tension',
    color: 'from-purple-100 to-violet-100',
    duration: 300,
  },
  {
    id: 'music_healing',
    name: '音乐疗愈',
    enName: 'Music Therapy',
    desc: '通过舒缓音乐调节情绪，为身心留出恢复空间',
    enDesc: 'Use soothing music to regulate emotions and create space for recovery',
    color: 'from-emerald-100 to-teal-100',
    duration: 300,
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
  const [isPaused, setIsPaused] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [feelingAfter, setFeelingAfter] = useState(null)
  const [speechRate, setSpeechRate] = useState(1)
  const [speechSupported, setSpeechSupported] = useState(false)
  const synthesisRef = useRef(null)
  const narrationIdRef = useRef(0)

  const training = selected ? TRAINING_TYPES.find(t => t.id === selected) : null
  const trainingName = training ? (isEnglish ? training.enName : training.name) : ''
  const trainingDesc = training ? (isEnglish ? training.enDesc : training.desc) : ''
  const guide = training && GUIDES[training.id] ? GUIDES[training.id][isEnglish ? 'en' : 'zh'] : []
  const feelings = [
    { id: 'better', label: isEnglish ? 'Much better 😊' : '好多了😊', distress: 3 },
    { id: 'same', label: isEnglish ? 'About the same 😌' : '差不多😌', distress: 6 },
    { id: 'worse', label: isEnglish ? 'Still not well 😔' : '还是不好😔', distress: 8 },
  ]

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis
    setSpeechSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
    return () => {
      narrationIdRef.current += 1
      synthesisRef.current?.cancel()
    }
  }, [])

  const stopNarration = useCallback(() => {
    narrationIdRef.current += 1
    synthesisRef.current?.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }, [])

  const startNarration = useCallback((startAt = currentStep, rate = speechRate) => {
    if (!speechSupported || guide.length === 0) return
    const synthesis = synthesisRef.current
    const narrationId = narrationIdRef.current + 1
    narrationIdRef.current = narrationId
    synthesis.cancel()
    setCompleted(false)
    setIsPaused(false)
    setIsPlaying(true)

    const speakStep = (index) => {
      if (narrationIdRef.current !== narrationId) return
      setCurrentStep(index)
      const utterance = new SpeechSynthesisUtterance(guide[index])
      utterance.lang = isEnglish ? 'en-US' : 'zh-CN'
      utterance.rate = rate
      utterance.onend = () => {
        if (narrationIdRef.current !== narrationId) return
        if (index < guide.length - 1) {
          speakStep(index + 1)
        } else {
          setIsPlaying(false)
          setIsPaused(false)
          setCompleted(true)
        }
      }
      utterance.onerror = () => {
        if (narrationIdRef.current === narrationId) {
          setIsPlaying(false)
          setIsPaused(false)
        }
      }
      synthesis.speak(utterance)
    }
    speakStep(Math.max(0, Math.min(startAt, guide.length - 1)))
  }, [currentStep, guide, isEnglish, speechRate, speechSupported])

  const handleStart = (id) => {
    stopNarration()
    setSelected(id)
    setCurrentStep(0)
    setCompleted(false)
    setFeelingAfter(null)
  }

  const handlePlay = () => {
    if (!isPlaying) {
      startNarration()
    } else if (isPaused) {
      synthesisRef.current?.resume()
      setIsPaused(false)
    } else {
      synthesisRef.current?.pause()
      setIsPaused(true)
    }
  }

  const handleReset = () => {
    stopNarration()
    setCurrentStep(0)
    setCompleted(false)
  }

  const handleRateChange = (rate) => {
    setSpeechRate(rate)
    if (isPlaying && !isPaused) startNarration(currentStep, rate)
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
      <div className="h-full overflow-y-auto bg-gradient-to-b from-orange-50/80 via-rose-50/30 to-white pb-20">
        <div className="mx-6 mt-5 rounded-3xl border border-white/80 bg-white/70 px-5 py-5 shadow-sm backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-panda-primary">
            <Sparkles size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">
              {isEnglish ? 'A gentle pause for you' : '给自己一个温柔的暂停'}
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-extrabold text-gray-800">
            {isEnglish ? 'Train Together' : '一起训练'}
          </h1>
          <p className="text-base font-semibold text-gray-700">
            {isEnglish ? 'Choose a relaxation exercise that suits you' : '选择适合你的放松训练'}
          </p>
        </div>

        <div className="space-y-3 px-6 pt-5">
          {TRAINING_TYPES.map((t, i) => {
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStart(t.id)}
                className="card flex w-full items-center gap-4 border border-orange-100/70 bg-white/90 text-left shadow-sm"
              >
                <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br ${t.color} shadow-inner ring-1 ring-white/90`}>
                  <PandaTrainingIcon type={t.id} size={58} />
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
    return (
      <div className="flex h-full flex-col overflow-y-auto px-6 py-8">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${training.color} shadow-lg ring-1 ring-white/90`}>
            <PandaTrainingIcon type={training.id} size={72} />
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
          <img src={`${import.meta.env.BASE_URL}panda-icon-v2.png`} alt="Panda" className="rounded-full mx-auto mb-3" style={{ width: 48, height: 48, objectFit: 'cover' }} />
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

  return (
    <div className="h-full overflow-y-auto px-6 py-8 pb-24">
      <div className="mx-auto w-full max-w-xl">
        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${training.color} shadow-lg ring-1 ring-white/90`}>
          <PandaTrainingIcon type={training.id} size={72} />
        </div>
        <h2 className="text-center text-xl font-bold">{trainingName}</h2>
        <p className="mt-2 text-center text-sm text-gray-500">{trainingDesc}</p>

        <div className="mt-6 rounded-3xl bg-panda-secondary/10 p-5">
          <p className="text-center text-xs font-medium text-gray-500">
            {isEnglish ? 'Section' : '段落'} {currentStep + 1} / {guide.length}
          </p>
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 min-h-28 text-center text-base leading-8 text-gray-700"
          >
            {guide[currentStep]}
          </motion.p>
          <input
            aria-label={isEnglish ? 'Exercise progress' : '训练进度'}
            className="mt-5 w-full accent-panda-primary"
            type="range"
            min="0"
            max={Math.max(0, guide.length - 1)}
            step="1"
            value={currentStep}
            onChange={(event) => {
              const nextStep = Number(event.target.value)
              setCurrentStep(nextStep)
              if (isPlaying && !isPaused) startNarration(nextStep)
            }}
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button onClick={handleReset} className="rounded-full bg-gray-100 p-3" aria-label={isEnglish ? 'Restart' : '重新开始'}>
            <RotateCcw size={21} className="text-gray-600" />
          </button>
          <button
            onClick={handlePlay}
            disabled={!speechSupported}
            className="flex min-w-36 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm px-6 py-4 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPlaying && !isPaused ? <Pause size={22} /> : <Play size={22} />}
            {isPlaying && !isPaused
              ? (isEnglish ? 'Pause' : '暂停')
              : isPaused
                ? (isEnglish ? 'Continue' : '继续')
                : (isEnglish ? 'Start voice guide' : '开始语音引导')}
          </button>
          <button onClick={stopNarration} className="rounded-full bg-gray-100 p-3" aria-label={isEnglish ? 'Stop voice guide' : '停止语音引导'}>
            <VolumeX size={21} className="text-gray-600" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Volume2 size={17} />
          <span>{isEnglish ? 'Speed' : '语速'}</span>
          {[0.8, 1, 1.2, 1.4].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              className={`rounded-full px-3 py-1 ${speechRate === rate ? 'bg-panda-primary text-white' : 'bg-gray-100'}`}
            >
              {rate}×
            </button>
          ))}
        </div>
        {!speechSupported && (
          <p className="mt-3 text-center text-xs text-amber-600">
            {isEnglish ? 'Voice guidance is unavailable in this browser. You can still read the text guide below.' : '当前浏览器不支持语音朗读，你仍可以阅读下方文字引导。'}
          </p>
        )}

        <div className="mt-8">
          <h3 className="mb-3 font-bold text-gray-700">{isEnglish ? 'Text guide' : '文字引导'}</h3>
          <div className="space-y-3">
            {guide.map((text, index) => (
              <button
                key={text}
                onClick={() => {
                  setCurrentStep(index)
                  if (isPlaying && !isPaused) startNarration(index)
                }}
                className={`w-full rounded-2xl p-4 text-left text-sm leading-6 transition ${index === currentStep ? 'border border-panda-primary bg-orange-50 text-gray-800' : 'bg-gray-50 text-gray-500'}`}
              >
                <span className="mr-2 font-bold">{index + 1}.</span>{text}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            stopNarration()
            setSelected(null)
          }}
          className="mt-7 w-full py-3 text-sm text-gray-500"
        >
          {isEnglish ? 'Back to Exercise List' : '返回训练列表'}
        </button>
      </div>
    </div>
  )
}
