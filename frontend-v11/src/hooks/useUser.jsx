import React, { createContext, useContext, useState, useEffect } from 'react'

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
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('panda_user')
    return saved ? JSON.parse(saved) : INITIAL_USER
  })

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
    localStorage.setItem('panda_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    localStorage.setItem('panda_emotion_history', JSON.stringify(emotionHistory))
  }, [emotionHistory])

  useEffect(() => {
    localStorage.setItem('panda_reports', JSON.stringify(reports))
  }, [reports])

  useEffect(() => {
    localStorage.setItem('panda_training', JSON.stringify(trainingHistory))
  }, [trainingHistory])

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }))

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
      user, updateUser,
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
