import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart, Eye, Dumbbell, BookOpen, Users } from 'lucide-react'
import { useUser } from '../hooks/useUser'

const tabs = [
  {
    path: '/emotion',
    label: { zh: '懂你情绪', en: 'Emotions' },
    icon: Heart,
    color: '#F97316',
    background: '#FFF7ED',
  },
  {
    path: '/report',
    label: { zh: '看见自己', en: 'Insights' },
    icon: Eye,
    color: '#3B82F6',
    background: '#EFF6FF',
  },
  {
    path: '/training',
    label: { zh: '一起训练', en: 'Training' },
    icon: Dumbbell,
    color: '#A855F7',
    background: '#FAF5FF',
  },
  {
    path: '/growth',
    label: { zh: '成长记录', en: 'Growth' },
    icon: BookOpen,
    color: '#14B8A6',
    background: '#F0FDFA',
  },
  {
    path: '/community',
    label: { zh: '互助社区', en: 'Community' },
    icon: Users,
    color: '#F43F5E',
    background: '#FFF1F2',
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const language = user?.language === 'en' ? 'en' : 'zh'

  return (
    <div className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon
        const active = location.pathname === tab.path
        return (
          <div
            key={tab.path}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            style={{
              color: tab.color,
              background: active ? tab.background : 'transparent',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span>{tab.label[language]}</span>
          </div>
        )
      })}
    </div>
  )
}
