import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { BearMood } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'
import { Activity, ArrowLeft, Brain, Clock, Dumbbell, FileText, Globe, Heart, Lightbulb, MessageSquare } from 'lucide-react'
import { getLatestSession, getReportByDate, getSessionState } from '../utils/api'

function getEmptyReport(isEnglish) {
  return {
    bearMood: 'calm',
    emotionIndex: 0,
    eventTimeline: [],
    mechanismAnalysis: isEnglish
      ? 'Not available yet. This section updates as the conversation continues.'
      : '暂无。继续交流后，此模块会实时更新。',
    cultureStage: {
      stage: isEnglish ? 'Not available yet' : '暂无',
      desc: isEnglish
        ? 'This section updates when enough relevant information is available.'
        : '获取到相关信息后，此模块会自动更新。',
    },
    needs: [],
    interventions: {
      long: [],
      immediate: [],
    },
    pandaMessage: isEnglish
      ? 'Not available yet. A personalized message will appear here.'
      : '暂无。获取到足够信息后，这里会显示个性化寄语。',
  }
}

function getFallbackRecommendation(isEnglish) {
  return {
    id: 'body_scan',
    name: isEnglish ? 'Body Scan' : '身体扫描',
    duration_seconds: 300,
    reason: isEnglish
      ? 'Gently notice sensations throughout your body to release accumulated tension.'
      : '温和觉察身体各部位的感受，帮助释放累积的紧绷。',
    before_distress: 5,
  }
}

const RECOMMENDATION_TRANSLATIONS = {
  sensory_grounding: {
    name: 'Sensory Grounding',
    reason: 'Use sensory cues around you to bring attention back from worry to the present.',
  },
  physiological_sigh: {
    name: 'Physiological Sigh',
    reason: 'Use a double inhale and slow exhale to help reduce physical tension.',
  },
  micro_behavioral_activation: {
    name: 'Micro Behavioral Activation',
    reason: 'Begin with one manageable action to rebuild momentum during a low period.',
  },
  connection_recall: {
    name: 'Connection Recall',
    reason: 'Recall a moment of support and understanding to reconnect with a sense of safety.',
  },
  body_scan: {
    name: 'Body Scan',
    reason: 'Gently notice sensations throughout your body to release accumulated tension.',
  },
  music_healing: {
    name: 'Music Therapy',
    reason: 'Use soothing music to support emotional regulation and recovery.',
  },
}

function localizeRecommendation(recommendation, isEnglish) {
  if (!isEnglish) return recommendation
  const translated = RECOMMENDATION_TRANSLATIONS[recommendation.id]
  return translated ? { ...recommendation, ...translated } : recommendation
}

function mapReport(state, isEnglish) {
  const emptyReport = getEmptyReport(isEnglish)
  const insight = state.insight_report
  if (!insight || Object.keys(insight).length === 0) return emptyReport
  const profile = state.profile || {}
  const distressScore = Math.round(
    Math.max(profile.phq2_score || 0, profile.gad2_score || 0) / 6 * 100,
  )
  const timeline = insight.what_happened?.timeline || []
  return {
    bearMood: distressScore >= 67 ? 'tired' : distressScore >= 34 ? 'calm' : 'happy',
    emotionIndex: distressScore,
    eventTimeline: timeline.map((event) => ({
      time: '',
      event: typeof event === 'string' ? event : event.event || '',
      emotion: typeof event === 'string' ? '' : event.emotion || '',
    })),
    mechanismAnalysis: insight.why_this_happens?.explanation || (
      isEnglish
        ? 'More information is needed to form a complete analysis.'
        : '仍需要更多信息形成完整分析。'
    ),
    cultureStage: {
      stage: insight.cultural_adaptation?.label || emptyReport.cultureStage.stage,
      desc: insight.cultural_adaptation?.support || '',
    },
    needs: [
      ...(insight.what_i_need?.core_needs || []),
      ...(insight.what_i_need?.suggestions || []),
    ],
    interventions: {
      long: insight.intervention_plan?.long_term || [],
      immediate: insight.intervention_plan?.immediate || [],
    },
    pandaMessage: insight.bear_message || emptyReport.pandaMessage,
  }
}

