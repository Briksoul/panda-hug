import React from 'react'

const MOOD_IMAGES = {
  happy: `${import.meta.env.BASE_URL}panda-icon-v2.png`,
  calm: `${import.meta.env.BASE_URL}panda-icon-v2.png`,
  tired: `${import.meta.env.BASE_URL}panda-icon-v2.png`,
  sad: `${import.meta.env.BASE_URL}panda-icon-v2.png`,
  anxious: `${import.meta.env.BASE_URL}panda-icon-v2.png`,
  thinking: `${import.meta.env.BASE_URL}panda-icon-v2.png`,
}

export function PandaFace({ mood = 'happy', size = 120, className = '' }) {
  const src = MOOD_IMAGES[mood] || MOOD_IMAGES.happy

  return (
    <img
      src={src}
      alt={`Panda ${mood}`}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{
        width: size,
        height: size,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
      }}
    />
  )
}

export function BearMood({ mood = 'happy', size = 120, language = 'zh' }) {
  const src = MOOD_IMAGES[mood] || MOOD_IMAGES.happy
  const labels = {
    happy: language === 'en' ? '😊 Happy Panda' : '😊 开心小熊',
    calm: language === 'en' ? '😌 Calm Panda' : '😌 平静小熊',
    tired: language === 'en' ? '😔 Tired Panda' : '😔 疲惫小熊',
    sad: language === 'en' ? '😢 Sad Panda' : '😢 难过小熊',
    anxious: language === 'en' ? '😰 Anxious Panda' : '😰 焦虑小熊',
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={src}
        alt={`Bear ${mood}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))',
        }}
      />
      {labels[mood] && (
        <span className="text-sm font-medium text-gray-600">{labels[mood]}</span>
      )}
    </div>
  )
}
