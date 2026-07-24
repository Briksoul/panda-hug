import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Calendar, TrendingUp, BarChart3, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getGrowthRecord,
  getLatestSession,
  getMedicalRegions,
  getMedicalResources,
} from '../utils/api'
import { useUser } from '../hooks/useUser'

const ISSUE_COLORS = ['#FF8C42', '#4ECDC4', '#87CEEB', '#FFB347', '#A78BFA', '#D3D3D3']
const ISSUE_LABELS_EN = {
  '学业与工作': 'Study and work',
  '人际与社交': 'Relationships and social life',
  '家庭与期待': 'Family and expectations',
  '文化适应': 'Cultural adaptation',
  '孤独与归属': 'Loneliness and belonging',
  '情绪与睡眠': 'Mood and sleep',
}
const BEAR_STATUS_EN = {
  '暂无记录': 'No record',
  '需要守护': 'Needs support',
  '有些低落': 'Feeling low',
  '略显疲惫': 'A little tired',
  '比较平静': 'Calm',
  '充满活力': 'Energetic',
}

function shortDate(value) {
  if (!value) return ''
  const [, month, day] = value.split('-')
  return `${Number(month)}/${Number(day)}`
}

const INTERACTION_LEVELS = [
  {
    min: 1,
    max: 14,
    zhLabel: '初识新芽',
    enLabel: 'New Sprout',
    emoji: '🌱',
    zhDesc: '一颗新芽，代表我们刚开始了解彼此',
    enDesc: 'A new sprout as we begin to know each other',
  },
  {
    min: 15,
    max: 30,
    zhLabel: '信任枝桠',
    enLabel: 'Branch of Trust',
    emoji: '🌿',
    zhDesc: '长出枝桠，信任正在慢慢建立',
    enDesc: 'A growing branch as trust takes shape',
  },
  {
    min: 31,
    max: 60,
    zhLabel: '陪伴之树',
    enLabel: 'Companion Tree',
    emoji: '🌳',
    zhDesc: '成为一棵树，更深入地理解你的世界',
    enDesc: 'A strong tree that understands your world more deeply',
  },
  {
    min: 61,
    max: 90,
    zhLabel: '灵魂知己',
    enLabel: 'Kindred Spirit',
    emoji: '🌳🌳',
    zhDesc: '两棵相伴的树，代表彼此理解的灵魂知己',
    enDesc: 'Two trees together, representing a deeply understood bond',
  },
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function GrowthPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const isEnglish = user.language === 'en'
  const [activeTab, setActiveTab] = useState('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [growth, setGrowth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [careCountry, setCareCountry] = useState(
    user.cultureTag === 'china_in_us' ? 'US' : 'CN',
  )
  const [careRegion, setCareRegion] = useState('')
  const [careRegions, setCareRegions] = useState([])
  const [careResources, setCareResources] = useState([])
  const [careDisclaimer, setCareDisclaimer] = useState('')
  const [careLoading, setCareLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadGrowth = async () => {
      const localSessionId = localStorage.getItem('panda_session_id')
      const sessionId = localSessionId || (await getLatestSession()).session_id
      if (!sessionId) return null
      localStorage.setItem('panda_session_id', sessionId)
      return getGrowthRecord(sessionId)
    }
    loadGrowth()
      .then((data) => {
        if (!cancelled && data) setGrowth(data)
      })
      .catch(() => {
        if (!cancelled) {
          setError(isEnglish
            ? 'Growth records are temporarily unavailable. Complete a conversation and try again.'
            : '成长记录暂时无法加载，请先完成一次对话后再试。')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEnglish])

  useEffect(() => {
    if (!growth?.care_alert?.triggered) return
    getMedicalRegions(careCountry)
      .then((data) => {
        setCareRegions(data.regions || [])
        setCareRegion('')
        setCareResources([])
      })
      .catch((requestError) => {
        console.error('Failed to load medical regions:', requestError)
      })
  }, [careCountry, growth?.care_alert?.triggered])

  const findCareResources = async () => {
    if (!careRegion) return
    setCareLoading(true)
    try {
      const data = await getMedicalResources({
        country: careCountry,
        region: careRegion,
      })
      setCareResources(data.resources || [])
      setCareDisclaimer(data.disclaimer || '')
    } catch (requestError) {
      console.error('Failed to load medical resources:', requestError)
    } finally {
      setCareLoading(false)
    }
  }

  const emotionTrend = useMemo(
    () => (growth?.emotion_trend || []).map((item) => ({
      date: shortDate(item.date),
      index: item.distress_index,
      mood: item.sentiment,
    })),
    [growth],
  )
  const trainingEffect = useMemo(
    () => (growth?.training_effects || []).map((item) => ({
      date: shortDate(item.date),
      before: item.before?.distress_index ?? null,
      after: item.after?.distress_index ?? null,
    })),
    [growth],
  )
  const issues = useMemo(() => {
    const distribution = growth?.issue_distribution || []
    const total = distribution.reduce((sum, item) => sum + Number(item.count || 0), 0)
    return distribution.map((item, index) => ({
      name: isEnglish
        ? (ISSUE_LABELS_EN[item.category] || item.category)
        : item.category,
      value: total ? Math.round((Number(item.count || 0) / total) * 100) : 0,
      color: ISSUE_COLORS[index % ISSUE_COLORS.length],
    }))
  }, [growth, isEnglish])
  const calendarRecords = useMemo(
    () => new Map((growth?.calendar || []).map((item) => [item.date, item])),
    [growth],
  )
  const interactionDays = growth?.metrics?.interaction_days || 1
  const currentLevel = INTERACTION_LEVELS.find(
    (level) => interactionDays >= level.min && interactionDays <= level.max,
  ) || INTERACTION_LEVELS[INTERACTION_LEVELS.length - 1]

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarDays = useMemo(() => {
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const record = calendarRecords.get(dateStr)
      days.push({
        day: d,
        date: dateStr,
        mood: record?.bear_status || null,
        hasReport: Boolean(record),
        record,
      })
    }
    return days
  }, [calendarRecords, currentYear, currentMonth, daysInMonth, firstDay])

  const selectedRecord = selectedDate ? calendarRecords.get(selectedDate) : null
  const hasGrowthData = Boolean(
    growth
    && (
      growth.metrics?.interaction_count > 0
      || growth.metrics?.training_count > 0
      || growth.metrics?.report_count > 0
      || growth.calendar?.length > 0
    )
  )

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const tabs = [
    { id: 'calendar', label: isEnglish ? 'Calendar' : '日历', icon: Calendar },
    { id: 'trend', label: isEnglish ? 'Trends' : '趋势', icon: TrendingUp },
    { id: 'issues', label: isEnglish ? 'Topics' : '问题', icon: BarChart3 },
    { id: 'level', label: isEnglish ? 'Bond' : '亲密度', icon: Award },
  ]

  if (!loading && growth && !hasGrowthData) {
    return (
      <div className="h-full overflow-y-auto pb-20">
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-xl font-bold mb-1">
            {isEnglish ? 'Growth Record' : '成长记录'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEnglish ? 'Track every step of your growth' : '记录你的每一步成长'}
          </p>
        </div>
        <div className="flex min-h-[65dvh] items-center justify-center px-6">
          <div className="card w-full text-center">
            <Calendar size={42} className="mx-auto text-gray-300" />
            <h2 className="mt-4 text-lg font-bold text-gray-700">
              {isEnglish ? 'No growth records yet' : '还没有成长记录'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isEnglish
                ? 'Your progress will appear here after an emotion check-in, conversation, or exercise.'
                : '完成情绪记录、对话或训练后，这里才会开始展示真实变化。'}
            </p>
            <button
              onClick={() => navigate('/emotion')}
              className="mt-5 rounded-full bg-panda-primary px-6 py-3 font-bold text-white"
            >
              {isEnglish ? 'Back to Emotions' : '返回懂你情绪'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-xl font-bold mb-1">
          {isEnglish ? 'Growth Record' : '成长记录'}
        </h1>
        <p className="text-sm text-gray-500">
          {isEnglish ? 'Track every step of your growth' : '记录你的每一步成长'}
        </p>
      </div>

      {loading && (
        <div className="mx-6 mb-4 rounded-xl bg-white p-4 text-center text-sm text-gray-400">
          {isEnglish ? 'Loading growth records...' : '正在加载成长记录...'}
        </div>
      )}
      {!loading && !growth && (
        <div className="mx-6 mb-4 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
          {error || (isEnglish
            ? 'Your growth will be recorded here after you complete a conversation.'
            : '完成一次对话后，这里会开始记录你的成长变化。')}
        </div>
      )}
      {growth?.care_alert?.triggered && (
        <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-bold text-red-700">
            {isEnglish ? 'Ongoing Low Mood Care Alert' : '持续低落关怀提醒'}
          </p>
          <p className="mt-1 text-sm text-red-600">
            {isEnglish ? 'Low mood has continued for 14 consecutive days.' : growth.care_alert.reason}
          </p>
          <p className="mt-2 text-sm font-medium text-gray-700">
            {isEnglish
              ? 'Choose your current region to view professional resources.'
              : '请选择当前所在地区，查看专业支持资源。'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              value={careCountry}
              onChange={(event) => setCareCountry(event.target.value)}
              className="rounded-lg border border-red-100 bg-white px-2 py-2 text-sm"
            >
              <option value="CN">{isEnglish ? 'China' : '中国'}</option>
              <option value="US">{isEnglish ? 'United States' : '美国'}</option>
              <option value="CA">{isEnglish ? 'Canada' : '加拿大'}</option>
            </select>
            <select
              value={careRegion}
              onChange={(event) => setCareRegion(event.target.value)}
              className="rounded-lg border border-red-100 bg-white px-2 py-2 text-sm"
            >
              <option value="">
                {isEnglish ? 'Select region' : '选择地区'}
              </option>
              {careRegions.map((region) => (
                <option key={`${region.country}-${region.region}`} value={region.region}>
                  {isEnglish ? region.region : region.region_zh || region.region}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={findCareResources}
            disabled={!careRegion || careLoading}
            className="mt-3 w-full rounded-full bg-red-600 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {careLoading
              ? (isEnglish ? 'Loading...' : '正在查询...')
              : (isEnglish ? 'Find support resources' : '查找支持资源')}
          </button>
          {careResources.length > 0 && (
            <div className="mt-4 space-y-3">
              {careResources.map((resource) => (
                <div key={resource.id} className="rounded-xl bg-white p-3">
                  <p className="font-bold text-gray-800">{resource.name}</p>
                  {resource.organization && (
                    <p className="text-xs text-gray-500">{resource.organization}</p>
                  )}
                  {resource.phones?.length > 0 && (
                    <p className="mt-2 text-sm text-gray-700">
                      {isEnglish ? 'Phone' : '电话'}: {resource.phones.join(' / ')}
                    </p>
                  )}
                  {resource.emails?.length > 0 && (
                    <p className="break-all text-sm text-gray-700">
                      Email: {resource.emails.join(' / ')}
                    </p>
                  )}
                  {resource.specialties?.length > 0 && (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      {resource.specialties.slice(0, 3).join(' · ')}
                    </p>
                  )}
                  {resource.source_url && (
                    <a
                      href={resource.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-panda-primary underline"
                    >
                      {isEnglish ? 'Verify source' : '查看并核验来源'}
                    </a>
                  )}
                </div>
              ))}
              <p className="text-xs leading-relaxed text-gray-500">
                {careDisclaimer}
              </p>
            </div>
          )}
          {!careLoading && careRegion && careResources.length === 0 && careDisclaimer && (
            <p className="mt-3 text-xs text-gray-500">
              {isEnglish
                ? 'No matching resources were found for this region.'
                : '当前地区暂未找到匹配资源。'}
            </p>
          )}
        </div>
      )}

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
              <h3 className="font-bold">
                {isEnglish
                  ? new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                  : `${currentYear}年${currentMonth + 1}月`}
              </h3>
              <button onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {(isEnglish
                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                : ['日', '一', '二', '三', '四', '五', '六']).map(d => (
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
                        {day.mood.includes('活力') ? '😊' : day.mood.includes('平静') ? '😌' : '😔'}
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
              {selectedRecord ? (
                <>
                  <p className="text-sm text-gray-500">
                    {isEnglish ? 'Distress index' : '困扰指数'}:{' '}
                    {selectedRecord.average_distress ?? (isEnglish ? 'N/A' : '暂无')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isEnglish ? 'Panda status' : 'Panda 状态'}:{' '}
                    {isEnglish
                      ? (BEAR_STATUS_EN[selectedRecord.bear_status] || selectedRecord.bear_status)
                      : selectedRecord.bear_status}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isEnglish ? 'Emotion check-ins' : '情绪记录'}{' '}
                    {selectedRecord.assessment_count || 0}
                    {isEnglish ? '' : ' 次'} · {isEnglish ? 'Insight reports' : '洞察报告'}{' '}
                    {selectedRecord.report_count || 0}
                    {isEnglish ? '' : ' 份'} · {isEnglish ? 'Completed exercises' : '完成训练'}{' '}
                    {selectedRecord.training_count || 0}
                    {isEnglish ? '' : ' 次'}
                  </p>
                  {selectedRecord.report_count > 0 && (
                    <button
                      onClick={() => navigate('/report', {
                        state: { date: selectedDate },
                      })}
                      className="mt-3 rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-panda-primary"
                    >
                      {isEnglish ? 'View This Day’s Insight Report' : '查看当天洞察报告'}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  {isEnglish ? 'No growth record for this day.' : '这一天还没有成长记录。'}
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="px-6 space-y-4">
          <div className="card">
            <h3 className="font-bold mb-1">
              {isEnglish ? 'Distress Index Over Time' : '困扰指数变化'}
            </h3>
            <p className="mb-4 text-xs text-gray-400">
              {isEnglish
                ? 'Lower values indicate a more stable overall state'
                : '数值越低，表示整体状态越平稳'}
            </p>
            {emotionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={emotionTrend}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#FF8C42"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={isEnglish ? 'Distress index' : '困扰指数'}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">
                {isEnglish
                  ? 'Trends will appear after a few conversations'
                  : '完成几次对话后会出现趋势'}
              </p>
            )}
          </div>
          <div className="card">
            <h3 className="font-bold mb-4">
              {isEnglish ? 'Exercise Effect Comparison' : '训练效果对比'}
            </h3>
            {trainingEffect.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trainingEffect}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="before"
                    stroke="#D3D3D3"
                    strokeWidth={2}
                    name={isEnglish ? 'Before exercise' : '训练前困扰'}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="after"
                    stroke="#4ECDC4"
                    strokeWidth={2}
                    name={isEnglish ? 'After exercise' : '训练后困扰'}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">
                {isEnglish
                  ? 'Before-and-after changes will appear after an exercise'
                  : '完成训练后会显示前后变化'}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="px-6">
          <div className="card">
            <h3 className="font-bold mb-4">
              {isEnglish ? 'Frequent Topic Sources' : '高频问题来源'}
            </h3>
            {issues.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={issues}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {issues.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${value}%`,
                        isEnglish ? 'Share' : '占比',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {issues.map((issue) => (
                    <div key={issue.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ background: issue.color }} />
                      {issue.name} {issue.value}%
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">
                {isEnglish
                  ? 'A distribution will appear once consistent conversation topics emerge'
                  : '对话中形成稳定主题后会显示分布'}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'level' && (
        <div className="px-6 space-y-4">
          <div className="card text-center">
            <div className="text-5xl mb-3">{currentLevel.emoji}</div>
            <h3 className="text-xl font-bold mb-1">
              {isEnglish ? currentLevel.enLabel : currentLevel.zhLabel}
            </h3>
            <p className="text-sm text-gray-500">
              {isEnglish ? currentLevel.enDesc : currentLevel.zhDesc}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {isEnglish
                ? `${interactionDays} days together`
                : `已陪伴 ${interactionDays} 天`}
            </p>
            <p className="mt-4 text-sm font-bold text-panda-primary">
              {isEnglish ? 'Panda Bond' : 'Panda 亲密度'} · {Math.min(100, Math.round(interactionDays / 90 * 100))}%
            </p>
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, interactionDays / 90 * 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {currentLevel === INTERACTION_LEVELS[INTERACTION_LEVELS.length - 1]
                ? (isEnglish
                  ? 'You have reached the closest bond stage'
                  : '已达到当前最高亲密度阶段')
                : (isEnglish
                  ? `${currentLevel.max - interactionDays + 1} days to the next bond stage`
                  : `距离下一亲密度阶段还需 ${currentLevel.max - interactionDays + 1} 天`)}
            </p>
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
                  <p className="font-medium text-sm">
                    {isEnglish ? level.enLabel : level.zhLabel}
                  </p>
                  <p className="text-xs text-gray-500">
                    {level.min}-{level.max} {isEnglish ? 'days' : '天'} ·{' '}
                    {isEnglish ? level.enDesc : level.zhDesc}
                  </p>
                </div>
                {interactionDays >= level.min && interactionDays <= level.max && (
                  <span className="text-xs bg-panda-primary text-white px-2 py-1 rounded-full">
                    {isEnglish ? 'Current' : '当前'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
