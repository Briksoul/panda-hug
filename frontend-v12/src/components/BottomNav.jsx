import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart, Eye, Dumbbell, BookOpen, Users } from 'lucide-react'

const tabs = [
  { path: '/emotion', label: '懂你情绪', icon: Heart },
  { path: '/report', label: '看见自己', icon: Eye },
  { path: '/training', label: '一起训练', icon: Dumbbell },
  { path: '/growth', label: '成长记录', icon: BookOpen },
  { path: '/community', label: '互助社区', icon: Users },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

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
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span>{tab.label}</span>
          </div>
        )
      })}
    </div>
  )
}
