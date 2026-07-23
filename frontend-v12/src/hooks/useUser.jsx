import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getCurrentUser,
  logoutAccount,
  updateLanguagePreference,
} from '../utils/api'

const UserContext = createContext(null)

const INITIAL_USER = {
  id: null,
  name: '',
  avatar: '',
  cultureTag: null, // 'china_in_us' | 'us_in_china' | 'other'
  phone: '',
  email: '',
  registered: false,
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(INITIAL_USER)
  const [authLoading, setAuthLoading] = useState(true)

  const [emotionHistory, setEmotionHistory] = useState(() => {
    const saved = localStorage.getItem('panda_emotion_history')
    return saved ? JSON.parse(saved) : []
  })

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('panda_reports')
    return saved ? JSON.parse(saved) : []
  })

  const [trainingHistory, setTrainingHistory] = useState(() => {
    const saved = localStorage.getItem('panda_training')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    let cancelled = false
    getCurrentUser()
      .then((data) => {
        if (!cancelled) {
          const restoredUser = data?.user || INITIAL_USER
          setUser(restoredUser)
          if (restoredUser.language) {
            localStorage.setItem('panda_ui_language', restoredUser.language)
          }
        }
      })
      .catch(() => {
        if (!cancelled) setUser(INITIAL_USER)
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })
    localStorage.removeItem('panda_user')
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('panda_emotion_history', JSON.stringify(emotionHistory))
  }, [emotionHistory])

  useEffect(() => {
    localStorage.setItem('panda_reports', JSON.stringify(reports))
  }, [reports])

  useEffect(() => {
    localStorage.setItem('panda_training', JSON.stringify(trainingHistory))
  }, [trainingHistory])

  const setAuthenticatedUser = (authenticatedUser) => {
    setUser(authenticatedUser || INITIAL_USER)
    if (authenticatedUser?.language) {
      localStorage.setItem('panda_ui_language', authenticatedUser.language)
    }
    setAuthLoading(false)
  }

  const logout = async () => {
    await logoutAccount()
    setUser(INITIAL_USER)
    localStorage.removeItem('panda_session_id')
  }

  const changeLanguage = async (language) => {
    const data = await updateLanguagePreference(language)
    setUser(data.user)
    localStorage.setItem('panda_ui_language', language)
    return data.user
  }

  const addEmotionRecord = (record) => {
    setEmotionHistory(prev => [...prev, { ...record, timestamp: Date.now() }])
  }

  const addReport = (report) => {
    setReports(prev => [...prev, { ...report, timestamp: Date.now() }])
  }

  const addTrainingRecord = (record) => {
    setTrainingHistory(prev => [...prev, { ...record, timestamp: Date.now() }])
  }

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated: Boolean(user.id),
      authLoading,
      setAuthenticatedUser,
      changeLanguage,
      logout,
      emotionHistory, addEmotionRecord,
      reports, addReport,
      trainingHistory, addTrainingRecord,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