const REPORT_MODULES = [
  { key: 'status', zh: '我的状态', en: 'My Status', icon: Activity, color: 'bg-orange-100 text-orange-600' },
  { key: 'events', zh: '最近发生了什么', en: 'What Happened Recently', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { key: 'mechanism', zh: '为什么会这样', en: 'Why This Happens', icon: Brain, color: 'bg-purple-100 text-purple-600' },
  { key: 'culture', zh: '文化适应阶段', en: 'Cultural Adaptation Stage', icon: Globe, color: 'bg-green-100 text-green-600' },
  { key: 'needs', zh: '我真正需要什么', en: 'What I Truly Need', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { key: 'interventions', zh: '干预建议', en: 'Recommended Support', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
  { key: 'message', zh: '熊猫寄语', en: 'Message from Panda', icon: MessageSquare, color: 'bg-teal-100 text-teal-600' },
]

export default function ReportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const requestedDate = location.state?.date || null
  const requestedSessionId = location.state?.sessionId || null
  const returnToChat = location.state?.returnToChat || null
  const { user } = useUser()
  const isEnglish = user.language === 'en'
  const [expandedModule, setExpandedModule] = useState(null)
  const [report, setReport] = useState(() => getEmptyReport(isEnglish))
  const [recommendation, setRecommendation] = useState(() => getFallbackRecommendation(isEnglish))
  const [reportStatus, setReportStatus] = useState('idle')
  const [hasReport, setHasReport] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [reportLoaded, setReportLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    let refreshTimer = null
    const loadReport = async () => {
      const latest = requestedSessionId
        ? { session_id: requestedSessionId }
        : await getLatestSession()
      if (!latest.session_id) {
        setHasSession(false)
        return
      }
      const state = await getSessionState(latest.session_id)
      if (requestedDate) {
        const datedReport = await getReportByDate(
          latest.session_id,
          requestedDate,
        )
        state.insight_report = datedReport.report
        state.report_status = 'ready'
      }
      if (cancelled) return
      setHasSession(true)
      setReport(mapReport(state, isEnglish))
      setHasReport(Boolean(
        state.insight_report
        && Object.keys(state.insight_report).length > 0
      ))
      setRecommendation(localizeRecommendation(
        state.training_recommendation || getFallbackRecommendation(isEnglish),
        isEnglish,
      ))
      setReportStatus(state.report_status || 'idle')
      if (state.report_status === 'generating') {
        refreshTimer = window.setTimeout(loadReport, 3000)
      }
    }
    loadReport()
      .catch((error) => {
        console.error('Failed to load insight report:', error)
      })
      .finally(() => {
        if (!cancelled) setReportLoaded(true)
      })
    return () => {
      cancelled = true
      if (refreshTimer) window.clearTimeout(refreshTimer)
    }
  }, [requestedDate, requestedSessionId, isEnglish])

  const cultureLabels = {
    china_in_us: isEnglish ? '🇨🇳 Chinese student in the U.S.' : '🇨🇳 在美中国学生',
    us_in_china: isEnglish ? '🇺🇸 American student in China' : '🇺🇸 在华美国学生',
    other: isEnglish ? '🌍 Other' : '🌍 其他',
  }

  const toggleModule = (key) => {
    setExpandedModule(expandedModule === key ? null : key)
  }

  if (reportLoaded && !hasSession) {
    return (
      <div className="h-full overflow-y-auto pb-20">
        <div className="bg-gradient-to-b from-panda-primary/10 to-transparent px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold mb-1">
            {isEnglish ? 'Emotional Insight Report' : '心理情绪洞察报告'}
          </h1>
          <p className="text-sm text-gray-500">
            {reportStatus === 'generating'
              ? (isEnglish ? 'Generating report' : '报告正在生成')
              : (isEnglish ? 'Generated from your conversation' : '基于真实对话生成')}
          </p>
        </div>
        <div className="flex min-h-[60dvh] items-center justify-center px-6">
          <div className="card w-full text-center">
            <FileText size={42} className="mx-auto text-gray-300" />
            <h2 className="mt-4 text-lg font-bold text-gray-700">
              {reportLoaded && reportStatus !== 'generating'
                ? (isEnglish ? 'No insight report yet' : '还没有洞察报告')
                : (isEnglish ? 'Preparing your report' : '正在准备你的报告')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {reportLoaded && reportStatus !== 'generating'
                ? (isEnglish
                  ? 'After an in-depth conversation, insights based on your conversation will appear here.'
                  : '完成一次深入对话后，这里会展示基于真实交流生成的内容。')
                : (isEnglish
                  ? 'Your report will appear automatically when it is ready. Please wait.'
                  : '报告完成后会自动显示，请稍候。')}
            </p>
            {reportLoaded && reportStatus !== 'generating' && (
              <button
                onClick={() => navigate('/emotion')}
                className="mt-5 rounded-full bg-panda-primary px-6 py-3 font-bold text-white"
              >
                {isEnglish ? 'Back to Emotions' : '返回懂你情绪'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="bg-gradient-to-b from-panda-primary/10 to-transparent px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          {returnToChat && (
            <button
              type="button"
              onClick={() => navigate('/chat', { state: returnToChat })}
              className="rounded-full bg-white/80 p-2 text-gray-600 shadow-sm"
              aria-label={isEnglish ? 'Back to conversation' : '返回对话'}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold mb-1">
              {isEnglish ? 'Emotional Insight Report' : '心理情绪洞察报告'}
            </h1>
            {returnToChat && (
              <p className="text-xs font-medium text-panda-primary">
                {isEnglish ? 'Conversation and report are saved separately' : '对话与报告已分别保存，可随时返回'}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {reportStatus === 'generating'
            ? (isEnglish
              ? 'Generating report; available information is shown for now'
              : '报告正在生成，未捕捉到的信息暂标为“暂无”')
            : !hasReport
              ? (isEnglish
                ? 'The report updates after each conversation turn; missing information is marked “Not available yet”.'
                : '报告会随每轮对话更新，尚未捕捉的信息暂标为“暂无”')
            : `${isEnglish ? 'Created for you' : '专属为你生成'} · ${
              requestedDate
                ? new Date(`${requestedDate}T00:00:00`).toLocaleDateString(isEnglish ? 'en-US' : 'zh-CN')
                : new Date().toLocaleDateString(isEnglish ? 'en-US' : 'zh-CN')
            }`}
        </p>
      </div>

      <div className="px-6 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-4"
        >
          <BearMood mood={report.bearMood} size={64} language={user.language} />
          <div className="flex-1">
            <h3 className="font-bold">
              {report.bearMood === 'happy'
                ? (isEnglish ? 'Happy Panda' : '开心小熊')
                : report.bearMood === 'tired'
                  ? (isEnglish ? 'Tired Panda' : '疲惫小熊')
                  : (isEnglish ? 'Calm Panda' : '平静小熊')}
            </h3>
            <p className="text-sm text-gray-500">
              {isEnglish ? 'Emotional index' : '情绪指数'}:{' '}
              {hasReport ? `${report.emotionIndex}/100` : (isEnglish ? 'Not available yet' : '暂无')}
            </p>
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: `${hasReport ? report.emotionIndex : 0}%` }} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 mb-4">
        <div className="card bg-gradient-to-r from-green-50 to-blue-50">
          <p className="text-sm text-gray-500 mb-1">
            {isEnglish ? 'Cultural Identity' : '文化身份'}
          </p>
          <p className="font-medium">
            {cultureLabels[user.cultureTag] || (isEnglish ? 'Not set' : '未设置')}
          </p>
        </div>
      </div>

      <div className="px-6 space-y-3">
        {REPORT_MODULES.map((mod, i) => {
          const Icon = mod.icon
          const expanded = expandedModule === mod.key
          return (
            <motion.div
              key={mod.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card cursor-pointer"
              onClick={() => toggleModule(mod.key)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold flex-1">{isEnglish ? mod.en : mod.zh}</h3>
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  className="text-gray-400"
                >
                  ▼
                </motion.span>
              </div>

              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  {mod.key === 'status' && (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <img src={`${import.meta.env.BASE_URL}panda-icon-v2.png`} alt="Panda" className="rounded-full" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                        <div>
                          <p className="font-medium">
                            {isEnglish ? 'Emotional index' : '情绪指数'}:{' '}
                            {hasReport ? `${report.emotionIndex}/100` : (isEnglish ? 'Not available yet' : '暂无')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isEnglish
                              ? 'Combined analysis of conversation and vocal expression'
                              : '对话内容与语音表达综合分析'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {mod.key === 'events' && (
                    <div className="space-y-3">
                      {report.eventTimeline.length === 0 && (
                        <p className="text-sm text-gray-400">
                          {isEnglish ? 'Not available yet.' : '暂无'}
                        </p>
                      )}
                      {report.eventTimeline.map((item, j) => (
                        <div key={j} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-panda-primary mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">{item.time}</p>
                            <p className="text-sm font-medium">{item.event}</p>
                            <p className="text-xs text-panda-primary">{item.emotion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mod.key === 'mechanism' && (
                    <p className="text-sm text-gray-700 leading-relaxed">{report.mechanismAnalysis}</p>
                  )}

                  {mod.key === 'culture' && (
                    <div>
                      <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-2">
                        {report.cultureStage.stage}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{report.cultureStage.desc}</p>
                    </div>
                  )}

                  {mod.key === 'needs' && (
                    <ul className="space-y-2">
                      {report.needs.length === 0 && (
                        <li className="text-sm text-gray-400">
                          {isEnglish ? 'Not available yet.' : '暂无'}
                        </li>
                      )}
                      {report.needs.map((need, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <Heart size={14} className="text-pink-500 mt-0.5 flex-shrink-0" />
                          <span>{need}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {mod.key === 'interventions' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-600 mb-2">
                          🌱 {isEnglish ? 'Long-term Suggestions' : '长期建议'}
                        </h4>
                        <ul className="space-y-1.5">
                          {report.interventions.long.length === 0 && (
                            <li className="text-sm text-gray-400">
                              {isEnglish ? 'Not available yet.' : '暂无'}
                            </li>
                          )}
                          {report.interventions.long.map((item, j) => (
                            <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-green-500">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-600 mb-2">
                          ⚡ {isEnglish ? 'Immediate Relief' : '即时缓解'}
                        </h4>
                        <ul className="space-y-1.5">
                          {report.interventions.immediate.length === 0 && (
                            <li className="text-sm text-gray-400">
                              {isEnglish ? 'Not available yet.' : '暂无'}
                            </li>
                          )}
                          {report.interventions.immediate.map((item, j) => (
                            <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-orange-500">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {mod.key === 'message' && (
                    <div className="bg-panda-light/50 rounded-xl p-4">
                      <img src={`${import.meta.env.BASE_URL}panda-icon-v2.png`} alt="Panda" className="rounded-full mb-2" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                      <p className="text-sm text-gray-700 leading-relaxed">{report.pandaMessage}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {hasReport && <div className="px-6 mt-6 mb-6">
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-panda-primary">
            <Dumbbell size={20} />
            <span className="font-bold">
              {isEnglish ? 'Recommended Based on This Report' : '根据本次报告为你推荐'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">{recommendation.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {recommendation.reason}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
            <Clock size={14} />
            {isEnglish ? 'About' : '约'}{' '}
            {Math.max(1, Math.round(recommendation.duration_seconds / 60))}{' '}
            {isEnglish ? 'min' : '分钟'}
          </div>
          <button
            onClick={() => navigate('/training', {
              state: {
                recommendedTraining: recommendation.id,
                beforeDistress: recommendation.before_distress,
                returnTo: '/report',
              },
            })}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-panda-secondary to-teal-400 py-3 font-bold text-white"
          >
            {isEnglish ? 'Start This Exercise' : '开始这项训练'}
          </button>
        </div>
      </div>}
    </div>
  )
}
