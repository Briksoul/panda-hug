import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import RegisterPage from './pages/RegisterPage'
import EmotionPage from './pages/EmotionPage'
import ReportPage from './pages/ReportPage'
import TrainingPage from './pages/TrainingPage'
import GrowthPage from './pages/GrowthPage'
import CommunityPage from './pages/CommunityPage'
import ChatPage from './pages/ChatPage'
import BottomNav from './components/BottomNav'
import { UserProvider, useUser } from './hooks/useUser'

function AppRoutes() {
  const { user } = useUser()
  const location = useLocation()
  const hideNav = ['/', '/register', '/chat'].includes(location.pathname)

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/emotion" element={<EmotionPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/growth" element={<GrowthPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
      {!hideNav && user && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  )
}
