import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PandaFace } from '../components/PandaFace'
import { useUser } from '../hooks/useUser'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { user } = useUser()

  useEffect(() => {
    if (user.registered) {
      navigate('/emotion')
    }
  }, [user.registered])

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-gradient-to-b from-panda-bg to-panda-light">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="mb-8"
      >
        <div className="animate-float">
          <PandaFace mood="happy" size={160} />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-bold text-panda-dark mb-4">
          Hi，我是 Panda！
        </h1>
        <p className="text-base text-gray-600 leading-relaxed max-w-xs">
          无论你是在大洋彼岸求学的中国学子，<br/>
          还是来到中国探索的美国朋友，<br/>
          当你开心、疲惫、焦虑、迷茫的时候，<br/>
          我都会在这里陪伴你。
        </p>
        <p className="text-sm text-gray-400 mt-4">
          在接下来的交流中，我会陪你一起理解情绪、整理思绪、寻找力量。
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/register')}
        className="w-64 py-4 rounded-full bg-gradient-to-r from-panda-primary to-panda-warm text-white font-bold text-lg shadow-lg shadow-orange-200"
      >
        开始旅程 ✨
      </motion.button>
    </div>
  )
}
