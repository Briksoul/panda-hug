import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../hooks/useUser'
import { User, AtSign, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import { registerAccount } from '../utils/api'

const CULTURE_OPTIONS = [
  { id: 'china_in_us', label: '在美求学的中国学生', en: 'Chinese student studying in the U.S.', emoji: '🇨🇳🇺🇸' },
  { id: 'us_in_china', label: '在华求学的美国学生', en: 'American student studying in China', emoji: '🇺🇸🇨🇳' },
  { id: 'other', label: '其他', en: 'Other', emoji: '🌍' },
]

const LANGUAGE_KEY = 'panda_ui_language'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuthenticatedUser } = useUser()
  const [step, setStep] = useState(0) // 0=register, 1=culture
  const [form, setForm] = useState({ name: '', contact: '', password: '' })
  const [cultureTag, setCultureTag] = useState(null)
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isEnglish = language === 'en'

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const selectLanguage = (nextLanguage) => {
    setLanguage(nextLanguage)
    setError('')
    localStorage.setItem(LANGUAGE_KEY, nextLanguage)
  }

  const handleRegister = () => {
    if (!form.name.trim() || !form.password) {
      setError(isEnglish
        ? 'Enter a username and password.'
        : '请填写用户名和密码。')
      return
    }
    setError('')
    setStep(1)
  }

  const handleComplete = async () => {
    if (!cultureTag) return
    setSubmitting(true)
    setError('')
    try {
      const data = await registerAccount({
        username: form.name,
        password: form.password,
        name: form.name,
        phone: form.contact.includes('@') ? '' : form.contact,
        email: form.contact.includes('@') ? form.contact : '',
        cultural_identity: cultureTag,
        language,
        study_abroad_months: 0,
      })
      setAuthenticatedUser(data.user)
      navigate('/emotion')
    } catch {
      setError(isEnglish ? 'Registration failed. Please try again later.' : '注册失败，请稍后再试。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col px-6 py-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mr-3"
            aria-label={isEnglish ? 'Go back' : '返回'}
          >
            <ArrowLeft size={24} className="text-gray-500" />
          </button>
        )}
        <div className="flex-1">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${(step + 1) * 50}%` }} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="register"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center mb-8">
              <img src={`${import.meta.env.BASE_URL}panda-icon-v2.png`} alt="Panda" className="rounded-full mx-auto mb-3" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 24px rgba(255,140,66,0.2)' }} />
              <h2 className="text-xl font-bold">{isEnglish ? 'Create your account' : '创建你的账号'}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEnglish ? 'Help Panda get to know you' : '让 Panda 认识你'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder={isEnglish ? 'Username (any format)' : '用户名（格式不限）'}
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-panda-primary focus:outline-none transition"
                />
              </div>
              <div className="relative">
                <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={isEnglish ? 'Phone / email (optional)' : '手机号码 / 邮箱（选填）'}
                  value={form.contact}
                  onChange={e => updateForm('contact', e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-panda-primary focus:outline-none transition"
                />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={isEnglish ? 'Password (any non-empty value)' : '密码（任意内容）'}
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-panda-primary focus:outline-none transition"
                />
              </div>
            </div>

            <div className="mt-auto pt-6">
              {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}
              <button
                onClick={handleRegister}
                className="w-full py-4 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
              >
                {isEnglish ? 'Next' : '下一步'} <ArrowRight size={20} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="mt-3 w-full text-sm text-gray-500"
              >
                {isEnglish ? 'Already have an account? Log in' : '已有账号？直接登录'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="culture"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center mb-8">
              <img src={`${import.meta.env.BASE_URL}panda-icon-v2.png`} alt="Panda" className="rounded-full mx-auto mb-3" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 24px rgba(78,205,196,0.2)' }} />
              <h2 className="text-xl font-bold">{isEnglish ? 'Who are you?' : '你是？'}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEnglish ? 'Help Panda understand your cultural background' : '帮助 Panda 了解你的文化背景'}
              </p>
            </div>

            <div className="space-y-3">
              {CULTURE_OPTIONS.map(opt => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCultureTag(opt.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition ${
                    cultureTag === opt.id
                      ? 'border-panda-primary bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-medium text-lg">{isEnglish ? opt.en : opt.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-600">
                {isEnglish ? 'Choose your language' : '选择使用语言'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'zh', label: '中文' },
                  { id: 'en', label: 'English' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => selectLanguage(option.id)}
                    className={`rounded-xl border-2 py-3 font-medium ${
                      language === option.id
                        ? 'border-panda-primary bg-orange-50 text-panda-primary'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6">
              {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}
              <button
                onClick={handleComplete}
                disabled={!cultureTag || submitting}
                className="w-full py-4 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white font-bold text-lg shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {submitting
                  ? (isEnglish ? 'Registering...' : '正在注册...')
                  : (isEnglish ? 'Complete registration 🎉' : '完成注册 🎉')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
