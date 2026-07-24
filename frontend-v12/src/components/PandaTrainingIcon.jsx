import React from 'react'

function PandaFace({ x = 32, y = 31, scale = 1, closedEyes = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) translate(-32 -31)`}>
      <circle cx="18" cy="18" r="8" fill="#303332" />
      <circle cx="46" cy="18" r="8" fill="#303332" />
      <ellipse cx="32" cy="32" rx="21" ry="19" fill="#FFFDF8" />
      <ellipse cx="23" cy="29" rx="7" ry="8.5" fill="#3A3D3C" transform="rotate(20 23 29)" />
      <ellipse cx="41" cy="29" rx="7" ry="8.5" fill="#3A3D3C" transform="rotate(-20 41 29)" />
      {closedEyes ? (
        <>
          <path d="M20 29c2 2 4 2 6 0" fill="none" stroke="#FFFDF8" strokeLinecap="round" strokeWidth="2" />
          <path d="M38 29c2 2 4 2 6 0" fill="none" stroke="#FFFDF8" strokeLinecap="round" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="23" cy="28.5" r="2.5" fill="#FFFDF8" />
          <circle cx="41" cy="28.5" r="2.5" fill="#FFFDF8" />
          <circle cx="23.7" cy="28" r="0.8" fill="#303332" />
          <circle cx="41.7" cy="28" r="0.8" fill="#303332" />
        </>
      )}
      <ellipse cx="17" cy="37" rx="3.5" ry="2" fill="#FFB7B1" opacity="0.85" />
      <ellipse cx="47" cy="37" rx="3.5" ry="2" fill="#FFB7B1" opacity="0.85" />
      <path d="M29.5 35.5Q32 33.5 34.5 35.5Q32 39 29.5 35.5Z" fill="#303332" />
      <path d="M27.5 40q4.5 4 9 0" fill="none" stroke="#303332" strokeLinecap="round" strokeWidth="1.8" />
    </g>
  )
}

function SensoryIcon() {
  return (
    <>
      <PandaFace y={33} scale={0.88} />
      <path d="M9 20l1.5 3.2L14 25l-3.5 1.6L9 30l-1.5-3.4L4 25l3.5-1.8Z" fill="#3BC8D4" />
      <path d="M54 8l1.3 2.7L58 12l-2.7 1.3L54 16l-1.3-2.7L50 12l2.7-1.3Z" fill="#64A8FF" />
      <circle cx="54" cy="45" r="2.5" fill="#FFD166" />
      <path d="M50 49q4-5 8 0" fill="none" stroke="#FF9E7A" strokeLinecap="round" strokeWidth="2" />
    </>
  )
}

function BreathIcon() {
  return (
    <>
      <PandaFace x={27} y={32} scale={0.84} closedEyes />
      <path d="M43 28c6-4 10-3 13 0 2 2 0 5-3 5h-8" fill="none" stroke="#668CF4" strokeLinecap="round" strokeWidth="2.8" />
      <path d="M45 38h10c4 0 5 4 2 6" fill="none" stroke="#8CA8FF" strokeLinecap="round" strokeWidth="2.8" />
      <circle cx="47" cy="21" r="2" fill="#B7C7FF" />
    </>
  )
}

function ActionIcon() {
  return (
    <>
      <PandaFace y={27} scale={0.78} />
      <ellipse cx="22" cy="49" rx="8" ry="6" fill="#3A3D3C" transform="rotate(-18 22 49)" />
      <ellipse cx="42" cy="49" rx="8" ry="6" fill="#3A3D3C" transform="rotate(18 42 49)" />
      <path d="M32 40l2.1 4.2 4.6.7-3.3 3.2.8 4.6-4.2-2.2-4.2 2.2.8-4.6-3.3-3.2 4.6-.7Z" fill="#FFB13B" stroke="#FFF4CE" strokeWidth="1.2" />
      <path d="M8 51q5-7 10-2" fill="none" stroke="#FF9A45" strokeLinecap="round" strokeWidth="2.5" />
      <path d="M48 17l3-3" stroke="#FF9A45" strokeLinecap="round" strokeWidth="2.5" />
    </>
  )
}

function ConnectionIcon() {
  return (
    <>
      <PandaFace x={22} y={36} scale={0.62} />
      <PandaFace x={43} y={36} scale={0.62} />
      <path d="M32 21c-6-6-13 3 0 12 13-9 6-18 0-12Z" fill="#F46A96" />
      <path d="M13 51q19 8 38 0" fill="none" stroke="#F8A6BE" strokeLinecap="round" strokeWidth="2.5" />
    </>
  )
}

function BodyScanIcon() {
  return (
    <>
      <PandaFace y={23} scale={0.66} closedEyes />
      <ellipse cx="32" cy="46" rx="14" ry="12" fill="#FFFDF8" />
      <ellipse cx="20" cy="45" rx="6" ry="9" fill="#3A3D3C" transform="rotate(18 20 45)" />
      <ellipse cx="44" cy="45" rx="6" ry="9" fill="#3A3D3C" transform="rotate(-18 44 45)" />
      <circle cx="32" cy="40" r="2" fill="#AF7AF5" />
      <circle cx="32" cy="47" r="2" fill="#C99BFF" />
      <circle cx="32" cy="54" r="2" fill="#E2C7FF" />
      <path d="M9 38h8M47 38h8M8 47h8M48 47h8" stroke="#A66CF3" strokeLinecap="round" strokeWidth="2" opacity="0.75" />
    </>
  )
}

function MusicIcon() {
  return (
    <>
      <PandaFace y={34} scale={0.84} closedEyes />
      <path d="M14 31v-4c0-10 8-17 18-17s18 7 18 17v4" fill="none" stroke="#24BDA9" strokeLinecap="round" strokeWidth="3.5" />
      <rect x="10" y="28" width="7" height="13" rx="3.5" fill="#27C7B4" />
      <rect x="47" y="28" width="7" height="13" rx="3.5" fill="#27C7B4" />
      <path d="M51 12v9c0 3-5 4-6 1-1-3 4-5 6-3M51 12l7-2v8c0 3-5 4-6 1" fill="none" stroke="#FF8C65" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </>
  )
}

export default function PandaTrainingIcon({ type, size = 56, className = '' }) {
  let artwork = <SensoryIcon />
  if (type === 'physiological_sigh') artwork = <BreathIcon />
  if (type === 'micro_behavioral_activation') artwork = <ActionIcon />
  if (type === 'connection_recall') artwork = <ConnectionIcon />
  if (type === 'body_scan') artwork = <BodyScanIcon />
  if (type === 'music_healing') artwork = <MusicIcon />

  return (
    <svg
      aria-hidden="true"
      className={className}
      height={size}
      viewBox="0 0 64 64"
      width={size}
    >
      {artwork}
    </svg>
  )
}
