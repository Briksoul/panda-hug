import React from 'react'

// Panda face SVG component with different expressions
export function PandaFace({ mood = 'happy', size = 120, className = '' }) {
  const expressions = {
    happy: { eyeSize: 6, mouthCurve: 'M 35 65 Q 50 78 65 65', blush: true },
    calm: { eyeSize: 5, mouthCurve: 'M 38 65 Q 50 72 62 65', blush: false },
    tired: { eyeSize: 3, mouthCurve: 'M 40 68 Q 50 70 60 68', blush: false },
    sad: { eyeSize: 5, mouthCurve: 'M 38 72 Q 50 62 62 72', blush: false },
    thinking: { eyeSize: 5, mouthCurve: 'M 42 66 Q 50 68 58 66', blush: false },
  }
  const expr = expressions[mood] || expressions.happy

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {/* Face */}
      <circle cx="50" cy="50" r="42" fill="white" stroke="#E0D5C8" strokeWidth="2"/>
      {/* Ears */}
      <circle cx="20" cy="18" r="14" fill="#2D3436"/>
      <circle cx="80" cy="18" r="14" fill="#2D3436"/>
      <circle cx="20" cy="18" r="8" fill="#FFB6C1"/>
      <circle cx="80" cy="18" r="8" fill="#FFB6C1"/>
      {/* Eye patches */}
      <ellipse cx="35" cy="45" rx="14" ry="12" fill="#2D3436"/>
      <ellipse cx="65" cy="45" rx="14" ry="12" fill="#2D3436"/>
      {/* Eyes */}
      <circle cx="35" cy="45" r={expr.eyeSize} fill="white"/>
      <circle cx="65" cy="45" r={expr.eyeSize} fill="white"/>
      <circle cx="36" cy="44" r={expr.eyeSize * 0.5} fill="#2D3436"/>
      <circle cx="66" cy="44" r={expr.eyeSize * 0.5} fill="#2D3436"/>
      {/* Nose */}
      <ellipse cx="50" cy="56" rx="5" ry="3.5" fill="#2D3436"/>
      {/* Mouth */}
      <path d={expr.mouthCurve} fill="none" stroke="#2D3436" strokeWidth="2" strokeLinecap="round"/>
      {/* Blush */}
      {expr.blush && <>
        <circle cx="25" cy="58" r="6" fill="#FFB6C1" opacity="0.5"/>
        <circle cx="75" cy="58" r="6" fill="#FFB6C1" opacity="0.5"/>
      </>}
    </svg>
  )
}

// Bear mood icons for assessment results
export function BearMood({ mood = 'happy', size = 80 }) {
  const colors = {
    happy: { bg: '#FFE4B5', text: '😊' },
    calm: { bg: '#B0E0E6', text: '😌' },
    tired: { bg: '#D3D3D3', text: '😔' },
  }
  const c = colors[mood] || colors.happy

  return (
    <div style={{
      width: size, height: size,
      background: c.bg,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.5,
    }}>
      {c.text}
    </div>
  )
}
