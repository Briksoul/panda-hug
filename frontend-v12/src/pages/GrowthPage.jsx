import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { useUser } from '../hooks/useUser'
import { Calendar, TrendingUp, BarChart3, Award, ChevronLeft, ChevronRight } from 'lucide-react'

const MOCK_EMOTION_TREND = [
  { date: '7/1', index: 70, mood: 'happy' },
  { date: '7/3', index: 65, mood: 'calm' },
  { date: '7/5', index: 55, mood: 'calm' },
  { date: '7/7', index: 48, mood: 'tired' },
  { date: '7/9', index: 60, mood: 'calm' },
  { date: '7/11', index: 72, mood: 'happy' },
  { date: '7/13', index: 68, mood: 'calm' },
  { date: '7/15', index: 62, mood: 'calm' },
]

const MOCK_ISSUES = [
  { name: '学业压力', value: 35, color: '#FF8C42' },
  { name: '文化适应', value: 25, color: '#4ECDC4' },
  { name: '人际关系', value: 20, color: '#87CEEB' },
  { name: '家庭思念', value: 15, color: '#FFB347' },
  { name: '其他', value: 5, color: '#D3D3D3' },
]

const MOCK_TRAINING_EFFECT = [
  { date: '7/3', before: 45, after: 62 },
  { date: '7/7', before: 40, after: 58 },
  { date: '7/10', before: 50, after: 70 },
  { date: '7/13', before: 48, after: 65 },
]

const INTERACTION_LEVELS = [
  { min: 1, max: 14, label: '初识伙伴', emoji: '🌱', desc: '刚开始了解彼此' },
  { min: 15, max: 30, label: '温暖陪伴', emoji: '🌿', desc: '逐渐建立信任' },
  { min: 31, max: 60, label: '知心好友', emoji: '🌳', desc: '深入了解你的世界' },
  { min: 61, max: 90, label: '灵魂知己', emoji: '🌟', desc: '最懂你的 Panda' },
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function GrowthPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)

  const interactionDays = 7
  const currentLevel = INTERACTION_LEVELS.find(l => interactionDays >= l.min && interactionDays <= l.max) || INTERACTION_LEVELS[0]

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarDays = useMemo(() => {
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const hasReport = MOCK_EMOTION_TREND.find(t => t.date === `${currentMonth + 1}/${d}`)
      days.push({
        day: d,
        date: dateStr,
        mood: hasReport?.mood || null,
        hasReport: !!hasReport,
      })
    }
    return days
  }, [currentYear, currentMonth, daysInMonth, firstDay])

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const tabs = [
    { id: 'calendar', label: '日历', icon: Calendar },
    { id: 'trend', label: '趋势', icon: TrendingUp },
    { id: 'issues', label: '问题', icon: BarChart3 },
    { id: 'level', label: '等级', icon: Award },
  ]

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-xl font-bold mb-1">成长记录</h1>
        <p className="text-sm text-gray-500">记录你的每一步成长</p>
      </div>

      <div className="px-6 flex gap-2 mb-4 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-panda-primary text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'calendar' && (
        <div className="px-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth}><ChevronLeft size={20} /></button>
              <h3 className="font-bold">{currentYear}年{currentMonth + 1}月</h3>
              <button onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />
                const isToday = day.date === new Date().toISOString().split('T')[0]
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`relative p-2 rounded-lg text-center transition ${
                      isToday ? 'bg-panda-primary/10 ring-1 ring-panda-primary' : ''
                    } ${selectedDate === day.date ? 'bg-panda-primary/20' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`text-sm ${isToday ? 'font-bold text-panda-primary' : ''}`}>
                      {day.day}
                    </span>
                    {day.mood && (
                      <div className="text-xs mt-0.5">
                        {day.mood === 'happy' ? '😊' : day.mood === 'calm' ? '😌' : '😔'}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mt-3"
            >
              <h4 className="font-bold mb-2">{selectedDate}</h4>
              <p className="text-sm text-gray-500">情绪指数：62/100</p>
              <p className="text-sm text-gray-500">熊猫状态：平静小熊 😌</p>
              <p className="text-sm text-gray-500">对话时长：15 分钟</p>
            </motion.div>
          )}
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="px-6 space-y-4">
          <div className="card">
            <h3 className="font-bold mb-4">情绪变化趋势</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MOCK_EMOTION_TREND}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="index" stroke="#FF8C42" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-bold mb-4">训练效果对比</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MOCK_TRAINING_EFFECT}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="before" stroke="#D3D3D3" strokeWidth={2} name="训练前" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="after" stroke="#4ECDC4" strokeWidth={2} name="训练后" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="px-6">
          <div className="card">
            <h3 className="font-bold mb-4">高频问题来源</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={MOCK_ISSUES}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {MOCK_ISSUES.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {MOCK_ISSUES.map((issue, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: issue.color }} />
                  {issue.name} {issue.value}%
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'level' && (
        <div className="px-6 space-y-4">
          <div className="card text-center">
            <div className="text-5xl mb-3">{currentLevel.emoji}</div>
            <h3 className="text-xl font-bold mb-1">{currentLevel.label}</h3>
            <p className="text-sm text-gray-500">{currentLevel.desc}</p>
            <p className="text-xs text-gray-400 mt-2">已陪伴 {interactionDays} 天</p>
            <div className="progress-bar mt-4">
              <div className="progress-bar-fill" style={{ width: `${interactionDays / 90 * 100}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">距离下一等级还需 {currentLevel.max - interactionDays} 天</p>
          </div>

          <div className="space-y-2">
            {INTERACTION_LEVELS.map((level, i) => (
              <div
                key={i}
                className={`card flex items-center gap-3 ${
                  interactionDays >= level.min ? '' : 'opacity-40'
                }`}
              >
                <span className="text-2xl">{level.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{level.label}</p>
                  <p className="text-xs text-gray-500">{level.min}-{level.max}天 · {level.desc}</p>
                </div>
                {interactionDays >= level.min && interactionDays <= level.max && (
                  <span className="text-xs bg-panda-primary text-white px-2 py-1 rounded-full">当前</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 mt-6 mb-6">
        <div className="card bg-gradient-to-r from-panda-light to-orange-50">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}/panda-happy.jpg`} alt="Panda" className="rounded-full" style={{ width: 40, height: 40, objectFit: 'cover' }} />
            <div>
              <p className="text-sm font-medium">📬 每 7 天提醒</p>
              <p className="text-xs text-gray-500">"{user.name || '朋友'}，我又长大了一点，更了解你了。点击【成长记录】可以查看你的成长记录哦"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
