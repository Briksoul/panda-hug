import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, User } from 'lucide-react'
import { useUser } from '../hooks/useUser'
import { loginAccount } from '../utils/api'

const LANGUAGE_KEY = 'panda_ui_language'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setAuthenticatedUser } = useUser()
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isEnglish = language === 'en'

  const selectLanguage = (nextLanguage) => {
    setLanguage(nextLanguage)
    setError('')
    localStorage.setItem(LANGUAGE_KEY, nextLanguage)
  }

  useEffect(() => {
    if (isAuthenticated) navigate('/emotion', { replace: true })
  }, [isAuthenticated, navigate])

  const handleLogin = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password) return
    setSubmitting(true)
    setError('')
    try {
      const data = await loginAccount(username.trim(), password)
      setAuthenticatedUser(data.user)
      navigate('/emotion', { replace: true })
    } catch {
      setError(isEnglish ? 'Login failed. Please check your username and password.' : '登录失败，请检查账号和密码。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative h-full overflow-y-auto px-6 py-8">
      <div className="absolute right-5 top-5 z-10 flex rounded-full bg-white p-1 text-xs shadow-sm">
        {['zh', 'en'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => selectLanguage(option)}
            className={`rounded-full px-3 py-1.5 font-medium ${
              language === option ? 'bg-panda-primary text-white' : 'text-gray-500'
            }`}
          >
            {option === 'zh' ? '中文' : 'EN'}
          </button>
        ))}
      </div>
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="mx-auto flex min-h-full max-w-sm flex-col justify-center"
      >
        <div className="mb-8 text-center">
          <img
            src={`${import.meta.env.BASE_URL}panda-icon.svg`}
            alt="Panda"
            className="mx-auto mb-3 rounded-full"
            style={{ width: 88, height: 88, objectFit: 'cover' }}
          />
          <h1 className="text-2xl font-bold">{isEnglish ? 'Welcome back' : '欢迎回来'}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEnglish ? 'Log in to continue your journey' : '登录后继续你的陪伴记录'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={isEnglish ? 'Username' : '用户名'}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 focus:border-panda-primary focus:outline-none"
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isEnglish ? 'Password' : '密码'}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 focus:border-panda-primary focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!username.trim() || !password || submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm py-4 text-lg font-bold text-white shadow-lg shadow-orange-200 disabled:opacity-50"
        >
          {submitting
            ? (isEnglish ? 'Logging in...' : '正在登录...')
            : (isEnglish ? 'Log in' : '登录')}{' '}
          <ArrowRight size={20} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="mt-4 text-sm text-gray-500"
        >
          {isEnglish ? 'No account yet? Create one' : '还没有账号？创建账号'}
        </button>
      </motion.form>
    </div>
  )
}
