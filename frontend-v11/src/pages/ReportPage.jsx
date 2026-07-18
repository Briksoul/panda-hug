import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { PandaFace, BearMood } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'
import { FileText, Activity, Brain, Globe, Heart, Lightbulb, MessageSquare } from 'lucide-react'

// Mock report data
const MOCK_REPORT = {
  bearMood: 'calm',
  emotionIndex: 62,
  eventTimeline: [
    { time: '今天 10:30', event: '与同学讨论课题时产生分歧', emotion: '焦虑' },
    { time: '昨天 15:00', event: '收到家人的视频电话', emotion: '温暖' },
    { time: '3天前 20:00', event: '期中考试成绩不理想', emotion: '沮丧' },
  ],
  mechanismAnalysis: '您在学术环境中遇到的压力，与跨文化适应中的"能力落差感"有关。在中国学习时的自信，到了新的语言和文化环境中可能暂时受挫，这是非常正常的适应过程。',
  cultureStage: { stage: '挫折期', desc: '文化适应的第二阶段，开始感受到文化差异带来的实际困难，情绪波动较大。这是成长的必经之路。' },
  needs: ['归属感 — 渴望被理解和接纳', '情感支持 — 需要来自家人和朋友的鼓励', '自我效能 — 需要小的成功体验来重建信心'],
  interventions: {
    long: ['每周进行2-3次正念冥想练习', '尝试加入一个校园社团，建立本地社交圈', '定期与家人视频通话，保持情感连接'],
    immediate: ['尝试4-7-8呼吸法：吸气4秒，屏息7秒，呼气8秒', '写下三件今天让你感到感恩的事', '去户外散步15分钟，接触自然'],
  },
  pandaMessage: '小屈，你一直都在努力适应新的环境，这本身就很了不起。每一次困难都是成长的机会，而我会一直在这里陪伴你。让我们一起做些放松训练吧，你值得被温柔对待。🌈',
}

const REPORT_MODULES = [
  { key: 'status', title: '我的状态', icon: Activity, color: 'bg-orange-100 text-orange-600' },
  { key: 'events', title: '最近发生了什么', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { key: 'mechanism', title: '为什么会这样', icon: Brain, color: 'bg-purple-100 text-purple-600' },
  { key: 'culture', title: '文化适应阶段', icon: Globe, color: 'bg-green-100 text-green-600' },
  { key: 'needs', title: '我真正需要什么', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { key: 'interventions', title: '干预建议', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
  { key: 'message', title: '熊猫寄语', icon: MessageSquare, color: 'bg-teal-100 text-teal-600' },
]

export default function ReportPage() {
  const { user, reports } = useUser()
  const [expandedModule, setExpandedModule] = useState(null)
  const report = MOCK_REPORT // In production, use reports[reports.length - 1]

  const cultureLabels = {
    china_in_us: '🇨🇳 在美中国学生',
    us_in_china: '🇺🇸 在华美国学生',
    other: '🌍 其他',
  }

  const toggleModule = (key) => {
    setExpandedModule(expandedModule === key ? null : key)
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-panda-primary/10 to-transparent px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold mb-1">心理情绪洞察报告</h1>
        <p className="text-sm text-gray-500">专属为你生成 · {new Date().toLocaleDateString('zh-CN')}</p>
      </div>

      {/* Bear Mood Card */}
      <div className="px-6 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-4"
        >
          <BearMood mood={report.bearMood} size={64} />
          <div className="flex-1">
            <h3 className="font-bold">平静小熊</h3>
            <p className="text-sm text-gray-500">情绪指数：{report.emotionIndex}/100</p>
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: `${report.emotionIndex}%` }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Culture Tag */}
      <div className="px-6 mb-4">
        <div className="card bg-gradient-to-r from-green-50 to-blue-50">
          <p className="text-sm text-gray-500 mb-1">文化身份</p>
          <p className="font-medium">{cultureLabels[user.cultureTag] || '未设置'}</p>
        </div>
      </div>

      {/* Report Modules */}
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
                <h3 className="font-bold flex-1">{mod.title}</h3>
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
                        <img src={report.bearMood === 'happy' ? '/panda-happy.jpg' : report.bearMood === 'calm' ? '/panda-calm.jpg' : '/panda-tired.jpg'} alt="Panda" className="rounded-full" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                        <div>
                          <p className="font-medium">情绪指数：{report.emotionIndex}/100</p>
                          <p className="text-sm text-gray-500">语音情绪 + 面部表情综合分析</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {mod.key === 'events' && (
                    <div className="space-y-3">
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
                        <h4 className="text-sm font-bold text-gray-600 mb-2">🌱 长期建议</h4>
                        <ul className="space-y-1.5">
                          {report.interventions.long.map((item, j) => (
                            <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-green-500">•</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-600 mb-2">⚡ 即时缓解</h4>
                        <ul className="space-y-1.5">
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
                      <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full mb-2" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                      <p className="text-sm text-gray-700 leading-relaxed">{report.pandaMessage}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Go to training */}
      <div className="px-6 mt-6 mb-6">
        <button
          onClick={() => window.location.href = '/training'}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-panda-secondary to-teal-400 text-white font-bold text-lg shadow-lg"
        >
          🧘 一起做放松训练
        </button>
      </div>
    </div>
  )
}
