import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    <div className="h-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
         style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFE8D0 40%, #FFD4B8 100%)' }}>
      
      {/* Decorative background circles */}
      <div className="deco-circle" style={{ width: 300, height: 300, background: '#FF8C42', top: -80, right: -80 }} />
      <div className="deco-circle" style={{ width: 200, height: 200, background: '#4ECDC4', bottom: -40, left: -60 }} />
      <div className="deco-circle" style={{ width: 120, height: 120, background: '#FFB347', top: '30%', left: -30 }} />

      {/* Floating stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{
            top: `${15 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          {['✨', '⭐', '💫', '🌟', '✧', '♡'][i]}
        </motion.div>
      ))}

      {/* 3D Panda */}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        className="mb-8 relative"
      >
        <div className="animate-float">
          <img
            src={`${import.meta.env.BASE_URL}panda-happy.jpg`}
            alt="Panda Hug"
            className="rounded-full"
            style={{
              width: 180,
              height: 180,
              objectFit: 'cover',
              filter: 'drop-shadow(0 20px 40px rgba(255,140,66,0.3))',
              border: '4px solid rgba(255,255,255,0.8)',
            }}
          />
        </div>
        {/* Glowing ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse-soft"
          style={{
            background: 'radial-gradient(circle, rgba(255,140,66,0.15) 0%, transparent 70%)',
            transform: 'scale(1.3)',
          }}
        />
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold mb-3" style={{ color: '#2D3436' }}>
          Hi，我是 <span style={{ color: '#FF8C42' }}>Panda</span>！
        </h1>
        <p className="text-base leading-relaxed max-w-xs mx-auto" style={{ color: '#666' }}>
          无论你是在大洋彼岸求学的中国学子，<br/>
          还是来到中国探索的美国朋友，<br/>
          当你开心、疲惫、焦虑、迷茫的时候，<br/>
          我都会在这里陪伴你。
        </p>
        <p className="text-sm mt-4" style={{ color: '#aaa' }}>
          在接下来的交流中，我会陪你一起理解情绪、整理思绪、寻找力量。
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/register')}
        className="btn-primary w-64 text-lg"
        style={{ borderRadius: 50 }}
      >
        开始旅程 ✨
      </motion.button>

      {/* Bottom tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 text-xs"
        style={{ color: '#bbb' }}
      >
        Powered by AI · 你的专属情绪陪伴
      </motion.p>
    </div>
  )
}
