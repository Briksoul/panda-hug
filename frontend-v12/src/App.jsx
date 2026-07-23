import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import EmotionPage from './pages/EmotionPage'
import ReportPage from './pages/ReportPage'
import TrainingPage from './pages/TrainingPage'
import GrowthPage from './pages/GrowthPage'
import CommunityPage from './pages/CommunityPage'
import ChatPage from './pages/ChatPage'
import BottomNav from './components/BottomNav'
import LanguageSwitch from './components/LanguageSwitch'
import ProtectedRoute from './components/ProtectedRoute'
import { UserProvider, useUser } from './hooks/useUser'

function AppRoutes() {
  const { isAuthenticated } = useUser()
  const location = useLocation()
  const hideNav = ['/', '/register', '/login', '/chat'].includes(location.pathname)

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/emotion" element={<ProtectedRoute><EmotionPage /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
        <Route path="/growth" element={<ProtectedRoute><GrowthPage /></ProtectedRoute>} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      </Routes>
      {isAuthenticated && !['/', '/register', '/login'].includes(location.pathname) && (
        <LanguageSwitch />
      )}
      {!hideNav && isAuthenticated && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/pandahug">
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  )
}
