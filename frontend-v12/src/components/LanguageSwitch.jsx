import React, { useState } from 'react'
import { Languages } from 'lucide-react'
import { useUser } from '../hooks/useUser'

export default function LanguageSwitch() {
  const { user, changeLanguage } = useUser()
  const [updating, setUpdating] = useState(false)
  const language = user.language === 'en' ? 'en' : 'zh'

  const selectLanguage = async (nextLanguage) => {
    if (nextLanguage === language || updating) return
    setUpdating(true)
    try {
      await changeLanguage(nextLanguage)
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed bottom-20 right-3 z-[120] flex items-center gap-1 rounded-full border border-gray-200 bg-white/95 p-1 text-xs">
      <Languages size={14} className="ml-1 text-gray-400" />
      <button
        onClick={() => selectLanguage('zh')}
        disabled={updating}
        className={`rounded-full px-2 py-1 ${language === 'zh' ? 'bg-panda-primary text-white' : 'text-gray-500'}`}
      >
        中文
      </button>
      <button
        onClick={() => selectLanguage('en')}
        disabled={updating}
        className={`rounded-full px-2 py-1 ${language === 'en' ? 'bg-panda-primary text-white' : 'text-gray-500'}`}
      >
        EN
      </button>
    </div>
  )
}
