import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PandaFace } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'
import { User, Phone, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'

const CULTURE_OPTIONS = [
  { id: 'china_in_us', label: '在美求学的中国学生', emoji: '🇨🇳🇺🇸' },
  { id: 'us_in_china', label: '在华求学的美国学生', emoji: '🇺🇸🇨🇳' },
  { id: 'other', label: '其他', emoji: '🌍' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { updateUser } = useUser()
  const [step, setStep] = useState(0) // 0=register, 1=culture
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [cultureTag, setCultureTag] = useState(null)

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleRegister = () => {
    if (!form.name || !form.password) return
    setStep(1)
  }

  const handleComplete = () => {
    if (!cultureTag) return
    updateUser({
      ...form,
      cultureTag,
      registered: true,
      id: 'user_' + Date.now(),
    })
    navigate('/emotion')
  }

  return (
    <div className="h-full flex flex-col px-6 py-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="mr-3">
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
              <img src={`${import.meta.env.BASE_URL}panda-happy.jpg`} alt="Panda" className="rounded-full mx-auto mb-3" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 24px rgba(255,140,66,0.2)' }} />
              <h2 className="text-xl font-bold">创建你的账号</h2>
              <p className="text-sm text-gray-500 mt-1">让 Panda 认识你</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="用户名"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-panda-primary focus:outline-none transition"
                />
              </div>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  placeholder="手机号码（选填）"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-panda-primary focus:outline-none transition"
                />
              </div>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="邮箱（选填）"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-panda-primary focus:outline-none transition"
                />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="密码"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-panda-primary focus:outline-none transition"
                />
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={handleRegister}
                disabled={!form.name || !form.password}
                className="w-full py-4 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white font-bold text-lg shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                下一步 <ArrowRight size={20} />
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
              <img src={`${import.meta.env.BASE_URL}panda-calm.jpg`} alt="Panda" className="rounded-full mx-auto mb-3" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 24px rgba(78,205,196,0.2)' }} />
              <h2 className="text-xl font-bold">你是？</h2>
              <p className="text-sm text-gray-500 mt-1">帮助 Panda 了解你的文化背景</p>
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
                  <span className="font-medium text-lg">{opt.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={handleComplete}
                disabled={!cultureTag}
                className="w-full py-4 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white font-bold text-lg shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                完成注册 🎉
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
